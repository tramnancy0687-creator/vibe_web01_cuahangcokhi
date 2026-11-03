"use server";

import { requireUser } from "@/lib/auth";
import { reviewDiff } from "@/lib/inventory";
import { act } from "@/lib/actions";

export async function reviewDiffAction(form: FormData) {
  await requireUser("CH");
  const approve = form.get("approve") === "1";
  act("/bao-cao?tab=chenh-lech", () => {
    reviewDiff(Number(form.get("id")), approve);
    return approve ? "Đã điều chỉnh tồn kho theo số thực tế." : "Đã bỏ qua chỗ lệch, tồn kho giữ nguyên.";
  });
}
