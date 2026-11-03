"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSale, type SaleLine } from "@/lib/sales";
import { bizError, str, type FormState } from "@/lib/actions";

export async function createSaleAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("CH", "NV");
  let code: string;
  try {
    const items = JSON.parse(str(form.get("items")) || "[]") as SaleLine[];
    const customer = str(form.get("customerId"));
    code = createSale({
      userId: user.id, // người bán lấy từ phiên đăng nhập, không lấy từ form
      customerId: customer ? Number(customer) : null,
      payment: form.get("payment") === "CREDIT" ? "CREDIT" : "CASH",
      items: items.map((i) => ({ productId: Number(i.productId), unit: String(i.unit), qty: Number(i.qty) })),
    });
  } catch (e) {
    return bizError(e);
  }
  redirect(`/ban-hang?ok=${encodeURIComponent(`Đã lưu phiếu ${code}.`)}`);
}
