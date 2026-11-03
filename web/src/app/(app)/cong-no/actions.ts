"use server";

import { requireUser } from "@/lib/auth";
import { recordPayment } from "@/lib/debt";
import { act, num, str } from "@/lib/actions";
import { money } from "@/lib/format";

export async function recordPaymentAction(form: FormData) {
  const user = await requireUser("CH", "NV");
  const customerId = Number(form.get("customerId"));
  const amount = num(form.get("amount"));
  act(`/cong-no?id=${customerId}`, () => {
    recordPayment({ userId: user.id, customerId, amount, method: str(form.get("method")), note: str(form.get("note")) });
    return `Đã ghi nhận thu ${money(amount)} đ.`;
  });
}
