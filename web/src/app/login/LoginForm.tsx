"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, null);
  return (
    <form action={action} className="grid gap-3">
      <label className="lbl">Tên đăng nhập
        <input id="username" name="username" className="inp" autoComplete="username" required autoFocus />
      </label>
      <label className="lbl">Mật khẩu
        <input id="password" name="password" type="password" className="inp" autoComplete="current-password" required />
      </label>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton>Đăng nhập</SubmitButton>
    </form>
  );
}
