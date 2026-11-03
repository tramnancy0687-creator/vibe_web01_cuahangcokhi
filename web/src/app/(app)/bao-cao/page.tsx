import { requireUser } from "@/lib/auth";
import { currentMonth, dateTimeVN, dateVN, money, qty } from "@/lib/format";
import { debtReport, lastMonths, lowStock, profitLoss, salesByStaff, slowMoving, stockDiffs } from "@/lib/reports";
import { Empty, Tabs, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { reviewDiffAction } from "./actions";

const TABS = [
  { key: "lai-lo", label: "Lãi lỗ", monthly: true },
  { key: "cong-no", label: "Công nợ", monthly: true },
  { key: "doanh-so", label: "Doanh số NV", monthly: true },
  { key: "sap-het", label: "Hàng sắp hết", monthly: false },
  { key: "ton-lau", label: "Tồn lâu", monthly: false },
  { key: "chenh-lech", label: "Chênh lệch kiểm kê", monthly: false },
];

export default async function ReportsPage({ searchParams }: PageProps<"/bao-cao">) {
  await requireUser("CH");
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.tab) ?? TABS[0];
  const month = /^\d{4}-\d{2}$/.test(String(sp.thang)) ? String(sp.thang) : currentMonth();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="page-title">Báo cáo</h1>
        {tab.monthly && (
          <form className="flex gap-2">
            <input type="hidden" name="tab" value={tab.key} />
            <input type="month" name="thang" aria-label="Chọn tháng" className="inp" defaultValue={month} />
            <button className="btn">Xem</button>
          </form>
        )}
      </div>
      <Flash ok={sp.ok} err={sp.err} />
      <Tabs active={tab.key} items={TABS.map((t) => ({ key: t.key, label: t.label, href: `/bao-cao?tab=${t.key}&thang=${month}` }))} />
      <section className="card">
        {tab.key === "lai-lo" && <ProfitLoss month={month} />}
        {tab.key === "cong-no" && <DebtTab month={month} />}
        {tab.key === "doanh-so" && <StaffTab month={month} />}
        {tab.key === "sap-het" && <LowStockTab />}
        {tab.key === "ton-lau" && <SlowTab />}
        {tab.key === "chenh-lech" && <DiffTab />}
      </section>
    </>
  );
}

function ProfitLoss({ month }: { month: string }) {
  const pl = profitLoss(month);
  const series = lastMonths(month, 6).map((m) => ({ m, gross: profitLoss(m).gross }));
  const max = Math.max(1, ...series.map((s) => Math.abs(s.gross)));
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-sm">
        <dt>Doanh thu bán hàng ({pl.sales} phiếu)</dt><dd className="num">{money(pl.revenue)}</dd>
        <dt>Hàng trả lại</dt><dd className="num">− {money(pl.returns)}</dd>
        <dt className="font-medium">Doanh thu thuần</dt><dd className="num font-medium">{money(pl.net)}</dd>
        <dt>Giá vốn (theo lô nhập, FIFO)</dt><dd className="num">− {money(pl.cogs)}</dd>
        <dt className="border-t border-stone-300 pt-1.5 text-base font-semibold">Lãi gộp</dt>
        <dd className="num border-t border-stone-300 pt-1.5 text-base font-semibold">{money(pl.gross)}</dd>
      </dl>
      <div>
        <div className="muted mb-2">Lãi gộp 6 tháng gần nhất</div>
        <div className="flex h-40 items-end gap-2" role="img" aria-label="Biểu đồ lãi gộp 6 tháng">
          {series.map((s) => (
            <div key={s.m} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[11px] tabular-nums text-stone-600">{s.gross ? `${Math.round(s.gross / 1e6)}tr` : "0"}</span>
              <div className={`w-full rounded-t ${s.m === month ? "bg-brand" : "bg-stone-300"}`} style={{ height: `${(Math.abs(s.gross) / max) * 100}%`, minHeight: 2 }} />
              <span className="text-[11px] text-stone-500">{s.m.slice(5)}/{s.m.slice(2, 4)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DebtTab({ month }: { month: string }) {
  const rows = debtReport(month);
  if (!rows.length) return <Empty>Không có phát sinh công nợ trong tháng.</Empty>;
  return (
    <div className="overflow-x-auto"><table className="tbl">
      <thead><tr><th>Khách</th><th className="num">Đầu tháng</th><th className="num">Phát sinh</th><th className="num">Đã giảm (thu, trả hàng)</th><th className="num">Cuối tháng</th><th>Nợ từ</th></tr></thead>
      <tbody>{rows.map((r) => (
        <tr key={r.id}><td>{r.name}</td><td className="num">{money(r.opening)}</td><td className="num">{money(r.increase)}</td>
          <td className="num">{money(r.decrease)}</td><td className="num font-medium">{money(r.closing)}</td><td>{r.since ? dateVN(r.since) : "—"}</td></tr>
      ))}</tbody>
    </table></div>
  );
}

function StaffTab({ month }: { month: string }) {
  const rows = salesByStaff(month);
  if (!rows.length) return <Empty>Chưa có phiếu bán trong tháng.</Empty>;
  return (
    <div className="overflow-x-auto"><table className="tbl">
      <thead><tr><th>Nhân viên</th><th className="num">Số phiếu</th><th className="num">Doanh số</th><th className="num">Hàng trả</th><th className="num">Doanh số thuần</th></tr></thead>
      <tbody>{rows.map((r) => (
        <tr key={r.id}><td>{r.full_name}</td><td className="num">{r.sales}</td><td className="num">{money(r.revenue)}</td>
          <td className="num">{money(r.returns)}</td><td className="num font-medium">{money(r.net)}</td></tr>
      ))}</tbody>
    </table></div>
  );
}

function LowStockTab() {
  const rows = lowStock();
  if (!rows.length) return <Empty>Không có món nào dưới mức tồn tối thiểu.</Empty>;
  return (
    <div className="overflow-x-auto"><table className="tbl">
      <thead><tr><th>Món</th><th className="num">Tồn</th><th className="num">Tối thiểu</th><th className="num">Bán 4 tuần qua</th><th>NCC gần nhất</th></tr></thead>
      <tbody>{rows.map((r) => (
        <tr key={r.id}><td>{r.name}<div className="muted">{r.code}</div></td><td className="num">{qty(r.stock)} {r.base_unit}</td>
          <td className="num">{qty(r.min_stock)} {r.base_unit}</td><td className="num">{qty(r.sold_28d)} {r.base_unit}</td><td>{r.supplier ?? "—"}</td></tr>
      ))}</tbody>
    </table></div>
  );
}

function SlowTab() {
  const { months, rows } = slowMoving();
  return (
    <div className="grid gap-2">
      <p className="muted">Món còn tồn từ hơn {months} tháng trước và không bán được trong {months} tháng qua (ngưỡng chỉnh trong bảng settings).</p>
      {rows.length ? (
        <div className="overflow-x-auto"><table className="tbl">
          <thead><tr><th>Món</th><th className="num">Tồn</th><th>Lần bán cuối</th><th className="num">Giá trị tồn (giá nhập)</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}><td>{r.name}<div className="muted">{r.code}</div></td><td className="num">{qty(r.stock)} {r.base_unit}</td>
              <td>{r.last_sale ? dateVN(r.last_sale) : <span className="tag tag-warn">chưa bán lần nào</span>}</td><td className="num">{money(r.value)}</td></tr>
          ))}</tbody>
        </table></div>
      ) : <Empty>Không có hàng tồn lâu.</Empty>}
    </div>
  );
}

function DiffTab() {
  const rows = stockDiffs();
  if (!rows.length) return <Empty>Chưa có chênh lệch kiểm kê.</Empty>;
  const STATUS: Record<string, React.ReactNode> = {
    APPROVED: <span className="tag tag-ok">Đã điều chỉnh</span>,
    REJECTED: <span className="tag">Bỏ qua</span>,
  };
  return (
    <div className="overflow-x-auto"><table className="tbl">
      <thead><tr><th>Đợt</th><th>Món</th><th className="num">Sổ sách</th><th className="num">Thực tế</th><th className="num">Lệch</th><th>Lý do</th><th></th></tr></thead>
      <tbody>{rows.map((r) => {
        const diff = r.actual_qty - r.book_qty;
        return (
          <tr key={r.id}>
            <td>{r.code}<div className="muted">{dateTimeVN(r.finished_at)} · {r.user}</div></td>
            <td>{r.product}</td>
            <td className="num">{qty(r.book_qty)} {r.base_unit}</td><td className="num">{qty(r.actual_qty)} {r.base_unit}</td>
            <td className="num"><span className={`tag ${diff < 0 ? "tag-bad" : "tag-warn"}`}>{diff > 0 ? "+" : "−"} {qty(Math.abs(diff))}</span></td>
            <td>{r.reason}</td>
            <td>{r.status === "PENDING" ? (
              <form action={reviewDiffAction} className="flex gap-1">
                <input type="hidden" name="id" value={r.id} />
                <SubmitButton className="btn btn-sm btn-pri" name="approve" value="1">Duyệt điều chỉnh</SubmitButton>
                <SubmitButton className="btn btn-sm" name="approve" value="0">Bỏ qua</SubmitButton>
              </form>
            ) : STATUS[r.status]}</td>
          </tr>
        );
      })}</tbody>
    </table></div>
  );
}
