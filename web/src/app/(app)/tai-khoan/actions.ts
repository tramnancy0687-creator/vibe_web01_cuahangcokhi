"use server";

import { requireUser, type Role } from "@/lib/auth";
import { createUser, resetPassword, setUserActive, updateUser } from "@/lib/catalog";
import { act, str } from "@/lib/actions";

const PATH = "/tai-khoan";

export async function createUserAction(form: FormData) {
  await requireUser("CH");
  act(PATH, () => {
    createUser({
      username: str(form.get("username")), fullName: str(form.get("fullName")),
      role: str(form.get("role")) as Role, password: str(form.get("password")),
    });
    return "Đã tạo tài khoản. Gửi tên đăng nhập và mật khẩu ban đầu cho nhân viên.";
  });
}

export async function updateUserAction(form: FormData) {
  const me = await requireUser("CH");
  act(PATH, () => {
    updateUser(me.id, Number(form.get("id")), { fullName: str(form.get("fullName")), role: str(form.get("role")) as Role });
    return "Đã cập nhật tài khoản.";
  });
}

export async function toggleUserAction(form: FormData) {
  const me = await requireUser("CH");
  const active = form.get("active") === "1";
  act(PATH, () => {
    setUserActive(me.id, Number(form.get("id")), active);
    return active ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản.";
  });
}

export async function resetPasswordAction(form: FormData) {
  await requireUser("CH");
  act(PATH, () => {
    resetPassword(Number(form.get("id")), str(form.get("password")));
    return "Đã đặt lại mật khẩu.";
  });
}
