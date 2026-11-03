"use client";

import { useActionState, useMemo, useState } from "react";
import type { ProductWithStock } from "@/lib/inventory";
import { money, qty as fmtQty, stockLabel } from "@/lib/format";
import { SubmitButton } from "@/components/SubmitButton";
import { createSaleAction } from "./actions";

export type PosCustomer = { id: number; name: string; phone: string; allow_credit: number; balance: number };
type Line = { productId: number; unit: string; qty: number };

/** Tìm không phân biệt dấu: "oc vit" khớp "Ốc vít" */
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

export function PosForm({ products, customers, seller }: { products: ProductWithStock[]; customers: PosCustomer[]; seller: string }) {
  const [state, action] = useActionState(createSaleAction, null);
  const [q, setQ] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [payment, setPayment] = useState<"CASH" | "CREDIT">("CASH");

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const customer = customers.find((c) => String(c.id) === customerId);
  const canCredit = !!customer?.allow_credit;

  const results = useMemo(() => {
    const k = fold(q.trim());
    return (k ? products.filter((p) => fold(`${p.code} ${p.name}`).includes(k)) : products).slice(0, 12);
  }, [q, products]);

  const rows = lines.map((l) => {
    const p = byId.get(l.productId)!;
    const u = p.units.find((x) => x.unit === l.unit)!;
    return { ...l, p, u, base: l.qty * u.factor, amount: Math.round(l.qty * u.price) };
  });
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const usedBase = (productId: number) => rows.filter((r) => r.productId === productId).reduce((s, r) => s + r.base, 0);

  function add(p: ProductWithStock) {
    const unit = p.units[0].unit;
    setLines((ls) => {
      const i = ls.findIndex((l) => l.productId === p.id && l.unit === unit);
      if (i >= 0) return ls.map((l, j) => (j === i ? { ...l, qty: l.qty + 1 } : l));
      return [...ls, { productId: p.id, unit, qty: 1 }];
    });
  }
  const update = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
      <section className="card grid content-start gap-3">
        <h2 className="card-title mb-0">Tra cứu hàng hóa</h2>
        <input id="pos-search" className="inp" placeholder="Gõ tên hoặc mã, vd. m8, cadivi, xi mang…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Mã</th><th>Tên</th><th className="num">Tồn</th><th>Giá bán</th><th></th></tr></thead>
            <tbody>{results.map((p) => (
              <tr key={p.id}>
                <td className="text-xs text-stone-500">{p.code}</td>
                <td>{p.name}</td>
                <td className="num whitespace-nowrap">{stockLabel(p.stock, p.base_unit, p.units)}</td>
                <td className="text-xs">{p.units.map((u) => `${money(u.price)}/${u.unit}`).join(" · ")}</td>
                <td>{p.stock > 0
                  ? <button type="button" className="btn btn-sm" onClick={() => add(p)}>Thêm</button>
                  : <span className="tag tag-bad">Hết</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p className="muted">Hàng hết vẫn hiện để báo khách, nhưng không thêm vào phiếu được.</p>
      </section>

      <form action={action} className="card grid content-start gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="card-title mb-0">Phiếu bán mới</h2>
          <span className="muted">NV bán: {seller}</span>
        </div>

        <label className="lbl">Khách hàng
          <select id="customerId" name="customerId" className="inp" value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              if (!customers.find((c) => String(c.id) === e.target.value)?.allow_credit) setPayment("CASH");
            }}>
            <option value="">Khách lẻ</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.balance > 0 ? ` · đang nợ ${money(c.balance)}` : ""}</option>
            ))}
          </select>
        </label>

        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Món</th><th className="num">SL</th><th>Đơn vị</th><th className="num">Thành tiền</th><th></th></tr></thead>
              <tbody>{rows.map((r, i) => {
                const over = usedBase(r.productId) > r.p.stock + 1e-9;
                return (
                  <tr key={`${r.productId}-${i}`}>
                    <td>
                      {r.p.name}
                      <div className={`text-xs ${over ? "text-red-600" : "text-stone-500"}`}>
                        {r.u.factor !== 1 && `= ${fmtQty(r.base)} ${r.p.base_unit} · `}
                        {over ? `Không đủ hàng, còn ${fmtQty(r.p.stock)} ${r.p.base_unit}` : `${money(r.u.price)}/${r.unit}`}
                      </div>
                    </td>
                    <td className="num"><input type="number" min="0" step="any" aria-label="Số lượng" className="inp w-20 text-right" value={r.qty}
                      onChange={(e) => update(i, { qty: Number(e.target.value) })} /></td>
                    <td><select aria-label="Đơn vị" className="inp" value={r.unit} onChange={(e) => update(i, { unit: e.target.value })}>
                      {r.p.units.map((u) => <option key={u.unit} value={u.unit}>{u.unit}</option>)}
                    </select></td>
                    <td className="num">{money(r.amount)}</td>
                    <td><button type="button" aria-label="Xóa dòng" className="btn btn-sm" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}>✕</button></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : <p className="rounded-md border border-dashed border-stone-300 py-6 text-center text-sm text-stone-500">Bấm “Thêm” ở bảng tra cứu để đưa hàng vào phiếu.</p>}

        <div className="flex items-baseline justify-between border-t border-stone-200 pt-3">
          <span className="text-sm">Tổng tiền</span>
          <b className="text-xl tabular-nums">{money(total)} đ</b>
        </div>

        <fieldset className="flex flex-wrap items-center gap-4 text-sm">
          <legend className="sr-only">Thanh toán</legend>
          <span className="font-medium">Thanh toán</span>
          <label className="flex items-center gap-1.5"><input type="radio" name="payment" value="CASH" checked={payment === "CASH"} onChange={() => setPayment("CASH")} />Trả ngay</label>
          <label className={`flex items-center gap-1.5 ${canCredit ? "" : "text-stone-400"}`}>
            <input type="radio" name="payment" value="CREDIT" disabled={!canCredit} checked={payment === "CREDIT"} onChange={() => setPayment("CREDIT")} />Ghi nợ
          </label>
          {!canCredit && <span className="muted">Chỉ nhà thầu được mua chịu mới ghi nợ.</span>}
        </fieldset>

        <input type="hidden" name="items" value={JSON.stringify(lines)} />
        {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn" onClick={() => { setLines([]); setCustomerId(""); setPayment("CASH"); }}>Làm lại</button>
          <SubmitButton>Lưu phiếu bán</SubmitButton>
        </div>
      </form>
    </div>
  );
}
