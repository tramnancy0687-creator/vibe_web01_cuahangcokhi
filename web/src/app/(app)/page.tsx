import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { get, setting } from "@/lib/db";
import { debtors } from "@/lib/debt";
import { draftStocktake, recentImports } from "@/lib/inventory";
import { lowStock, stockDiffs } from "@/lib/reports";
import { recentSales } from "@/lib/sales";
import { daysSince, dateTimeVN, dateVN, money, qty } from "@/lib/format";
import { Empty, Stat } from "@/components/ui";

function todayRange() {
  const vnDay = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
  const from = new Date(`${vnDay}T00:00:00+07:00`);
  return [from.toISOString(), new Date(from.getTime() + 86_400_000).toISOString()];
}

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const user = await requireUser();
  const { denied } = await searchParams;
  const [from, to] = todayRange();
  const low = lowStock();
  const isCH = user.role === "CH";

  const today = get<{ n: number; total: number }>(
    `SELECT COUNT(*) AS n, COALESCE(SUM(total), 0) AS total FROM sales WHERE created_at >= ? AND created_at < ? ${isCH ? "" : "AND user_id = ?"}`,
    ...(isCH ? [from, to] : [from, to, user.id]),
  )!;
  const owed = isCH ? debtors() : [];
  const overdueDays = setting("overdue_debt_days");
  const overdue = owed.filter((d) => d.since && daysSince(d.since) > overdueDays);
  const pendingDiffs = isCH ? stockDiffs().filter((d) => d.status === "PENDING").length : 0;
  const draft = user.role === "TK" ? draftStocktake() : undefined;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Xin chào, {user.full_name}</h1>
          <p className="muted">{dateVN(new Date().toISOString())}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.role !== "TK" && <Link href="/ban-hang" className="btn btn-pri">+ Lập phiếu bán</Link>}
          {user.role !== "NV" && <Link href="/nhap-hang" className="btn">+ Phiếu nhập</Link>}
          {user.role !== "NV" && <Link href="/kiem-ke" className="btn">Kiểm kê</Link>}
        </div>
      </div>

      {denied && <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Tài khoản của bạn không có quyền vào màn hình vừa chọn.</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {user.role !== "TK" && <Stat label={isCH ? "Doanh thu hôm nay" : "Phiếu của tôi hôm nay"} value={money(today.total)} sub={`${today.n} phiếu bán`} />}
        {isCH && <Stat label="Công nợ phải thu" value={money(owed.reduce((s, d) => s + d.balance, 0))} sub={`${owed.length} khách đang nợ`} />}
        <Stat label="Hàng sắp hết" value={`${low.length} món`} sub="dưới mức tồn tối thiểu" />
        {isCH && <Stat label="Chênh lệch kiểm kê" value={`${pendingDiffs} dòng`} sub="chờ chủ duyệt" />}
        {draft && <Stat label="Đợt kiểm kê đang mở" value={draft.code} sub={`từ ${dateVN(draft.created_at)}`} />}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="card-title">Hàng sắp hết</h2>
          {low.length ? (
            <table className="tbl"><thead><tr><th>Món</th><th className="num">Tồn</th><th className="num">Tối thiểu</th></tr></thead>
              <tbody>{low.map((p) => (
                <tr key={p.id}><td>{p.name}</td><td className="num">{qty(p.stock)} {p.base_unit}</td><td className="num">{qty(p.min_stock)} {p.base_unit}</td></tr>
              ))}</tbody></table>
          ) : <Empty>Không có món nào dưới mức tối thiểu.</Empty>}
        </section>

        {isCH && (
          <section className="card">
            <h2 className="card-title">Nợ quá {overdueDays} ngày</h2>
            {overdue.length ? (
              <table className="tbl"><thead><tr><th>Khách</th><th className="num">Còn nợ</th><th>Nợ từ</th></tr></thead>
                <tbody>{overdue.map((d) => (
                  <tr key={d.id}><td><Link className="underline" href={`/cong-no?id=${d.id}`}>{d.name}</Link></td>
                    <td className="num">{money(d.balance)}</td><td>{dateVN(d.since!)} <span className="tag tag-bad">{daysSince(d.since!)} ngày</span></td></tr>
                ))}</tbody></table>
            ) : <Empty>Không có khoản nợ quá hạn.</Empty>}
          </section>
        )}

        {user.role === "NV" && (
          <section className="card">
            <h2 className="card-title">Phiếu bán gần đây của tôi</h2>
            <SalesTable rows={recentSales(8, user.id)} />
          </section>
        )}

        {user.role === "TK" && (
          <section className="card">
            <h2 className="card-title">Phiếu nhập gần đây</h2>
            <table className="tbl"><thead><tr><th>Số phiếu</th><th>Nhà cung cấp</th><th className="num">Tổng tiền</th></tr></thead>
              <tbody>{recentImports(8).map((i) => (
                <tr key={i.code}><td>{i.code}</td><td>{i.supplier}</td><td className="num">{money(i.total)}</td></tr>
              ))}</tbody></table>
          </section>
        )}
      </div>

      {isCH && (
        <section className="card">
          <h2 className="card-title">Phiếu bán gần đây</h2>
          <SalesTable rows={recentSales(8)} />
        </section>
      )}
    </>
  );
}

function SalesTable({ rows }: { rows: ReturnType<typeof recentSales> }) {
  if (!rows.length) return <Empty>Chưa có phiếu bán.</Empty>;
  return (
    <table className="tbl">
      <thead><tr><th>Số phiếu</th><th>Thời gian</th><th>Khách</th><th>NV</th><th>Thanh toán</th><th className="num">Tổng tiền</th></tr></thead>
      <tbody>{rows.map((s) => (
        <tr key={s.code}>
          <td>{s.code}</td><td>{dateTimeVN(s.created_at)}</td><td>{s.customer ?? "Khách lẻ"}</td><td>{s.user}</td>
          <td>{s.payment === "CREDIT" ? <span className="tag tag-warn">Ghi nợ</span> : <span className="tag tag-ok">Trả ngay</span>}</td>
          <td className="num">{money(s.total)}</td>
        </tr>
      ))}</tbody>
    </table>
  );
}
