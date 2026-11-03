import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { productsWithStock } from "@/lib/inventory";
import { recentSales } from "@/lib/sales";
import { dateTimeVN, money } from "@/lib/format";
import { Empty, Flash } from "@/components/ui";
import { PosForm, type PosCustomer } from "./PosForm";

export default async function SalesPage({ searchParams }: PageProps<"/ban-hang">) {
  const user = await requireUser("CH", "NV");
  const { ok } = await searchParams;
  const customers = all<PosCustomer>(
    `SELECT c.id, c.name, c.phone, c.allow_credit, COALESCE(SUM(d.amount), 0) AS balance
     FROM customers c LEFT JOIN debt_entries d ON d.customer_id = c.id WHERE c.active = 1 GROUP BY c.id ORDER BY c.name`,
  );
  const sales = recentSales(10, user.role === "NV" ? user.id : undefined);

  return (
    <>
      <h1 className="page-title">Bán hàng</h1>
      <Flash ok={ok} />
      {/* key: lưu xong thì làm mới phiếu */}
      <PosForm key={String(ok ?? "")} products={productsWithStock()} customers={customers} seller={user.full_name} />
      <section className="card">
        <h2 className="card-title">{user.role === "NV" ? "Phiếu bán gần đây của tôi" : "Phiếu bán gần đây"}</h2>
        {sales.length ? (
          <table className="tbl">
            <thead><tr><th>Số phiếu</th><th>Thời gian</th><th>Khách</th><th>NV</th><th>Thanh toán</th><th className="num">Tổng tiền</th></tr></thead>
            <tbody>{sales.map((s) => (
              <tr key={s.code}><td>{s.code}</td><td>{dateTimeVN(s.created_at)}</td><td>{s.customer ?? "Khách lẻ"}</td><td>{s.user}</td>
                <td>{s.payment === "CREDIT" ? <span className="tag tag-warn">Ghi nợ</span> : <span className="tag tag-ok">Trả ngay</span>}</td>
                <td className="num">{money(s.total)}</td></tr>
            ))}</tbody>
          </table>
        ) : <Empty>Chưa có phiếu bán.</Empty>}
      </section>
    </>
  );
}
