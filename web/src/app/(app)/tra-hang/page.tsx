import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { balance } from "@/lib/debt";
import { findSale } from "@/lib/sales";
import { dateTimeVN, money, qty } from "@/lib/format";
import { Empty, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { createReturnAction } from "./actions";

export default async function ReturnsPage({ searchParams }: PageProps<"/tra-hang">) {
  await requireUser("CH", "NV");
  const { code, ok, err } = await searchParams;
  const sale = code ? findSale(String(code)) : null;
  const owed = sale?.customer_id ? balance(sale.customer_id) : 0;
  const recent = all<{ code: string; sale: string; customer: string | null; total: number; refund: string; created_at: string }>(
    `SELECT r.code, s.code AS sale, c.name AS customer, r.total, r.refund, r.created_at FROM returns r
     JOIN sales s ON s.id = r.sale_id LEFT JOIN customers c ON c.id = s.customer_id ORDER BY r.created_at DESC LIMIT 8`,
  );

  return (
    <>
      <h1 className="page-title">Nhận hàng trả lại</h1>
      <Flash ok={ok} err={err} />
      <form className="flex flex-wrap gap-2">
        <input id="code" name="code" className="inp min-w-64 flex-1" placeholder="Số phiếu bán, vd. PB-261030-002" defaultValue={code ? String(code) : ""} required />
        <button className="btn">Tìm phiếu</button>
      </form>

      {code && !sale && <p className="text-sm text-red-600">Không tìm thấy phiếu bán {String(code)}.</p>}

      {sale && (
        <form action={createReturnAction} className="card grid gap-3">
          <input type="hidden" name="saleId" value={sale.id} />
          <input type="hidden" name="saleCode" value={sale.code} />
          <div className="flex flex-wrap justify-between gap-2">
            <h2 className="card-title mb-0">Phiếu {sale.code} · {dateTimeVN(sale.created_at)} · {sale.customer ?? "Khách lẻ"}</h2>
            <span className="muted">NV bán: {sale.user}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Món</th><th className="num">Đã mua</th><th className="num">Còn trả được</th><th className="num">SL trả</th><th>Còn nguyên?</th><th className="num">Đơn giá</th></tr></thead>
              <tbody>{sale.items.map((it) => (
                <tr key={it.id}>
                  <td>{it.name}</td>
                  <td className="num">{qty(it.qty)} {it.unit}</td>
                  <td className="num">{qty(it.remaining)} {it.unit}</td>
                  <td className="num"><input type="number" name={`qty_${it.id}`} min="0" max={it.remaining} step="any" defaultValue={0}
                    aria-label={`Số lượng trả ${it.name}`} className="inp w-20 text-right" disabled={it.remaining <= 0} /></td>
                  <td><label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name={`intact_${it.id}`} disabled={it.remaining <= 0} />Còn nguyên</label></td>
                  <td className="num">{money(it.unit_price)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <label className="lbl">Lý do trả<input id="reason" name="reason" className="inp" placeholder="Vd. công trình dư" /></label>
          <p className="muted">
            {owed > 0
              ? `Khách đang nợ ${money(owed)} đ: giá trị hàng trả sẽ được trừ vào công nợ (phần dư hoàn tiền mặt).`
              : "Khách không có nợ: hoàn tiền mặt theo giá trị hàng trả."}
            {" "}Chỉ nhận hàng còn nguyên; hàng trả được cộng lại tồn kho ngay.
          </p>
          <div className="flex justify-end"><SubmitButton>Xác nhận nhận hàng</SubmitButton></div>
        </form>
      )}

      <section className="card">
        <h2 className="card-title">Phiếu trả gần đây</h2>
        {recent.length ? (
          <table className="tbl">
            <thead><tr><th>Số phiếu trả</th><th>Phiếu bán</th><th>Khách</th><th>Hoàn lại</th><th className="num">Giá trị</th><th>Thời gian</th></tr></thead>
            <tbody>{recent.map((r) => (
              <tr key={r.code}><td>{r.code}</td><td>{r.sale}</td><td>{r.customer ?? "Khách lẻ"}</td>
                <td>{r.refund === "DEBT" ? "Trừ công nợ" : "Tiền mặt"}</td><td className="num">{money(r.total)}</td><td>{dateTimeVN(r.created_at)}</td></tr>
            ))}</tbody>
          </table>
        ) : <Empty>Chưa có phiếu trả.</Empty>}
      </section>
    </>
  );
}
