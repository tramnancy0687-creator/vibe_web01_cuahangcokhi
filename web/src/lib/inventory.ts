import { all, BizError, get, nextCode, run, tx } from "./db";

export type Product = {
  id: number; code: string; name: string; category: string;
  base_unit: string; min_stock: number; active: number;
};
export type Unit = { id: number; product_id: number; unit: string; factor: number; price: number };
export type ProductWithStock = Product & { stock: number; units: Unit[] };

const EPS = 1e-9;

export function stockOf(productId: number): number {
  return get<{ s: number }>("SELECT COALESCE(SUM(qty_left), 0) AS s FROM batches WHERE product_id = ?", productId)!.s;
}

export function productsWithStock(onlyActive = true): ProductWithStock[] {
  const products = all<Product & { stock: number }>(
    `SELECT p.*, COALESCE((SELECT SUM(qty_left) FROM batches b WHERE b.product_id = p.id), 0) AS stock
     FROM products p ${onlyActive ? "WHERE p.active = 1" : ""} ORDER BY p.category, p.name`,
  );
  const units = all<Unit>("SELECT * FROM product_units ORDER BY factor");
  return products.map((p) => ({ ...p, units: units.filter((u) => u.product_id === p.id) }));
}

/** UC-09: tìm đơn vị bán/nhập của món hàng để quy đổi về đơn vị gốc */
export function findUnit(productId: number, unit: string): Unit & { product: Product } {
  const product = get<Product>("SELECT * FROM products WHERE id = ?", productId);
  if (!product) throw new BizError("Không tìm thấy món hàng.");
  const u = get<Unit>("SELECT * FROM product_units WHERE product_id = ? AND unit = ?", productId, unit);
  if (!u) throw new BizError(`${product.name} không có đơn vị "${unit}".`);
  return { ...u, product };
}

export function addBatch(productId: number, source: "IMPORT" | "RETURN" | "ADJUST", code: string,
  unitCost: number, baseQty: number, at: Date) {
  run(
    "INSERT INTO batches (product_id, code, source, unit_cost, qty_in, qty_left, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    productId, code, source, unitCost, baseQty, baseQty, at.toISOString(),
  );
}

/**
 * Xuất kho theo FIFO: lấy từ lô nhập trước. Trả về giá vốn của lượng xuất.
 * Đổi sang giá bình quân thì chỉ cần sửa hàm này.
 */
export function consumeFIFO(productId: number, baseQty: number): number {
  const batches = all<{ id: number; qty_left: number; unit_cost: number }>(
    "SELECT id, qty_left, unit_cost FROM batches WHERE product_id = ? AND qty_left > 0 ORDER BY created_at, id",
    productId,
  );
  let need = baseQty;
  let cost = 0;
  for (const b of batches) {
    if (need <= EPS) break;
    const take = Math.min(need, b.qty_left);
    run("UPDATE batches SET qty_left = qty_left - ? WHERE id = ?", take, b.id);
    cost += take * b.unit_cost;
    need -= take;
  }
  if (need > EPS) {
    const p = get<Product>("SELECT * FROM products WHERE id = ?", productId)!;
    throw new BizError(`Không đủ hàng: ${p.name} chỉ còn ${stockOf(productId) + baseQty - need} ${p.base_unit}.`);
  }
  return Math.round(cost);
}

function lastUnitCost(productId: number): number {
  return get<{ c: number }>(
    "SELECT unit_cost AS c FROM batches WHERE product_id = ? ORDER BY created_at DESC, id DESC LIMIT 1", productId,
  )?.c ?? 0;
}

export type ImportLine = { productId: number; unit: string; qty: number; unitPrice: number };

/** UC-13: lập phiếu nhập, mỗi dòng sinh một lô với giá nhập riêng */
export function createImport(
  input: { userId: number; supplierId: number; invoiceNo: string; items: ImportLine[] },
  at = new Date(),
): string {
  const items = input.items.filter((i) => i.qty > 0);
  if (!items.length) throw new BizError("Phiếu nhập chưa có món nào.");
  if (!get("SELECT id FROM suppliers WHERE id = ? AND active = 1", input.supplierId)) {
    throw new BizError("Chọn nhà cung cấp.");
  }
  if (items.some((i) => !(i.unitPrice >= 0))) throw new BizError("Giá nhập không hợp lệ.");

  return tx(() => {
    const code = nextCode("imports", "PN", at);
    const lines = items.map((i) => {
      const u = findUnit(i.productId, i.unit);
      return { ...i, factor: u.factor, base: i.qty * u.factor, amount: Math.round(i.qty * i.unitPrice) };
    });
    const total = lines.reduce((s, l) => s + l.amount, 0);
    const imp = run(
      "INSERT INTO imports (code, supplier_id, invoice_no, user_id, total, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      code, input.supplierId, input.invoiceNo.trim(), input.userId, total, at.toISOString(),
    );
    lines.forEach((l, idx) => {
      run(
        `INSERT INTO import_items (import_id, product_id, unit, factor, qty, base_qty, unit_price, amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        imp.lastInsertRowid, l.productId, l.unit, l.factor, l.qty, l.base, l.unitPrice, l.amount,
      );
      addBatch(l.productId, "IMPORT", `L${code.slice(2)}-${idx + 1}`, l.unitPrice / l.factor, l.base, at);
    });
    return code;
  });
}

export function recentImports(limit = 10) {
  return all<{ code: string; supplier: string; user: string; total: number; created_at: string; lines: number }>(
    `SELECT i.code, s.name AS supplier, u.full_name AS user, i.total, i.created_at,
            (SELECT COUNT(*) FROM import_items WHERE import_id = i.id) AS lines
     FROM imports i JOIN suppliers s ON s.id = i.supplier_id JOIN users u ON u.id = i.user_id
     ORDER BY i.created_at DESC LIMIT ?`,
    limit,
  );
}

// ---------- Kiểm kê (UC-14, UC-15) ----------

export type StocktakeItem = {
  id: number; product_id: number; name: string; code: string; category: string; base_unit: string;
  book_qty: number; actual_qty: number | null; reason: string; status: string;
};

export function draftStocktake() {
  return get<{ id: number; code: string; created_at: string; user: string }>(
    `SELECT s.id, s.code, s.created_at, u.full_name AS user FROM stocktakes s JOIN users u ON u.id = s.user_id
     WHERE s.status = 'DRAFT' ORDER BY s.id DESC LIMIT 1`,
  );
}

export function openStocktake(userId: number, at = new Date()): number {
  const existing = draftStocktake();
  if (existing) return existing.id;
  return tx(() => {
    const code = nextCode("stocktakes", "KK", at);
    const st = run("INSERT INTO stocktakes (code, user_id, status, created_at) VALUES (?, ?, 'DRAFT', ?)",
      code, userId, at.toISOString());
    for (const p of productsWithStock()) {
      run("INSERT INTO stocktake_items (stocktake_id, product_id, book_qty) VALUES (?, ?, ?)",
        st.lastInsertRowid, p.id, p.stock);
    }
    return Number(st.lastInsertRowid);
  });
}

export function stocktakeItems(stocktakeId: number): StocktakeItem[] {
  return all<StocktakeItem>(
    `SELECT i.id, i.product_id, p.name, p.code, p.category, p.base_unit, i.book_qty, i.actual_qty, i.reason, i.status
     FROM stocktake_items i JOIN products p ON p.id = i.product_id
     WHERE i.stocktake_id = ? ORDER BY p.category, p.name`,
    stocktakeId,
  );
}

export function saveStocktake(
  stocktakeId: number,
  entries: { itemId: number; actual: number | null; reason: string }[],
  finish: boolean,
  at = new Date(),
) {
  // Bước 1: luôn lưu số đếm, để lỗi khi chốt không làm mất số thủ kho vừa nhập
  tx(() => {
    const st = get<{ status: string }>("SELECT status FROM stocktakes WHERE id = ?", stocktakeId);
    if (st?.status !== "DRAFT") throw new BizError("Đợt kiểm kê này đã hoàn tất.");
    for (const e of entries) {
      if (e.actual !== null && !(e.actual >= 0)) throw new BizError("Số thực tế không hợp lệ.");
      run("UPDATE stocktake_items SET actual_qty = ?, reason = ? WHERE id = ? AND stocktake_id = ?",
        e.actual, e.reason.trim(), e.itemId, stocktakeId);
    }
  });
  if (!finish) return;
  // Bước 2: chốt đợt kiểm kê
  tx(() => {
    // Lấy lại số sổ sách tại lúc chốt, vì trong lúc đếm cửa hàng vẫn bán
    for (const it of stocktakeItems(stocktakeId)) {
      const book = stockOf(it.product_id);
      run("UPDATE stocktake_items SET book_qty = ? WHERE id = ?", book, it.id);
      if (it.actual_qty !== null && Math.abs(it.actual_qty - book) > EPS && !it.reason) {
        throw new BizError(`${it.name}: số thực tế lệch sổ sách, phải ghi lý do.`);
      }
    }
    run("UPDATE stocktakes SET status = 'DONE', finished_at = ? WHERE id = ?", at.toISOString(), stocktakeId);
  });
}

/** Chủ duyệt chỗ lệch: điều chỉnh tồn kho theo số thực tế */
export function reviewDiff(itemId: number, approve: boolean, at = new Date()) {
  tx(() => {
    const it = get<{ product_id: number; book_qty: number; actual_qty: number | null; status: string; code: string }>(
      `SELECT i.product_id, i.book_qty, i.actual_qty, i.status, s.code FROM stocktake_items i
       JOIN stocktakes s ON s.id = i.stocktake_id WHERE i.id = ? AND s.status = 'DONE'`,
      itemId,
    );
    if (!it || it.status !== "PENDING" || it.actual_qty === null) throw new BizError("Dòng này không cần duyệt.");
    if (approve) {
      const diff = it.actual_qty - it.book_qty;
      if (diff > EPS) addBatch(it.product_id, "ADJUST", it.code, lastUnitCost(it.product_id), diff, at);
      if (diff < -EPS) consumeFIFO(it.product_id, -diff);
    }
    run("UPDATE stocktake_items SET status = ? WHERE id = ?", approve ? "APPROVED" : "REJECTED", itemId);
  });
}
