import { all, BizError, get, nextCode, run, tx } from "./db";
import { addBatch, consumeFIFO, findUnit } from "./inventory";
import { balance } from "./debt";

export type SaleLine = { productId: number; unit: string; qty: number };

/** UC-07 (kèm UC-08 ghi nợ, UC-09 quy đổi đơn vị): giá luôn lấy từ danh mục, không tin giá gửi lên */
export function createSale(
  input: { userId: number; customerId: number | null; payment: "CASH" | "CREDIT"; items: SaleLine[] },
  at = new Date(),
): string {
  const items = input.items.filter((i) => i.qty > 0);
  if (!items.length) throw new BizError("Phiếu bán chưa có món nào.");

  if (input.customerId !== null) {
    const c = get<{ allow_credit: number; active: number; name: string }>(
      "SELECT allow_credit, active, name FROM customers WHERE id = ?", input.customerId,
    );
    if (!c || !c.active) throw new BizError("Không tìm thấy khách hàng.");
    if (input.payment === "CREDIT" && !c.allow_credit) throw new BizError(`${c.name} chưa được phép mua chịu.`);
  } else if (input.payment === "CREDIT") {
    throw new BizError("Khách lẻ phải trả tiền ngay. Chọn nhà thầu để ghi nợ.");
  }

  return tx(() => {
    const code = nextCode("sales", "PB", at);
    const lines = items.map((i) => {
      const u = findUnit(i.productId, i.unit);
      if (!u.product.active) throw new BizError(`${u.product.name} đã ngừng kinh doanh.`);
      const base = i.qty * u.factor;
      return { ...i, factor: u.factor, base, price: u.price, amount: Math.round(i.qty * u.price), cost: consumeFIFO(i.productId, base) };
    });
    const total = lines.reduce((s, l) => s + l.amount, 0);
    const cost = lines.reduce((s, l) => s + l.cost, 0);
    const sale = run(
      "INSERT INTO sales (code, customer_id, user_id, payment, total, cost_total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      code, input.customerId, input.userId, input.payment, total, cost, at.toISOString(),
    );
    for (const l of lines) {
      run(
        `INSERT INTO sale_items (sale_id, product_id, unit, factor, qty, base_qty, unit_price, amount, cost)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        sale.lastInsertRowid, l.productId, l.unit, l.factor, l.qty, l.base, l.price, l.amount, l.cost,
      );
    }
    if (input.payment === "CREDIT") {
      run(
        `INSERT INTO debt_entries (customer_id, kind, ref, amount, user_id, created_at) VALUES (?, 'SALE', ?, ?, ?, ?)`,
        input.customerId, code, total, input.userId, at.toISOString(),
      );
    }
    return code;
  });
}

export function recentSales(limit = 10, userId?: number) {
  return all<{ code: string; customer: string | null; user: string; payment: string; total: number; created_at: string }>(
    `SELECT s.code, c.name AS customer, u.full_name AS user, s.payment, s.total, s.created_at
     FROM sales s LEFT JOIN customers c ON c.id = s.customer_id JOIN users u ON u.id = s.user_id
     ${userId ? "WHERE s.user_id = ?" : ""} ORDER BY s.created_at DESC LIMIT ?`,
    ...(userId ? [userId, limit] : [limit]),
  );
}

export type SaleForReturn = {
  id: number; code: string; created_at: string; customer_id: number | null; customer: string | null; user: string;
  items: { id: number; name: string; unit: string; factor: number; qty: number; unit_price: number; remaining: number }[];
};

export function findSale(code: string): SaleForReturn | null {
  const s = get<Omit<SaleForReturn, "items">>(
    `SELECT s.id, s.code, s.created_at, s.customer_id, c.name AS customer, u.full_name AS user
     FROM sales s LEFT JOIN customers c ON c.id = s.customer_id JOIN users u ON u.id = s.user_id WHERE s.code = ?`,
    code.trim().toUpperCase(),
  );
  if (!s) return null;
  const items = all<SaleForReturn["items"][number]>(
    `SELECT i.id, p.name, i.unit, i.factor, i.qty, i.unit_price, (i.base_qty - i.returned_base_qty) / i.factor AS remaining
     FROM sale_items i JOIN products p ON p.id = i.product_id WHERE i.sale_id = ?`,
    s.id,
  );
  return { ...s, items };
}

/** UC-10 (kèm UC-11): chỉ nhận hàng còn nguyên; khách đang nợ thì trừ vào công nợ */
export function createReturn(
  input: { userId: number; saleId: number; reason: string; lines: { saleItemId: number; qty: number; intact: boolean }[] },
  at = new Date(),
) {
  const lines = input.lines.filter((l) => l.qty > 0);
  if (!lines.length) throw new BizError("Chọn ít nhất một món và số lượng trả.");
  if (lines.some((l) => !l.intact)) throw new BizError("Chỉ nhận lại hàng còn nguyên. Bỏ chọn món không còn nguyên.");

  return tx(() => {
    const sale = get<{ id: number; customer_id: number | null }>("SELECT id, customer_id FROM sales WHERE id = ?", input.saleId);
    if (!sale) throw new BizError("Không tìm thấy phiếu bán.");
    const code = nextCode("returns", "TH", at);
    const rows = lines.map((l) => {
      const it = get<{ id: number; product_id: number; factor: number; base_qty: number; returned_base_qty: number; unit_price: number; cost: number }>(
        "SELECT id, product_id, factor, base_qty, returned_base_qty, unit_price, cost FROM sale_items WHERE id = ? AND sale_id = ?",
        l.saleItemId, sale.id,
      );
      if (!it) throw new BizError("Món trả không thuộc phiếu bán này.");
      const base = l.qty * it.factor;
      if (base > it.base_qty - it.returned_base_qty + 1e-9) throw new BizError("Số lượng trả vượt quá số đã mua.");
      return { it, base, amount: Math.round(l.qty * it.unit_price), cost: Math.round((it.cost * base) / it.base_qty) };
    });
    const total = rows.reduce((s, r) => s + r.amount, 0);
    const cost = rows.reduce((s, r) => s + r.cost, 0);

    const owed = sale.customer_id ? balance(sale.customer_id) : 0;
    const toDebt = Math.min(total, Math.max(owed, 0));
    const ret = run(
      `INSERT INTO returns (code, sale_id, user_id, reason, refund, total, cost_total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      code, sale.id, input.userId, input.reason.trim(), toDebt > 0 ? "DEBT" : "CASH", total, cost, at.toISOString(),
    );
    for (const r of rows) {
      run("INSERT INTO return_items (return_id, sale_item_id, base_qty, amount, cost) VALUES (?, ?, ?, ?, ?)",
        ret.lastInsertRowid, r.it.id, r.base, r.amount, r.cost);
      run("UPDATE sale_items SET returned_base_qty = returned_base_qty + ? WHERE id = ?", r.base, r.it.id);
      // Hàng trả nhập lại kho với đúng giá vốn lúc bán
      addBatch(r.it.product_id, "RETURN", code, r.cost / r.base, r.base, at);
    }
    if (toDebt > 0) {
      run(
        `INSERT INTO debt_entries (customer_id, kind, ref, amount, user_id, created_at) VALUES (?, 'RETURN', ?, ?, ?, ?)`,
        sale.customer_id, code, -toDebt, input.userId, at.toISOString(),
      );
    }
    return { code, total, toDebt, cash: total - toDebt };
  });
}
