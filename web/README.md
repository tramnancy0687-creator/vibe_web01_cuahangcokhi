# Thành Phát · Website quản lý cửa hàng cơ khí

Next.js 16 (App Router) + SQLite (`node:sqlite` có sẵn trong Node, không cần cài thêm driver).
Đặc tả: [../docs/phan-tich-usecase.md](../docs/phan-tich-usecase.md) · Sơ đồ: [../docs/usecase_cuahang_cokhi.puml](../docs/usecase_cuahang_cokhi.puml) · Wireframe: [../docs/wireframe.html](../docs/wireframe.html)

## Chạy dự án

Cần Node.js ≥ 22.13 (đang dùng 26 LTS).

```bash
npm install
npm run dev        # mở http://localhost:3000
```

Lần chạy đầu tự tạo `data/cuahang.db` cùng dữ liệu mẫu (2 tháng hoạt động). Mở file `.db` bằng extension **SQLite Viewer** trong VS Code.
Muốn làm lại từ đầu: tắt server, xóa thư mục `data/`, chạy lại.

| Tài khoản | Mật khẩu | Vai trò |
|---|---|---|
| `chu` | `123456` | Chủ cửa hàng (toàn quyền) |
| `lan`, `hung` | `123456` | Nhân viên bán hàng |
| `minh` | `123456` | Thủ kho |

> Mật khẩu mẫu chỉ để học. Đổi ngay ở màn hình **Tài khoản nhân viên** nếu dùng thật.

## Màn hình ↔ use case

| Đường dẫn | Màn hình | Use case | Vai trò |
|---|---|---|---|
| `/login` | Đăng nhập | UC-01 | Tất cả |
| `/` | Trang chủ | UC-20, UC-17 (tóm tắt) | Tất cả |
| `/ban-hang` | Bán hàng | UC-06, 07, 08, 09 | Chủ, NV |
| `/tra-hang` | Nhận hàng trả lại | UC-10, 11 | Chủ, NV |
| `/cong-no` | Công nợ & thu nợ | UC-12 | Chủ, NV |
| `/nhap-hang` | Nhập hàng theo lô | UC-13, 09 | Chủ, Thủ kho |
| `/kiem-ke` | Kiểm kê kho | UC-14, 15 | Chủ, Thủ kho |
| `/hang-hoa` | Hàng hóa & đơn vị tính | UC-02 | Chủ |
| `/khach-hang` | Khách hàng & nhà cung cấp | UC-03, 04 | Chủ |
| `/tai-khoan` | Tài khoản nhân viên | UC-05 | Chủ |
| `/bao-cao` | Báo cáo (6 tab) | UC-16 → 22 | Chủ |

## Cấu trúc

```
src/
├── app/
│   ├── login/              đăng nhập
│   └── (app)/              các màn hình sau đăng nhập (layout có menu theo vai trò)
│       └── <màn hình>/     page.tsx (giao diện) + actions.ts (server action)
├── components/             Flash, Tabs, SubmitButton...
└── lib/                    nghiệp vụ, không phụ thuộc giao diện
    ├── schema.ts           bảng SQLite + cấu hình mặc định
    ├── db.ts               kết nối, giao dịch (tx), sinh mã chứng từ
    ├── auth.ts             đăng nhập, phiên, requireUser(vai trò)
    ├── menu.ts             bảng phân quyền màn hình
    ├── inventory.ts        tồn kho, FIFO theo lô, nhập hàng, kiểm kê
    ├── sales.ts            bán hàng, trả hàng
    ├── debt.ts             sổ công nợ, thu nợ
    ├── catalog.ts          hàng hóa, khách, NCC, tài khoản
    ├── reports.ts          6 báo cáo
    └── seed.ts             dữ liệu mẫu
```

## Quy ước nghiệp vụ đã chọn

- **Tồn kho** luôn lưu theo **đơn vị gốc** (con, m, bao...). Đơn vị bán/nhập quy đổi qua bảng `product_units` (UC-09).
- **Giá vốn FIFO**: mỗi dòng nhập là một lô; bán thì lấy từ lô nhập trước. Muốn đổi sang giá bình quân chỉ sửa `consumeFIFO` trong `lib/inventory.ts`. *(Câu hỏi còn mở với khách.)*
- **Giá bán lấy từ danh mục** ở phía server, không tin giá gửi lên từ trình duyệt. Người bán lấy từ phiên đăng nhập.
- **Quyền** kiểm tra ở server: mọi trang và mọi server action đều gọi `requireUser(...)`. Ẩn menu chỉ là phụ.
- **Công nợ** là sổ cái `debt_entries` (+ bán chịu, − trả hàng/thu tiền). "Nợ từ ngày" = khoản nợ cũ nhất chưa trả hết.
- **Kiểm kê** chốt số sổ sách lúc hoàn tất; chủ duyệt từng dòng lệch thì tồn kho mới được điều chỉnh.
- Các con số (ngưỡng tồn lâu 12 tháng, nợ quá hạn 30 ngày, khóa đăng nhập sau 5 lần sai...) nằm trong bảng `settings`, không hard-code.
