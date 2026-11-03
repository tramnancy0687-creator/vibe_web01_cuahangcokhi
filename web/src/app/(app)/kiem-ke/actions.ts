"use server";

import { requireUser } from "@/lib/auth";
import { openStocktake, saveStocktake } from "@/lib/inventory";
import { act, num, str } from "@/lib/actions";

export async function openStocktakeAction() {
  const user = await requireUser("CH", "TK");
  act("/kiem-ke", () => {
    openStocktake(user.id);
    return "Đã mở đợt kiểm kê. Nhập số đếm thực tế cho từng món.";
  });
}

export async function saveStocktakeAction(form: FormData) {
  await requireUser("CH", "TK");
  const finish = form.get("finish") === "1";
  const nhom = str(form.get("nhom"));
  const entries = [...form.keys()]
    .filter((k) => k.startsWith("actual_"))
    .map((k) => {
      const id = Number(k.slice(7));
      const actual = num(form.get(k));
      return { itemId: id, actual: Number.isNaN(actual) ? null : actual, reason: str(form.get(`reason_${id}`)) };
    });
  const back = nhom && !finish ? `/kiem-ke?nhom=${encodeURIComponent(nhom)}` : "/kiem-ke";
  act(back, () => {
    saveStocktake(Number(form.get("stocktakeId")), entries, finish);
    return finish ? "Đã hoàn tất kiểm kê và gửi chỗ lệch cho chủ duyệt." : "Đã lưu tạm.";
  });
}
