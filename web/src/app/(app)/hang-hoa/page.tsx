import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getProduct } from "@/lib/catalog";
import { productsWithStock } from "@/lib/inventory";
import { qty, stockLabel } from "@/lib/format";
import { Empty, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { saveProductAction, toggleProductAction } from "./actions";

const BLANK_UNIT_ROWS = 2;

export default async function ProductsPage({ searchParams }: PageProps<"/hang-hoa">) {
  await requireUser("CH");
  const { id, q, ok, err } = await searchParams;
  const all = productsWithStock(false);
  const k = q ? String(q).toLowerCase() : "";
  const list = k ? all.filter((p) => `${p.code} ${p.name}`.toLowerCase().includes(k)) : all;
  const isNew = id === "moi";
  const product = !isNew && id ? getProduct(Number(id)) : null;
  const stock = product ? all.find((p) => p.id === product.id)?.stock ?? 0 : 0;
  const editing = isNew || product;
  const unitRows = [...(product?.units ?? []), ...Array.from({ length: BLANK_UNIT_ROWS }, () => null)];

  return (
    <>
      <h1 className="page-title">Hàng hóa & đơn vị tính</h1>
      <Flash ok={ok} err={err} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="card grid content-start gap-3">
          <div className="flex flex-wrap gap-2">
            <form className="flex flex-1 gap-2">
              <input name="q" aria-label="Tìm món" className="inp flex-1" placeholder="Tìm theo mã hoặc tên" defaultValue={k} />
              <button className="btn">Tìm</button>
            </form>
            <Link href="/hang-hoa?id=moi" className="btn btn-pri">+ Thêm hàng</Link>
          </div>
          {list.length ? (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Mã</th><th>Tên</th><th className="num">Tồn</th><th>Trạng thái</th></tr></thead>
                <tbody>{list.map((p) => (
                  <tr key={p.id} className={p.id === product?.id ? "bg-orange-50" : ""}>
                    <td className="text-xs">{p.code}</td>
                    <td><Link className="underline" href={`/hang-hoa?id=${p.id}`}>{p.name}</Link><div className="muted">{p.category}</div></td>
                    <td className="num whitespace-nowrap">{stockLabel(p.stock, p.base_unit, p.units)}</td>
                    <td>{p.active ? (p.stock < p.min_stock ? <span className="tag tag-warn">Sắp hết</span> : <span className="tag tag-ok">Đang bán</span>)
                      : <span className="tag">Ngừng KD</span>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <Empty>Không có món nào khớp “{k}”.</Empty>}
        </section>

        {editing ? (
          <section className="card grid content-start gap-3">
            <h2 className="card-title mb-0">{product ? product.name : "Món hàng mới"}</h2>
            <form action={saveProductAction} className="grid gap-3">
              <input type="hidden" name="id" value={product?.id ?? ""} />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="lbl">Mã hàng<input id="code" name="code" className="inp" defaultValue={product?.code} required /></label>
                <label className="lbl">Nhóm hàng<input id="category" name="category" className="inp" defaultValue={product?.category} /></label>
              </div>
              <label className="lbl">Tên hàng<input id="name" name="name" className="inp" defaultValue={product?.name} required /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="lbl">Đơn vị gốc (tính tồn kho)
                  <input id="baseUnit" name="baseUnit" className="inp" defaultValue={product?.base_unit} required readOnly={stock > 0} />
                  {stock > 0 && <span className="muted">Đã có tồn kho nên không đổi được.</span>}
                </label>
                <label className="lbl">Tồn tối thiểu (theo đơn vị gốc)
                  <input id="minStock" name="minStock" type="number" min="0" step="any" className="inp" defaultValue={product?.min_stock ?? 0} /></label>
              </div>

              <div className="grid gap-1">
                <span className="text-xs font-medium text-stone-600">Đơn vị bán & quy đổi</span>
                <table className="tbl">
                  <thead><tr><th>Đơn vị</th><th className="num">= số đơn vị gốc</th><th className="num">Giá bán</th></tr></thead>
                  <tbody>{unitRows.map((u, i) => (
                    <tr key={i}>
                      <td><input name={`unit_${i}`} aria-label="Đơn vị" className="inp w-24" defaultValue={u?.unit} placeholder={u ? "" : "vd. kg"} /></td>
                      <td className="num"><input name={`factor_${i}`} aria-label="Hệ số quy đổi" type="number" min="0" step="any" className="inp w-24 text-right" defaultValue={u?.factor} /></td>
                      <td className="num"><input name={`price_${i}`} aria-label="Giá bán" type="number" min="0" step="any" className="inp w-32 text-right" defaultValue={u?.price} /></td>
                    </tr>
                  ))}</tbody>
                </table>
                <span className="muted">Vd. ốc vít: đơn vị gốc “con”; “kg” = 160 con bán sỉ; “hộp” = 100 con. Để trống tên đơn vị để xóa dòng.</span>
              </div>
              <div className="flex justify-end"><SubmitButton>Lưu</SubmitButton></div>
            </form>

            {product && (
              <form action={toggleProductAction} className="flex items-center justify-between gap-3 border-t border-stone-200 pt-3">
                <input type="hidden" name="id" value={product.id} />
                <input type="hidden" name="active" value={product.active ? "0" : "1"} />
                <span className="muted">Tồn hiện tại: {qty(stock)} {product.base_unit}.
                  {product.active ? " Ngừng kinh doanh sẽ ẩn món khỏi màn hình bán, vẫn giữ lịch sử." : " Món đang ngừng kinh doanh."}</span>
                <SubmitButton className="btn">{product.active ? "Ngừng kinh doanh" : "Bán lại"}</SubmitButton>
              </form>
            )}
          </section>
        ) : (
          <section className="card"><Empty>Chọn một món ở danh sách để xem và sửa, hoặc bấm “Thêm hàng”.</Empty></section>
        )}
      </div>
    </>
  );
}
