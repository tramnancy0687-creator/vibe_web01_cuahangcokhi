"use server";

import { requireUser } from "@/lib/auth";
import { createReturn } from "@/lib/sales";
import { act, num, str } from "@/lib/actions";
import { money } from "@/lib/format";

export async function createReturnAction(form: FormData) {
  const user = await requireUser("CH", "NV");
  const saleCode = str(form.get("saleCode"));
  const lines = [...form.keys()]
    .filter((k) => k.startsWith("qty_"))
    .map((k) => {
      const id = Number(k.slice(4));
      return { saleItemId: id, qty: num(form.get(k)) || 0, intact: form.get(`intact_${id}`) === "on" };
    });

  act(`/tra-hang?code=${encodeURIComponent(saleCode)}`, () => {
    const r = createReturn({ userId: user.id, saleId: Number(form.get("saleId")), reason: str(form.get("reason")), lines });
    const parts = [r.toDebt > 0 && `trừ công nợ ${money(r.toDebt)} đ`, r.cash > 0 && `hoàn tiền mặt ${money(r.cash)} đ`].filter(Boolean);
    return `Đã nhận hàng trả ${r.code}: ${parts.join(", ")}.`;
  });
}
