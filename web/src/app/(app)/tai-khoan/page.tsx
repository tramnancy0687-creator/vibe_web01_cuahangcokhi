import { requireUser } from "@/lib/auth";
import { listUsers } from "@/lib/catalog";
import { MENU } from "@/lib/menu";
import { ROLE_LABEL } from "@/lib/format";
import { Flash } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { createUserAction, resetPasswordAction, toggleUserAction, updateUserAction } from "./actions";

const ROLES = ["CH", "NV", "TK"] as const;

export default async function AccountsPage({ searchParams }: PageProps<"/tai-khoan">) {
  const me = await requireUser("CH");
  const { ok, err } = await searchParams;
  const users = listUsers();

  return (
    <>
      <h1 className="page-title">Tài khoản nhân viên</h1>
      <Flash ok={ok} err={err} />
      <section className="card overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Họ tên & vai trò</th><th>Tên đăng nhập</th><th>Trạng thái</th><th>Đặt lại mật khẩu</th><th></th></tr></thead>
          <tbody>{users.map((u) => (
            <tr key={u.id} className={u.active ? "" : "text-stone-400"}>
              <td>
                <form action={updateUserAction} className="flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <input name="fullName" aria-label="Họ tên" className="inp w-44" defaultValue={u.full_name} required />
                  <select name="role" aria-label="Vai trò" className="inp" defaultValue={u.role}>
                    {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                  <SubmitButton className="btn btn-sm">Lưu</SubmitButton>
                </form>
              </td>
              <td>{u.username}{u.id === me.id && <span className="muted"> (bạn)</span>}</td>
              <td>{u.active ? <span className="tag tag-ok">Đang dùng</span> : <span className="tag tag-bad">Đã khóa</span>}</td>
              <td>
                <form action={resetPasswordAction} className="flex gap-1">
                  <input type="hidden" name="id" value={u.id} />
                  <input name="password" type="text" aria-label={`Mật khẩu mới cho ${u.username}`} placeholder="Mật khẩu mới" minLength={6} className="inp w-32" required />
                  <SubmitButton className="btn btn-sm">Đặt lại</SubmitButton>
                </form>
              </td>
              <td>
                {u.id !== me.id && (
                  <form action={toggleUserAction}>
                    <input type="hidden" name="id" value={u.id} /><input type="hidden" name="active" value={u.active ? "0" : "1"} />
                    <SubmitButton className="btn btn-sm">{u.active ? "Khóa" : "Mở khóa"}</SubmitButton>
                  </form>
                )}
              </td>
            </tr>
          ))}</tbody>
        </table>
        <p className="muted mt-2">Khóa thay vì xóa, để phiếu cũ vẫn giữ tên nhân viên cho báo cáo doanh số. Khóa hoặc đặt lại mật khẩu sẽ đăng xuất người đó ngay.</p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <form action={createUserAction} className="card grid content-start gap-3">
          <h2 className="card-title mb-0">Thêm tài khoản</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="lbl">Họ tên<input id="new-fullName" name="fullName" className="inp" required /></label>
            <label className="lbl">Tên đăng nhập<input id="new-username" name="username" className="inp" placeholder="vd. hoa.nv" required /></label>
            <label className="lbl">Vai trò
              <select id="new-role" name="role" className="inp" defaultValue="NV">
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </label>
            <label className="lbl">Mật khẩu ban đầu<input id="new-password" name="password" type="text" minLength={6} className="inp" required /></label>
          </div>
          <div className="flex justify-end"><SubmitButton>Tạo tài khoản</SubmitButton></div>
        </form>

        <section className="card overflow-x-auto">
          <h2 className="card-title">Quyền theo vai trò</h2>
          <table className="tbl">
            <thead><tr><th>Màn hình</th>{ROLES.map((r) => <th key={r} className="text-center">{ROLE_LABEL[r]}</th>)}</tr></thead>
            <tbody>{MENU.map((m) => (
              <tr key={m.href}><td>{m.label}</td>{ROLES.map((r) => <td key={r} className="text-center">{m.roles.includes(r) ? "✔" : "—"}</td>)}</tr>
            ))}</tbody>
          </table>
          <p className="muted mt-2">Quyền gắn cố định theo vai trò, kiểm tra ở phía server cho mọi trang và mọi thao tác (src/lib/menu.ts).</p>
        </section>
      </div>
    </>
  );
}
