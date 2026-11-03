"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MenuItem } from "@/lib/menu";

export function SideNav({ items }: { items: MenuItem[] }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-stone-300 bg-stone-50 p-2 md:block md:border-b-0 md:border-r">
      {items.map((m, i) => {
        const showGroup = m.group && m.group !== items[i - 1]?.group;
        const active = m.href === "/" ? path === "/" : path.startsWith(m.href);
        return (
          <div key={m.href} className="shrink-0">
            {showGroup && <div className="mt-3 hidden px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-500 md:block">{m.group}</div>}
            <Link href={m.href}
              className={`block whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm ${active ? "bg-stone-800 text-white" : "hover:bg-stone-200"}`}>
              {m.label}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
