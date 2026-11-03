const TZ = "Asia/Ho_Chi_Minh";

const moneyFmt = new Intl.NumberFormat("vi-VN");
const qtyFmt = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

export const money = (n: number) => moneyFmt.format(Math.round(n));
export const qty = (n: number) => qtyFmt.format(n);

export function dateVN(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
}

export function dateTimeVN(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

/** Tháng hiện tại theo giờ Việt Nam, dạng YYYY-MM */
export function currentMonth() {
  return new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 7);
}

/** Khoảng [từ, đến) theo UTC của một tháng giờ Việt Nam */
export function monthRange(month: string): [string, string] {
  const [y, m] = month.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1) - 7 * 3600_000);
  const to = new Date(Date.UTC(y, m, 1) - 7 * 3600_000);
  return [from.toISOString(), to.toISOString()];
}

export function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

type Unit = { unit: string; factor: number };

/** "300 con (≈ 1,88 kg)": số gốc kèm quy đổi sang đơn vị lớn nhất */
export function stockLabel(baseQty: number, baseUnit: string, units: Unit[]) {
  const big = units.filter((u) => u.factor > 1).sort((a, b) => b.factor - a.factor)[0];
  const base = `${qty(baseQty)} ${baseUnit}`;
  return big && baseQty > 0 ? `${base} (≈ ${qty(baseQty / big.factor)} ${big.unit})` : base;
}

export const ROLE_LABEL: Record<string, string> = {
  CH: "Chủ cửa hàng",
  NV: "NV bán hàng",
  TK: "Thủ kho",
};
