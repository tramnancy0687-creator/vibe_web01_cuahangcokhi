"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { BizError } from "@/lib/db";
import { saveProduct, setProductActive } from "@/lib/catalog";
import { act, num, str } from "@/lib/actions";

export async function saveProductAction(form: FormData) {
  await requireUser("CH");
  const idRaw = str(form.get("id"));
  const units = [...form.keys()]
    .filter((k) => k.startsWith("unit_"))
    .map((k) => {
      const i = k.slice(5);
      return { unit: str(form.get(k)), factor: num(form.get(`factor_${i}`)), price: num(form.get(`price_${i}`)) || 0 };
    });
  let savedId: number;
  try {
    savedId = saveProduct({
      id: idRaw ? Number(idRaw) : null,
      code: str(form.get("code")), name: str(form.get("name")), category: str(form.get("category")),
      baseUnit: str(form.get("baseUnit")), minStock: num(form.get("minStock")) || 0, units,
    });
  } catch (e) {
    if (e instanceof BizError) redirect(`/hang-hoa?id=${idRaw || "moi"}&err=${encodeURIComponent(e.message)}`);
    throw e;
  }
  redirect(`/hang-hoa?id=${savedId}&ok=${encodeURIComponent("Đã lưu món hàng.")}`);
}

export async function toggleProductAction(form: FormData) {
  await requireUser("CH");
  const id = Number(form.get("id"));
  const active = form.get("active") === "1";
  act(`/hang-hoa?id=${id}`, () => {
    setProductActive(id, active);
    return active ? "Đã mở bán lại." : "Đã ngừng kinh doanh món này.";
  });
}
