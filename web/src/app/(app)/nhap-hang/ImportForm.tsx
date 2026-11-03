"use client";

import { useActionState, useState } from "react";
import type { ProductWithStock } from "@/lib/inventory";
import { money, qty as fmtQty } from "@/lib/format";
import { SubmitButton } from "@/components/SubmitButton";
import { createImportAction } from "./actions";

type Line = { productId: number; unit: string; qty: number; unitPrice: number };

export function ImportForm({ products, suppliers, keeper }: {
  products: ProductWithStock[]; suppliers: { id: number; name: string }[]; keeper: string;
}) {
  const [state, action] = useActionState(createImportAction, null);
  const [lines, setLines] = useState<Line[]>([]);
  const [pick, setPick] = useState("");
  const byId = new Map(products.map((p) => [p.id, p]));

  const rows = lines.map((l) => {
    const p = byId.get(l.productId)!;
    const u = p.units.find((x) => x.unit === l.unit)!;
    return { ...l, p, base: l.qty * u.factor, amount: Math.round(l.qty * l.unitPrice) };
  });
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const update = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  function add() {
    const p = byId.get(Number(pick));
    if (!p) return;
    // gợi ý đơn vị nhập là đơn vị lớn nhất (thùng, cuộn, kg...)
    const unit = p.units[p.units.length - 1].unit;
    setLines((ls) => [...ls, { productId: p.id, unit, qty: 1, unitPrice: 0 }]);
    setPick("");
  }

  return (
    <form action={action} className="card grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <label className="lbl">Nhà cung cấp
            <select id="supplierId" name="supplierId" className="inp min-w-56" required defaultValue="">
              <option value="" disabled>Chọn nhà cung cấp</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="lbl">Số hóa đơn NCC<input id="invoiceNo" name="invoiceNo" className="inp w-40" /></label>
        </div>
        <span className="muted">Người nhập: {keeper}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Món</th><th className="num">SL nhập</th><th>Đơn vị nhập</th><th className="num">= đơn vị gốc</th><th className="num">Giá nhập / đơn vị</th><th className="num">Thành tiền</th><th></th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.productId}-${i}`}>
                <td>{r.p.name}</td>
                <td className="num"><input type="number" min="0" step="any" aria-label="Số lượng nhập" className="inp w-20 text-right" value={r.qty}
                  onChange={(e) => update(i, { qty: Number(e.target.value) })} /></td>
                <td><select aria-label="Đơn vị nhập" className="inp" value={r.unit} onChange={(e) => update(i, { unit: e.target.value })}>
                  {r.p.units.map((u) => <option key={u.unit} value={u.unit}>{u.unit}</option>)}
                </select></td>
                <td className="num whitespace-nowrap">{fmtQty(r.base)} {r.p.base_unit}</td>
                <td className="num"><input type="number" min="0" step="any" aria-label="Giá nhập" className="inp w-32 text-right" value={r.unitPrice}
                  onChange={(e) => update(i, { unitPrice: Number(e.target.value) })} /></td>
                <td className="num">{money(r.amount)}</td>
                <td><button type="button" aria-label="Xóa dòng" className="btn btn-sm" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}>✕</button></td>
              </tr>
            ))}
            <tr>
              <td colSpan={7}>
                <div className="flex flex-wrap gap-2">
                  <select aria-label="Chọn món để thêm" className="inp min-w-64" value={pick} onChange={(e) => setPick(e.target.value)}>
                    <option value="">+ Chọn món để thêm…</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
                  </select>
                  <button type="button" className="btn" onClick={add} disabled={!pick}>Thêm dòng</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="muted">Mỗi dòng là một lô với giá nhập riêng. Khi bán, giá vốn lấy theo lô nhập trước (FIFO).</p>
      <input type="hidden" name="items" value={JSON.stringify(lines)} />
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>Tổng tiền nhập <b className="ml-2 text-lg tabular-nums">{money(total)} đ</b></span>
        <SubmitButton>Lưu & cộng tồn kho</SubmitButton>
      </div>
    </form>
  );
}
