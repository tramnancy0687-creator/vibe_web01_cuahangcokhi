// Số lượng luôn lưu theo ĐƠN VỊ GỐC của món hàng (con, mét, bao...).
// Tiền lưu số nguyên VND. Thời gian lưu ISO UTC, hiển thị giờ Việt Nam.
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('CH','NV','TK')),
  password_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  failed_logins INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  base_unit TEXT NOT NULL,
  min_stock REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS product_units (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  unit TEXT NOT NULL,
  factor REAL NOT NULL CHECK (factor > 0),
  price INTEGER NOT NULL DEFAULT 0,
  UNIQUE (product_id, unit)
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL CHECK (kind IN ('CONTRACTOR','REGULAR')),
  allow_credit INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS imports (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  invoice_no TEXT NOT NULL DEFAULT '',
  user_id INTEGER NOT NULL REFERENCES users(id),
  total INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS import_items (
  id INTEGER PRIMARY KEY,
  import_id INTEGER NOT NULL REFERENCES imports(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  unit TEXT NOT NULL,
  factor REAL NOT NULL,
  qty REAL NOT NULL,
  base_qty REAL NOT NULL,
  unit_price INTEGER NOT NULL,
  amount INTEGER NOT NULL
);

-- Mỗi dòng nhập sinh ra một lô; giá vốn tính theo lô (FIFO)
CREATE TABLE IF NOT EXISTS batches (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  code TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('IMPORT','RETURN','ADJUST')),
  unit_cost REAL NOT NULL,
  qty_in REAL NOT NULL,
  qty_left REAL NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_batches_fifo ON batches (product_id, qty_left, created_at);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  customer_id INTEGER REFERENCES customers(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  payment TEXT NOT NULL CHECK (payment IN ('CASH','CREDIT')),
  total INTEGER NOT NULL,
  cost_total INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  unit TEXT NOT NULL,
  factor REAL NOT NULL,
  qty REAL NOT NULL,
  base_qty REAL NOT NULL,
  unit_price INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  cost INTEGER NOT NULL,
  returned_base_qty REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS returns (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL DEFAULT '',
  refund TEXT NOT NULL CHECK (refund IN ('DEBT','CASH')),
  total INTEGER NOT NULL,
  cost_total INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS return_items (
  id INTEGER PRIMARY KEY,
  return_id INTEGER NOT NULL REFERENCES returns(id),
  sale_item_id INTEGER NOT NULL REFERENCES sale_items(id),
  base_qty REAL NOT NULL,
  amount INTEGER NOT NULL,
  cost INTEGER NOT NULL
);

-- Sổ công nợ: amount > 0 làm tăng nợ (bán chịu), < 0 làm giảm nợ (trả hàng, thu tiền)
CREATE TABLE IF NOT EXISTS debt_entries (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  kind TEXT NOT NULL CHECK (kind IN ('SALE','RETURN','PAYMENT')),
  ref TEXT NOT NULL DEFAULT '',
  amount INTEGER NOT NULL,
  method TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stocktakes (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('DRAFT','DONE')),
  created_at TEXT NOT NULL,
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS stocktake_items (
  id INTEGER PRIMARY KEY,
  stocktake_id INTEGER NOT NULL REFERENCES stocktakes(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  book_qty REAL NOT NULL,
  actual_qty REAL,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  UNIQUE (stocktake_id, product_id)
);
`;

// Các con số nghiệp vụ, chủ cửa hàng chỉnh được (không hard-code trong code)
export const DEFAULT_SETTINGS: Record<string, string> = {
  slow_moving_months: "12",
  overdue_debt_days: "30",
  login_max_failures: "5",
  login_lock_minutes: "15",
  session_hours: "12",
};
