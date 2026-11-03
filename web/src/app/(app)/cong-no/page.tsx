import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { get, setting } from "@/lib/db";
import { balance, debtors, ledger } from "@/lib/debt";
import { dateTimeVN, dateVN, daysSince, money } from "@/lib/format";
import { Empty, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { recordPaymentAction } from "./actions";

const KIND: Record<string, string> = { SALE: "Mua chịu", RETURN: "Trả hàng", PAYMENT: "Thu tiền" };

export default async function DebtPage({ searchParams }: PageProps<"/cong-no">) {
  await requireUser("CH", "NV");
  const { id, ok, err } = await searchParams;
  const list = debtors();
  const overdueDays = setting("overdue_debt_days");
  const selectedId = id ? Number(id) : list[0]?.id;
  const customer = selectedId ? get<{ id: number; name: string; phone: string }>("SELECT id, name, phone FROM customers WHERE id = ?", selectedId) : undefined;
  const entries = customer ? ledger(customer.id) : [];
  const owed = customer ? balance(customer.id) : 0;

  return (
    <>
      <h1 className="page-title">Công nợ & thu nợ</h1>
      <Flash ok={ok} err={err} />
      <div className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
        <section className="card">
          <h2 className="card-title">Khách đang nợ · {money(list.reduce((s, d) => s + d.balance, 0))} đ</h2>
          {list.length ? (
            <table className="tbl">
              <thead><tr><th>Khách</th><th className="num">Còn nợ</th><th>Nợ từ</th></tr></thead>
              <tbody>{list.map((d) => {
                const days = d.since ? daysSince(d.since) : 0;
                return (
                  <tr key={d.id} className={d.id === customer?.id ? "bg-orange-50" : ""}>
                    <td><Link className="underline" href={`/cong-no?id=${d.id}`}>{d.name}</Link><div className="muted">{d.phone}</div></td>
                    <td className="num">{money(d.balance)}</td>
                    <td>{d.since && <>{dateVN(d.since)} <span className={`tag ${days > overdueDays ? "tag-bad" : "tag-warn"}`}>{days} ngày</span></>}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          ) : <Empty>Không có khách nào đang nợ.</Empty>}
        </section>

        {customer && (
          <section className="card grid content-start gap-3">
            <h2 className="card-title mb-0">{customer.name} · {customer.phone}</h2>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Ngày</th><th>Loại</th><th>Chứng từ</th><th className="num">Phát sinh</th><th className="num">Còn nợ</th></tr></thead>
                <tbody>{entries.map((e) => (
                  <tr key={e.id}>
                    <td>{dateTimeVN(e.created_at)}</td><td>{KIND[e.kind]}</td>
                    <td>{e.ref}{e.method && <span className="muted"> · {e.method}</span>}{e.note && <div className="muted">{e.note}</div>}</td>
                    <td className="num">{e.amount > 0 ? "+ " : "− "}{money(Math.abs(e.amount))}</td>
                    <td className="num">{money(e.running)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {owed > 0 ? (
              <form action={recordPaymentAction} className="grid gap-3 border-t border-stone-200 pt-3">
                <input type="hidden" name="customerId" value={customer.id} />
                <div className="flex flex-wrap gap-3">
                  <label className="lbl">Số tiền thu (tối đa {money(owed)})
                    <input id="amount" name="amount" type="number" min="1" max={owed} step="1000" className="inp w-44 text-right" required /></label>
                  <label className="lbl">Hình thức
                    <select id="method" name="method" className="inp"><option>Tiền mặt</option><option>Chuyển khoản</option></select></label>
                </div>
                <label className="lbl">Ghi chú<input id="note" name="note" className="inp" placeholder="Vd. thanh toán đợt tháng 10" /></label>
                <p className="muted">Cho thu một phần. Tiền thu trừ vào khoản nợ cũ nhất trước.</p>
                <div className="flex justify-end"><SubmitButton>Ghi nhận thanh toán</SubmitButton></div>
              </form>
            ) : <p className="text-sm text-green-700">Khách đã trả hết nợ.</p>}
          </section>
        )}
      </div>
    </>
  );
}
