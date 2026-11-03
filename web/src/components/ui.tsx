import Link from "next/link";

/** Thông báo sau khi lưu (?ok=) hoặc lỗi nghiệp vụ (?err=) */
export function Flash({ ok, err }: { ok?: string | string[]; err?: string | string[] }) {
  if (err) return <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{String(err)}</p>;
  if (ok) return <p role="status" className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">{String(ok)}</p>;
  return null;
}

export function Tabs({ items, active }: { items: { key: string; label: string; href: string }[]; active: string }) {
  return (
    <nav className="flex flex-wrap border-b border-stone-300">
      {items.map((t) => (
        <Link key={t.key} href={t.href}
          className={`-mb-px rounded-t-md border px-3.5 py-1.5 text-sm ${t.key === active
            ? "border-stone-300 border-b-white bg-white font-semibold"
            : "border-transparent text-stone-600 hover:text-stone-900"}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card grid gap-0.5">
      <span className="muted">{label}</span>
      <b className="text-xl tabular-nums">{value}</b>
      {sub && <span className="muted">{sub}</span>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-stone-500">{children}</p>;
}
