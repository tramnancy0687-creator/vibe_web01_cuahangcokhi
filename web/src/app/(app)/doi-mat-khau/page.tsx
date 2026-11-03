import { requireUser } from "@/lib/auth";
import { Flash } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { changePasswordAction } from "../actions";

export default async function ChangePasswordPage({ searchParams }: PageProps<"/doi-mat-khau">) {
  await requireUser();
  const { ok, err } = await searchParams;
  return (
    <>
      <h1 className="page-title">Đổi mật khẩu</h1>
      <Flash ok={ok} err={err} />
      <form action={changePasswordAction} className="card grid max-w-sm gap-3">
        <label className="lbl">Mật khẩu hiện tại<input id="current" name="current" type="password" className="inp" required autoComplete="current-password" /></label>
        <label className="lbl">Mật khẩu mới (tối thiểu 6 ký tự)<input id="next" name="next" type="password" className="inp" required minLength={6} autoComplete="new-password" /></label>
        <label className="lbl">Nhập lại mật khẩu mới<input id="confirm" name="confirm" type="password" className="inp" required minLength={6} autoComplete="new-password" /></label>
        <SubmitButton>Đổi mật khẩu</SubmitButton>
      </form>
    </>
  );
}
