import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { get, run, setting } from "./db";

export type Role = "CH" | "NV" | "TK";
export type User = { id: number; username: string; full_name: string; role: Role };

const COOKIE = "sid";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hash, "hex"));
}

/** UC-01: trả về thông báo lỗi, hoặc null khi đăng nhập thành công */
export async function login(username: string, password: string): Promise<string | null> {
  const GENERIC = "Sai tên đăng nhập hoặc mật khẩu.";
  const u = get<{ id: number; password_hash: string; active: number; failed_logins: number; locked_until: string | null }>(
    "SELECT id, password_hash, active, failed_logins, locked_until FROM users WHERE username = ?",
    username.trim().toLowerCase(),
  );
  if (!u || !u.active) return GENERIC;
  if (u.locked_until && u.locked_until > new Date().toISOString()) {
    return "Tài khoản tạm khóa do nhập sai nhiều lần. Thử lại sau ít phút.";
  }
  if (!verifyPassword(password, u.password_hash)) {
    const fails = u.failed_logins + 1;
    const lock = fails >= setting("login_max_failures")
      ? new Date(Date.now() + setting("login_lock_minutes") * 60_000).toISOString()
      : null;
    run("UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?", lock ? 0 : fails, lock, u.id);
    return GENERIC;
  }
  run("UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = ?", u.id);

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + setting("session_hours") * 3600_000);
  run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", token, u.id, expires.toISOString());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", expires });
  return null;
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE token = ?", token);
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return get<User>(
    `SELECT u.id, u.username, u.full_name, u.role FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > ? AND u.active = 1`,
    token, new Date().toISOString(),
  ) ?? null;
}

/**
 * Bắt buộc đăng nhập và đúng vai trò. Gọi ở MỌI trang và MỌI server action:
 * ẩn menu chưa đủ, phải chặn ở phía server.
 */
export async function requireUser(...roles: Role[]): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (roles.length && !roles.includes(user.role)) redirect("/?denied=1");
  return user;
}
