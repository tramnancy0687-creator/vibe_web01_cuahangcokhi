import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listCustomers, listSuppliers } from "@/lib/catalog";
import { dateVN, money } from "@/lib/format";
import { Empty, Flash, Tabs } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { saveCustomerAction, saveSupplierAction, toggleCustomerAction } from "./actions";

export default async function PartnersPage({ searchParams }: PageProps<"/khach-hang">) {
  await requireUser("CH");
  const { tab, edit, ok, err } = await searchParams;
  const isSupplier = tab === "ncc";
  const editId = edit ? Number(edit) : null;

  return (
    <>
      <h1 className="page-title">Khách hàng & nhà cung cấp</h1>
      <Flash ok={ok} err={err} />
      <Tabs active={isSupplier ? "ncc" : "kh"} items={[
        { key: "kh", label: "Khách hàng", href: "/khach-hang" },
        { key: "ncc", label: "Nhà cung cấp", href: "/khach-hang?tab=ncc" },
      ]} />
      {isSupplier ? <Suppliers editId={editId} /> : <Customers editId={editId} />}
    </>
  );
}

function Customers({ editId }: { editId: number | null }) {
  const rows = listCustomers();
  const editing = rows.find((c) => c.id === editId);
  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <section className="card overflow-x-auto">
        {rows.length ? (
          <table className="tbl">
            <thead><tr><th>Tên</th><th>Điện thoại</th><th>Loại</th><th>Mua chịu</th><th className="num">Còn nợ</th><th></th></tr></thead>
            <tbody>{rows.map((c) => (
              <tr key={c.id} className={c.active ? "" : "text-stone-400"}>
                <td>{c.name}{!c.active && <span className="muted"> · ngừng giao dịch</span>}</td><td>{c.phone}</td>
                <td>{c.kind === "CONTRACTOR" ? "Nhà thầu" : "Khách quen"}</td>
                <td>{c.allow_credit ? <span className="tag tag-ok">Cho phép</span> : <span className="tag">Không</span>}</td>
                <td className="num">{money(c.balance)}</td>
                <td className="flex gap-1">
                  <Link href={`/khach-hang?edit=${c.id}`} className="btn btn-sm">Sửa</Link>
                  <form action={toggleCustomerAction}>
                    <input type="hidden" name="id" value={c.id} /><input type="hidden" name="active" value={c.active ? "0" : "1"} />
                    <button className="btn btn-sm">{c.active ? "Ngừng" : "Mở lại"}</button>
                  </form>
                </td>
              </tr>
            ))}</tbody>
          </table>
        ) : <Empty>Chưa có khách hàng.</Empty>}
        <p className="muted mt-2">Khách lẻ vãng lai không cần tạo. Chỉ lưu nhà thầu và khách quen; chỉ khách bật “Mua chịu” mới được ghi nợ khi bán.</p>
      </section>

      <form key={editing?.id ?? "new"} action={saveCustomerAction} className="card grid content-start gap-3">
        <h2 className="card-title mb-0">{editing ? `Sửa: ${editing.name}` : "Thêm khách hàng"}</h2>
        <input type="hidden" name="id" value={editing?.id ?? ""} />
        <label className="lbl">Tên khách<input id="c-name" name="name" className="inp" defaultValue={editing?.name} required /></label>
        <label className="lbl">Điện thoại<input id="c-phone" name="phone" className="inp" defaultValue={editing?.phone} /></label>
        <label className="lbl">Loại
          <select id="c-kind" name="kind" className="inp" defaultValue={editing?.kind ?? "CONTRACTOR"}>
            <option value="CONTRACTOR">Nhà thầu</option><option value="REGULAR">Khách quen</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="allowCredit" defaultChecked={!!editing?.allow_credit} />Cho mua chịu, thanh toán cuối tháng</label>
        <div className="flex justify-end gap-2">
          {editing && <Link href="/khach-hang" className="btn">Hủy</Link>}
          <SubmitButton>{editing ? "Lưu thay đổi" : "Thêm khách"}</SubmitButton>
        </div>
      </form>
    </div>
  );
}

function Suppliers({ editId }: { editId: number | null }) {
  const rows = listSuppliers();
  const editing = rows.find((s) => s.id === editId);
  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <section className="card overflow-x-auto">
        {rows.length ? (
          <table className="tbl">
            <thead><tr><th>Nhà cung cấp</th><th>Người liên hệ</th><th>Điện thoại</th><th>Nhập gần nhất</th><th></th></tr></thead>
            <tbody>{rows.map((s) => (
              <tr key={s.id}>
                <td>{s.name}{s.note && <div className="muted">{s.note}</div>}</td><td>{s.contact}</td><td>{s.phone}</td>
                <td>{s.last_import ? dateVN(s.last_import) : <span className="muted">chưa nhập</span>}</td>
                <td><Link href={`/khach-hang?tab=ncc&edit=${s.id}`} className="btn btn-sm">Sửa</Link></td>
              </tr>
            ))}</tbody>
          </table>
        ) : <Empty>Chưa có nhà cung cấp.</Empty>}
      </section>

      <form key={editing?.id ?? "new"} action={saveSupplierAction} className="card grid content-start gap-3">
        <h2 className="card-title mb-0">{editing ? `Sửa: ${editing.name}` : "Thêm nhà cung cấp"}</h2>
        <input type="hidden" name="id" value={editing?.id ?? ""} />
        <label className="lbl">Tên nhà cung cấp<input id="s-name" name="name" className="inp" defaultValue={editing?.name} required /></label>
        <label className="lbl">Người liên hệ<input id="s-contact" name="contact" className="inp" defaultValue={editing?.contact} /></label>
        <label className="lbl">Điện thoại<input id="s-phone" name="phone" className="inp" defaultValue={editing?.phone} /></label>
        <label className="lbl">Mặt hàng chính / ghi chú<input id="s-note" name="note" className="inp" defaultValue={editing?.note} /></label>
        <div className="flex justify-end gap-2">
          {editing && <Link href="/khach-hang?tab=ncc" className="btn">Hủy</Link>}
          <SubmitButton>{editing ? "Lưu thay đổi" : "Thêm nhà cung cấp"}</SubmitButton>
        </div>
      </form>
    </div>
  );
}
