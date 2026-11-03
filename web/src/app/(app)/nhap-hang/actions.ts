"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createImport, type ImportLine } from "@/lib/inventory";
import { bizError, str, type FormState } from "@/lib/actions";

export async function createImportAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("CH", "TK");
  let code: string;
  try {
    const items = JSON.parse(str(form.get("items")) || "[]") as ImportLine[];
    code = createImport({
      userId: user.id,
      supplierId: Number(form.get("supplierId")),
      invoiceNo: str(form.get("invoiceNo")),
      items: items.map((i) => ({ productId: Number(i.productId), unit: String(i.unit), qty: Number(i.qty), unitPrice: Number(i.unitPrice) })),
    });
  } catch (e) {
    return bizError(e);
  }
  redirect(`/nhap-hang?ok=${encodeURIComponent(`Đã lưu phiếu nhập ${code} và cộng tồn kho.`)}`);
}
