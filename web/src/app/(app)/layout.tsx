import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { MENU } from "@/lib/menu";
import { ROLE_LABEL } from "@/lib/format";
import { logoutAction } from "./actions";
import { SideNav } from "./SideNav";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const items = MENU.filter((m) => m.roles.includes(user.role));

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] md:grid-cols-[210px_1fr]">
      <header className="col-span-full flex flex-wrap items-center justify-between gap-3 border-b border-stone-300 bg-white px-4 py-2.5">
        <Link href="/" className="font-bold tracking-wide">THÀNH PHÁT</Link>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>{user.full_name} <span className="muted">· {ROLE_LABEL[user.role]}</span></span>
          <Link href="/doi-mat-khau" className="btn btn-sm">Đổi mật khẩu</Link>
          <form action={logoutAction}><button className="btn btn-sm">Đăng xuất</button></form>
        </div>
      </header>
      <SideNav items={items} />
      <main className="grid min-w-0 content-start gap-4 p-4 md:p-6">{children}</main>
    </div>
  );
}
