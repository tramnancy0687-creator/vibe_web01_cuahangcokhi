import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { productsWithStock, recentImports } from "@/lib/inventory";
import { dateTimeVN, money } from "@/lib/format";
import { Empty, Flash } from "@/components/ui";
import { ImportForm } from "./ImportForm";

export default async function ImportPage({ searchParams }: PageProps<"/nhap-hang">) {
  const user = await requireUser("CH", "TK");
  const { ok } = await searchParams;
  const suppliers = all<{ id: number; name: string }>("SELECT id, name FROM suppliers WHERE active = 1 ORDER BY name");
  const imports = recentImports(10);

  return (
    <>
      <h1 className="page-title">Nhập hàng</h1>
      <Flash ok={ok} />
      <ImportForm key={String(ok ?? "")} products={productsWithStock()} suppliers={suppliers} keeper={user.full_name} />
      <section className="card">
        <h2 className="card-title">Phiếu nhập gần đây</h2>
        {imports.length ? (
          <table className="tbl">
            <thead><tr><th>Số phiếu</th><th>Thời gian</th><th>Nhà cung cấp</th><th>Người nhập</th><th className="num">Số dòng</th><th className="num">Tổng tiền</th></tr></thead>
            <tbody>{imports.map((i) => (
              <tr key={i.code}><td>{i.code}</td><td>{dateTimeVN(i.created_at)}</td><td>{i.supplier}</td><td>{i.user}</td>
                <td className="num">{i.lines}</td><td className="num">{money(i.total)}</td></tr>
            ))}</tbody>
          </table>
        ) : <Empty>Chưa có phiếu nhập.</Empty>}
      </section>
    </>
  );
}
