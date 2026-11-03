import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_SETTINGS, SCHEMA } from "./schema";
import { seed } from "./seed";

type Param = string | number | bigint | null;

// Trên Vercel chỉ /tmp ghi được, và bị xóa khi máy chủ khởi động lại: bản demo tự nạp lại dữ liệu mẫu
const DB_PATH = process.env.DB_PATH
  ?? (process.env.VERCEL ? "/tmp/cuahang.db" : path.join(process.cwd(), "data", "cuahang.db"));

// Giữ một kết nối duy nhất, kể cả khi dev server hot-reload
const g = globalThis as unknown as { __cuahangDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (g.__cuahangDb) return g.__cuahangDb;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const d = new DatabaseSync(DB_PATH);
  d.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  d.exec(SCHEMA);
  const ins = d.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) ins.run(k, v);
  g.__cuahangDb = d;
  const { n } = d.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (n === 0) seed();
  return d;
}

// node:sqlite trả về object không có prototype; React không cho truyền loại này
// sang Client Component, nên chuyển thành object thường ngay tại đây.
export function all<T>(sql: string, ...params: Param[]): T[] {
  return db().prepare(sql).all(...params).map((r) => ({ ...r })) as T[];
}

export function get<T>(sql: string, ...params: Param[]): T | undefined {
  const r = db().prepare(sql).get(...params);
  return (r ? { ...r } : undefined) as T | undefined;
}

export function run(sql: string, ...params: Param[]) {
  return db().prepare(sql).run(...params);
}

let depth = 0;

// Gom nhiều thao tác thành một giao dịch; lỗi giữa chừng thì hoàn tác tất cả
export function tx<T>(fn: () => T): T {
  const d = db();
  if (depth > 0) return fn();
  d.exec("BEGIN IMMEDIATE");
  depth++;
  try {
    const result = fn();
    d.exec("COMMIT");
    return result;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  } finally {
    depth--;
  }
}

export function setting(key: string): number {
  const row = get<{ value: string }>("SELECT value FROM settings WHERE key = ?", key);
  return Number(row?.value ?? DEFAULT_SETTINGS[key]);
}

// Sinh mã chứng từ theo ngày, vd. PB-261102-007
export function nextCode(table: string, prefix: string, at: Date = new Date()): string {
  const vn = new Date(at.getTime() + 7 * 3600_000).toISOString();
  const day = vn.slice(2, 4) + vn.slice(5, 7) + vn.slice(8, 10);
  const like = `${prefix}-${day}-%`;
  const row = get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table} WHERE code LIKE ?`, like);
  return `${prefix}-${day}-${String((row?.n ?? 0) + 1).padStart(3, "0")}`;
}

/** Lỗi nghiệp vụ: thông điệp hiển thị thẳng cho người dùng */
export class BizError extends Error {}
