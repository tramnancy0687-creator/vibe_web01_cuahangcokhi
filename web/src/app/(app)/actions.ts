"use server";

import { redirect } from "next/navigation";
import { logout, requireUser } from "@/lib/auth";
import { act, str } from "@/lib/actions";
import { changeOwnPassword } from "@/lib/catalog";
import { BizError } from "@/lib/db";

export async function logoutAction() {
  await logout();
  redirect("/login");
}

export async function changePasswordAction(form: FormData) {
  const user = await requireUser();
  const next = str(form.get("next"));
  act("/doi-mat-khau", () => {
    if (next !== str(form.get("confirm"))) throw new BizError("Hai lần nhập mật khẩu mới không khớp.");
    changeOwnPassword(user.id, str(form.get("current")), next);
    return "Đã đổi mật khẩu.";
  });
}
