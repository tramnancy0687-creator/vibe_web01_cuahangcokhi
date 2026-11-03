// Dữ liệu mẫu cho lần chạy đầu: 2 tháng hoạt động của cửa hàng Thành Phát.
// Đi qua đúng các hàm nghiệp vụ, nên tồn kho, giá vốn và công nợ khớp nhau.
import { get, run, tx } from "./db";
import { hashPassword } from "./auth";
import { createImport, openStocktake, saveStocktake, stocktakeItems } from "./inventory";
import { createReturn, createSale, findSale } from "./sales";
import { recordPayment } from "./debt";

const DEMO_PASSWORD = "123456";

const daysAgo = (d: number, hour = 9) => {
  const t = new Date(Date.now() - d * 86_400_000);
  t.setUTCHours(hour - 7, 15, 0, 0); // giờ Việt Nam
  return t;
};

const PRODUCTS: [string, string, string, string, number, [string, number, number][]][] = [
  // mã, tên, nhóm, đơn vị gốc, tồn tối thiểu (đơn vị gốc), [đơn vị, hệ số, giá bán]
  ["OV-M8-30", "Ốc vít M8 x 30", "Ốc vít, bu lông", "con", 800, [["con", 1, 500], ["hộp", 100, 48_000], ["kg", 160, 70_000]]],
  ["OV-M8-50", "Ốc vít M8 x 50", "Ốc vít, bu lông", "con", 550, [["con", 1, 700], ["kg", 110, 72_000]]],
  ["BL-M12", "Bu lông M12 + tán", "Ốc vít, bu lông", "con", 100, [["con", 1, 3_500]]],
  ["DD-CAD-25", "Dây điện Cadivi 2.5", "Điện", "m", 200, [["m", 1, 9_500], ["cuộn", 100, 900_000]]],
  ["XM-HT", "Xi măng Hà Tiên PCB40", "Vật liệu xây dựng", "bao", 30, [["bao", 1, 89_000]]],
  ["TH-4080", "Thép hộp 40x80 dày 1.4", "Sắt thép", "cây", 10, [["cây", 1, 350_000]]],
  ["QH-32", "Que hàn 3.2 ly", "Vật tư hàn", "kg", 60, [["kg", 1, 65_000], ["hộp", 5, 310_000]]],
  ["SON-CG-3L", "Sơn chống gỉ 3L", "Sơn", "lon", 6, [["lon", 1, 185_000]]],
  ["SON-XAM-18L", "Sơn chống gỉ xám 18L", "Sơn", "thùng", 0, [["thùng", 1, 1_650_000]]],
  ["BLC-INOX", "Bản lề cối inox 3 tấc", "Phụ kiện cửa", "cái", 0, [["cái", 1, 35_000]]],
];

export function seed() {
  tx(() => {
    const pw = hashPassword(DEMO_PASSWORD);
    for (const [username, name, role] of [
      ["chu", "Anh Phát", "CH"], ["lan", "Nguyễn Thị Lan", "NV"], ["hung", "Trần Văn Hùng", "NV"], ["minh", "Lê Quang Minh", "TK"],
    ]) {
      run("INSERT INTO users (username, full_name, role, password_hash) VALUES (?, ?, ?, ?)", username, name, role, pw);
    }
    for (const [code, name, cat, base, min, units] of PRODUCTS) {
      const id = run("INSERT INTO products (code, name, category, base_unit, min_stock) VALUES (?, ?, ?, ?, ?)",
        code, name, cat, base, min).lastInsertRowid;
      for (const [u, f, p] of units) run("INSERT INTO product_units (product_id, unit, factor, price) VALUES (?, ?, ?, ?)", id, u, f, p);
    }
    for (const [name, contact, phone] of [
      ["Cơ khí Nam Tiến", "Anh Tiến", "0903 112 845"], ["Đại lý Cadivi Phú Mỹ", "Chị Mỹ", "0918 227 310"], ["VLXD Hòa Bình", "Anh Bình", "0283 755 2210"],
    ]) run("INSERT INTO suppliers (name, contact, phone) VALUES (?, ?, ?)", name, contact, phone);
    for (const [name, phone, kind, credit] of [
      ["Anh Tư (thầu Q.7)", "0908 551 412", "CONTRACTOR", 1], ["Cty XD Phú Lộc", "0283 870 5521", "CONTRACTOR", 1],
      ["Chú Hai Mộc", "0937 640 118", "CONTRACTOR", 1], ["Chị Hoa", "0912 330 077", "REGULAR", 0],
    ] as const) run("INSERT INTO customers (name, phone, kind, allow_credit) VALUES (?, ?, ?, ?)", name, phone, kind, credit);

    const P = (code: string) => get<{ id: number }>("SELECT id FROM products WHERE code = ?", code)!.id;
    const U = (username: string) => get<{ id: number }>("SELECT id FROM users WHERE username = ?", username)!.id;
    const S = (name: string) => get<{ id: number }>("SELECT id FROM suppliers WHERE name = ?", name)!.id;
    const C = (name: string) => get<{ id: number }>("SELECT id FROM customers WHERE name = ?", name)!.id;
    const minh = U("minh"), lan = U("lan"), hung = U("hung"), chu = U("chu");
    const line = (code: string, unit: string, qty: number) => ({ productId: P(code), unit, qty });
    const imp = (code: string, unit: string, qty: number, unitPrice: number) => ({ ...line(code, unit, qty), unitPrice });

    // Hàng tồn lâu: nhập từ năm ngoái, gần như không bán
    createImport({ userId: minh, supplierId: S("Cơ khí Nam Tiến"), invoiceNo: "0003318",
      items: [imp("BLC-INOX", "cái", 90, 22_000), imp("SON-XAM-18L", "thùng", 5, 1_250_000)] }, daysAgo(420));
    createSale({ userId: hung, customerId: null, payment: "CASH", items: [line("BLC-INOX", "cái", 4)] }, daysAgo(400, 10));

    createImport({ userId: minh, supplierId: S("Cơ khí Nam Tiến"), invoiceNo: "0004127", items: [
      imp("OV-M8-30", "kg", 20, 52_000), imp("OV-M8-50", "kg", 10, 54_000), imp("BL-M12", "con", 300, 2_400), imp("QH-32", "hộp", 15, 240_000),
    ] }, daysAgo(60, 8));
    createImport({ userId: minh, supplierId: S("Đại lý Cadivi Phú Mỹ"), invoiceNo: "CV-88213",
      items: [imp("DD-CAD-25", "cuộn", 3, 720_000)] }, daysAgo(58, 8));
    createImport({ userId: minh, supplierId: S("VLXD Hòa Bình"), invoiceNo: "HB-1907", items: [
      imp("XM-HT", "bao", 100, 76_000), imp("TH-4080", "cây", 40, 290_000), imp("SON-CG-3L", "lon", 12, 140_000),
    ] }, daysAgo(57, 8));

    const tu = C("Anh Tư (thầu Q.7)");
    createSale({ userId: lan, customerId: tu, payment: "CREDIT",
      items: [line("TH-4080", "cây", 12), line("XM-HT", "bao", 20), line("OV-M8-30", "kg", 3)] }, daysAgo(55, 9));
    createSale({ userId: lan, customerId: null, payment: "CASH",
      items: [line("OV-M8-30", "kg", 5), line("DD-CAD-25", "m", 100)] }, daysAgo(50, 14));
    createSale({ userId: hung, customerId: C("Cty XD Phú Lộc"), payment: "CREDIT",
      items: [line("XM-HT", "bao", 30), line("DD-CAD-25", "cuộn", 1)] }, daysAgo(45, 10));
    createSale({ userId: hung, customerId: null, payment: "CASH",
      items: [line("OV-M8-30", "con", 400), line("QH-32", "hộp", 3)] }, daysAgo(40, 16));
    recordPayment({ userId: chu, customerId: tu, amount: 3_000_000, method: "Tiền mặt", note: "Trả bớt tháng 9" }, daysAgo(30, 17));
    createSale({ userId: lan, customerId: C("Chị Hoa"), payment: "CASH",
      items: [line("OV-M8-30", "kg", 6), line("BL-M12", "con", 40), line("SON-CG-3L", "lon", 2)] }, daysAgo(20, 11));
    createSale({ userId: lan, customerId: C("Chú Hai Mộc"), payment: "CREDIT",
      items: [line("XM-HT", "bao", 15), line("TH-4080", "cây", 4), line("SON-CG-3L", "lon", 2)] }, daysAgo(12, 9));
    createSale({ userId: hung, customerId: null, payment: "CASH",
      items: [line("DD-CAD-25", "m", 60), line("OV-M8-30", "kg", 2), line("QH-32", "hộp", 2)] }, daysAgo(6, 15));

    // Kiểm kê kệ ốc vít: 2 món lệch, chờ chủ duyệt
    const st = openStocktake(minh, daysAgo(5, 7));
    saveStocktake(st, stocktakeItems(st).map((it) => {
      if (it.code === "OV-M8-50") return { itemId: it.id, actual: it.book_qty - 66, reason: "Rơi vãi, cân lại" };
      if (it.code === "BL-M12") return { itemId: it.id, actual: it.book_qty + 12, reason: "Nhập thiếu sổ lô trước" };
      return { itemId: it.id, actual: it.category === "Ốc vít, bu lông" ? it.book_qty : null, reason: "" };
    }), true, daysAgo(5, 11));

    const credit = createSale({ userId: lan, customerId: tu, payment: "CREDIT",
      items: [line("TH-4080", "cây", 8), line("OV-M8-50", "kg", 2)] }, daysAgo(3, 10));
    const sale = findSale(credit)!;
    createReturn({ userId: hung, saleId: sale.id, reason: "Công trình dư, khách đổi thiết kế",
      lines: [{ saleItemId: sale.items[0].id, qty: 3, intact: true }] }, daysAgo(2, 16));
    createSale({ userId: lan, customerId: null, payment: "CASH",
      items: [line("OV-M8-30", "con", 100), line("XM-HT", "bao", 5)] }, daysAgo(1, 9));
    createSale({ userId: hung, customerId: null, payment: "CASH", items: [line("OV-M8-50", "con", 50)] }, daysAgo(0, 8));
  });
}
