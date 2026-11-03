import { all, BizError, get, run, tx } from "./db";
import { hashPassword, verifyPassword, type Role } from "./auth";
import type { Product, Unit } from "./inventory";

// ---------- Hàng hóa & đơn vị tính (UC-02) ----------

export function getProduct(id: number) {
  const p = get<Product>("SELECT * FROM products WHERE id = ?", id);
  if (!p) return null;
  return { ...p, units: all<Unit>("SELECT * FROM product_units WHERE product_id = ? ORDER BY factor", id) };
}

export type ProductInput = {
  id: number | null; code: string; name: string; category: string; baseUnit: string; minStock: number;
  units: { unit: string; factor: number; price: number }[];
};

export function saveProduct(input: ProductInput): number {
  const code = input.code.trim().toUpperCase();
  const name = input.name.trim();
  const baseUnit = input.baseUnit.trim();
  if (!code || !name || !baseUnit) throw new BizError("Nhập đủ mã, tên và đơn vị gốc.");
  if (!(input.minStock >= 0)) throw new BizError("Tồn tối thiểu không hợp lệ.");

  const units = input.units
    .map((u) => ({ unit: u.unit.trim(), factor: u.factor, price: Math.round(u.price) }))
    .filter((u) => u.unit);
  // Đơn vị gốc luôn có hệ số 1
  const base = units.find((u) => u.unit === baseUnit);
  if (base) base.factor = 1;
  else units.unshift({ unit: baseUnit, factor: 1, price: 0 });
  if (units.some((u) => !(u.factor > 0) || !(u.price >= 0))) throw new BizError("Hệ số quy đổi phải > 0 và giá không âm.");
  if (new Set(units.map((u) => u.unit)).size !== units.length) throw new BizError("Mỗi đơn vị chỉ khai báo một lần.");

  const dup = get<{ id: number }>("SELECT id FROM products WHERE code = ? AND id IS NOT ?", code, input.id);
  if (dup) throw new BizError(`Mã ${code} đã được dùng cho món khác.`);

  return tx(() => {
    let id = input.id;
    if (id) {
      const old = get<Product>("SELECT * FROM products WHERE id = ?", id);
      if (!old) throw new BizError("Không tìm thấy món hàng.");
      const hasStock = get("SELECT 1 FROM batches WHERE product_id = ? LIMIT 1", id);
      if (hasStock && old.base_unit !== baseUnit) throw new BizError("Món đã có tồn kho, không đổi được đơn vị gốc.");
      run("UPDATE products SET code = ?, name = ?, category = ?, base_unit = ?, min_stock = ? WHERE id = ?",
        code, name, input.category.trim(), baseUnit, input.minStock, id);
      run("DELETE FROM product_units WHERE product_id = ?", id);
    } else {
      id = Number(run("INSERT INTO products (code, name, category, base_unit, min_stock) VALUES (?, ?, ?, ?, ?)",
        code, name, input.category.trim(), baseUnit, input.minStock).lastInsertRowid);
    }
    for (const u of units) {
      run("INSERT INTO product_units (product_id, unit, factor, price) VALUES (?, ?, ?, ?)", id, u.unit, u.factor, u.price);
    }
    return id;
  });
}

export function setProductActive(id: number, active: boolean) {
  run("UPDATE products SET active = ? WHERE id = ?", active ? 1 : 0, id);
}

// ---------- Khách hàng & nhà cung cấp (UC-03, UC-04) ----------

export type Customer = { id: number; name: string; phone: string; kind: string; allow_credit: number; active: number; balance: number };

export function listCustomers(): Customer[] {
  return all<Customer>(
    `SELECT c.*, COALESCE((SELECT SUM(amount) FROM debt_entries d WHERE d.customer_id = c.id), 0) AS balance
     FROM customers c ORDER BY c.active DESC, c.name`,
  );
}

export function saveCustomer(input: { id: number | null; name: string; phone: string; kind: string; allowCredit: boolean }) {
  const name = input.name.trim();
  if (!name) throw new BizError("Nhập tên khách hàng.");
  if (!["CONTRACTOR", "REGULAR"].includes(input.kind)) throw new BizError("Loại khách không hợp lệ.");
  if (input.id) {
    run("UPDATE customers SET name = ?, phone = ?, kind = ?, allow_credit = ? WHERE id = ?",
      name, input.phone.trim(), input.kind, input.allowCredit ? 1 : 0, input.id);
  } else {
    run("INSERT INTO customers (name, phone, kind, allow_credit) VALUES (?, ?, ?, ?)",
      name, input.phone.trim(), input.kind, input.allowCredit ? 1 : 0);
  }
}

export function setCustomerActive(id: number, active: boolean) {
  const owed = get<{ s: number }>("SELECT COALESCE(SUM(amount), 0) AS s FROM debt_entries WHERE customer_id = ?", id)!.s;
  if (!active && owed > 0) throw new BizError("Khách còn nợ, không ngừng giao dịch được. Có thể tắt \"Mua chịu\" thay thế.");
  run("UPDATE customers SET active = ? WHERE id = ?", active ? 1 : 0, id);
}

export type Supplier = { id: number; name: string; contact: string; phone: string; note: string; active: number; last_import: string | null };

export function listSuppliers(): Supplier[] {
  return all<Supplier>(
    `SELECT s.*, (SELECT MAX(created_at) FROM imports i WHERE i.supplier_id = s.id) AS last_import
     FROM suppliers s ORDER BY s.active DESC, s.name`,
  );
}

export function saveSupplier(input: { id: number | null; name: string; contact: string; phone: string; note: string }) {
  const name = input.name.trim();
  if (!name) throw new BizError("Nhập tên nhà cung cấp.");
  if (input.id) {
    run("UPDATE suppliers SET name = ?, contact = ?, phone = ?, note = ? WHERE id = ?",
      name, input.contact.trim(), input.phone.trim(), input.note.trim(), input.id);
  } else {
    run("INSERT INTO suppliers (name, contact, phone, note) VALUES (?, ?, ?, ?)",
      name, input.contact.trim(), input.phone.trim(), input.note.trim());
  }
}

// ---------- Tài khoản nhân viên (UC-05) ----------

export type Account = { id: number; username: string; full_name: string; role: Role; active: number };

export function listUsers(): Account[] {
  return all<Account>("SELECT id, username, full_name, role, active FROM users ORDER BY active DESC, role, full_name");
}

function checkPassword(pw: string) {
  if (pw.length < 6) throw new BizError("Mật khẩu tối thiểu 6 ký tự.");
}

export function createUser(input: { username: string; fullName: string; role: Role; password: string }) {
  const username = input.username.trim().toLowerCase();
  if (!/^[a-z0-9._]{3,}$/.test(username)) throw new BizError("Tên đăng nhập tối thiểu 3 ký tự: chữ thường, số, dấu chấm.");
  if (!input.fullName.trim()) throw new BizError("Nhập họ tên.");
  if (!["CH", "NV", "TK"].includes(input.role)) throw new BizError("Vai trò không hợp lệ.");
  checkPassword(input.password);
  if (get("SELECT 1 FROM users WHERE username = ?", username)) throw new BizError(`Tên đăng nhập ${username} đã có.`);
  run("INSERT INTO users (username, full_name, role, password_hash) VALUES (?, ?, ?, ?)",
    username, input.fullName.trim(), input.role, hashPassword(input.password));
}

export function updateUser(actorId: number, id: number, input: { fullName: string; role: Role }) {
  if (id === actorId && input.role !== "CH") throw new BizError("Không tự bỏ quyền chủ của chính mình.");
  if (!["CH", "NV", "TK"].includes(input.role)) throw new BizError("Vai trò không hợp lệ.");
  run("UPDATE users SET full_name = ?, role = ? WHERE id = ?", input.fullName.trim(), input.role, id);
}

/** Khóa thay vì xóa, để phiếu cũ vẫn giữ tên nhân viên cho báo cáo doanh số */
export function setUserActive(actorId: number, id: number, active: boolean) {
  if (id === actorId) throw new BizError("Không tự khóa tài khoản của chính mình.");
  tx(() => {
    run("UPDATE users SET active = ? WHERE id = ?", active ? 1 : 0, id);
    if (!active) run("DELETE FROM sessions WHERE user_id = ?", id);
  });
}

export function resetPassword(id: number, password: string) {
  checkPassword(password);
  tx(() => {
    run("UPDATE users SET password_hash = ?, failed_logins = 0, locked_until = NULL WHERE id = ?", hashPassword(password), id);
    run("DELETE FROM sessions WHERE user_id = ?", id);
  });
}

export function changeOwnPassword(id: number, current: string, next: string) {
  const u = get<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", id);
  if (!u) throw new BizError("Không tìm thấy tài khoản.");
  if (!verifyPassword(current, u.password_hash)) throw new BizError("Mật khẩu hiện tại không đúng.");
  checkPassword(next);
  run("UPDATE users SET password_hash = ? WHERE id = ?", hashPassword(next), id);
}
