import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await currentUser()) redirect("/");
  return (
    <main className="grid min-h-screen place-items-center bg-stone-100 px-4">
      <div className="card grid w-full max-w-sm gap-4 p-6">
        <div className="text-center">
          <div className="text-lg font-bold tracking-wide">THÀNH PHÁT</div>
          <div className="muted">Quản lý bán hàng · kho · công nợ</div>
        </div>
        <LoginForm />
        <p className="muted text-center">Quên mật khẩu? Liên hệ chủ cửa hàng để đặt lại.</p>
      </div>
    </main>
  );
}
