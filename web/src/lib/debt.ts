import { all, BizError, get, run } from "./db";

export function balance(customerId: number): number {
  return get<{ s: number }>("SELECT COALESCE(SUM(amount), 0) AS s FROM debt_entries WHERE customer_id = ?", customerId)!.s;
}

/**
 * "Nợ từ ngày nào": tiền thu và hàng trả được trừ vào khoản nợ cũ nhất trước.
 * Trả về ngày của khoản nợ cũ nhất chưa trả hết.
 */
export function debtSince(customerId: number): string | null {
  const rows = all<{ amount: number; created_at: string }>(
    "SELECT amount, created_at FROM debt_entries WHERE customer_id = ? ORDER BY created_at, id", customerId,
  );
  let credit = rows.filter((r) => r.amount < 0).reduce((s, r) => s - r.amount, 0);
  for (const r of rows.filter((r) => r.amount > 0)) {
    if (credit >= r.amount) credit -= r.amount;
    else return r.created_at;
  }
  return null;
}

export type Debtor = { id: number; name: string; phone: string; balance: number; since: string | null };

export function debtors(): Debtor[] {
  return all<Omit<Debtor, "since">>(
    `SELECT c.id, c.name, c.phone, SUM(d.amount) AS balance FROM customers c
     JOIN debt_entries d ON d.customer_id = c.id GROUP BY c.id HAVING balance > 0`,
  )
    .map((d) => ({ ...d, since: debtSince(d.id) }))
    .sort((a, b) => (a.since ?? "").localeCompare(b.since ?? ""));
}

export function ledger(customerId: number) {
  let running = 0;
  return all<{ id: number; kind: string; ref: string; amount: number; method: string; note: string; created_at: string; user: string }>(
    `SELECT d.id, d.kind, d.ref, d.amount, d.method, d.note, d.created_at, u.full_name AS user
     FROM debt_entries d JOIN users u ON u.id = d.user_id WHERE d.customer_id = ? ORDER BY d.created_at, d.id`,
    customerId,
  ).map((e) => ({ ...e, running: (running += e.amount) }));
}

/** UC-12: thu nợ, cho phép thu một phần, không thu quá số đang nợ */
export function recordPayment(
  input: { userId: number; customerId: number; amount: number; method: string; note: string },
  at = new Date(),
) {
  const amount = Math.round(input.amount);
  if (!(amount > 0)) throw new BizError("Nhập số tiền thu lớn hơn 0.");
  const owed = balance(input.customerId);
  if (amount > owed) throw new BizError(`Khách chỉ đang nợ ${owed.toLocaleString("vi-VN")} đ.`);
  run(
    `INSERT INTO debt_entries (customer_id, kind, ref, amount, method, note, user_id, created_at)
     VALUES (?, 'PAYMENT', 'Thu tiền', ?, ?, ?, ?, ?)`,
    input.customerId, -amount, input.method, input.note.trim(), input.userId, at.toISOString(),
  );
}
