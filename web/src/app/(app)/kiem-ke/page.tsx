import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { draftStocktake, stocktakeItems } from "@/lib/inventory";
import { dateTimeVN, qty } from "@/lib/format";
import { Flash } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { openStocktakeAction, saveStocktakeAction } from "./actions";

export default async function StocktakePage({ searchParams }: PageProps<"/kiem-ke">) {
  const user = await requireUser("CH", "TK");
  const { ok, err, nhom } = await searchParams;
  const draft = draftStocktake();

  if (!draft) {
    return (
      <>
        <h1 className="page-title">Kiểm kê kho</h1>
        <Flash ok={ok} err={err} />
        <div className="card grid max-w-xl gap-3">
          <p className="text-sm">Không có đợt kiểm kê nào đang mở. Bắt đầu đợt mới để đếm hàng thực tế và đối chiếu với sổ sách.</p>
          <form action={openStocktakeAction}><SubmitButton>Bắt đầu đợt kiểm kê</SubmitButton></form>
          {user.role === "CH" && <p className="muted">Chỗ lệch của các đợt đã xong nằm ở <Link className="underline" href="/bao-cao?tab=chenh-lech">Báo cáo › Chênh lệch kiểm kê</Link>.</p>}
        </div>
      </>
    );
  }

  const items = stocktakeItems(draft.id);
  const groups = [...new Set(items.map((i) => i.category))];
  const shown = nhom ? items.filter((i) => i.category === nhom) : items;
  const counted = items.filter((i) => i.actual_qty !== null);
  const diffs = counted.filter((i) => Math.abs(i.actual_qty! - i.book_qty) > 1e-9);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Đợt kiểm kê {draft.code}</h1>
          <p className="muted">Bắt đầu {dateTimeVN(draft.created_at)} · {draft.user}</p>
        </div>
        <form className="flex gap-2">
          <select name="nhom" aria-label="Lọc theo nhóm hàng" className="inp" defaultValue={nhom ? String(nhom) : ""}>
            <option value="">Tất cả nhóm hàng</option>
            {groups.map((g) => <option key={g}>{g}</option>)}
          </select>
          <button className="btn">Lọc</button>
        </form>
      </div>
      <Flash ok={ok} err={err} />

      <form action={saveStocktakeAction} className="card grid gap-3">
        <input type="hidden" name="stocktakeId" value={draft.id} />
        <input type="hidden" name="nhom" value={nhom ? String(nhom) : ""} />
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Món</th><th>Đơn vị</th><th className="num">Sổ sách</th><th className="num">Thực tế</th><th className="num">Lệch</th><th>Lý do (bắt buộc khi lệch)</th></tr></thead>
            <tbody>{shown.map((it) => {
              const diff = it.actual_qty === null ? null : it.actual_qty - it.book_qty;
              const off = diff !== null && Math.abs(diff) > 1e-9;
              return (
                <tr key={it.id} className={off ? "bg-orange-50" : ""}>
                  <td>{it.name}<div className="muted">{it.code}</div></td>
                  <td>{it.base_unit}</td>
                  <td className="num">{qty(it.book_qty)}</td>
                  <td className="num"><input type="number" name={`actual_${it.id}`} min="0" step="any" aria-label={`Số thực tế ${it.name}`}
                    defaultValue={it.actual_qty ?? ""} className="inp w-24 text-right" /></td>
                  <td className="num">{diff === null ? <span className="muted">chưa đếm</span>
                    : off ? <span className={`tag ${diff < 0 ? "tag-bad" : "tag-warn"}`}>{diff > 0 ? "+" : "−"} {qty(Math.abs(diff))}</span> : "0"}</td>
                  <td><input name={`reason_${it.id}`} aria-label={`Lý do lệch ${it.name}`} defaultValue={it.reason} className={`inp w-full ${off && !it.reason ? "border-red-500" : ""}`} /></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="muted">Đã đếm {counted.length}/{items.length} món · {diffs.length} món lệch. Bấm “Lưu tạm” để xem cột lệch.</span>
          <div className="flex gap-2">
            <SubmitButton className="btn" name="finish" value="0">Lưu tạm</SubmitButton>
            <SubmitButton name="finish" value="1">Hoàn tất & báo chủ</SubmitButton>
          </div>
        </div>
        <p className="muted">Khi hoàn tất, số sổ sách được chốt lại tại thời điểm đó. Chủ cửa hàng duyệt từng dòng lệch thì tồn kho mới được điều chỉnh.</p>
      </form>
    </>
  );
}
