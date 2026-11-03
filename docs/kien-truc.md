# Kiến trúc hệ thống — Website quản lý cửa hàng cơ khí Thành Phát

Tài liệu mô tả cách website được xây dựng để hiện thực các use case trong [phan-tich-usecase.md](phan-tich-usecase.md).
Mã nguồn: thư mục [`../web`](../web). Màn hình tham khảo: [wireframe.html](wireframe.html).
Chi tiết CSDL: [thiet-ke-csdl.md](thiet-ke-csdl.md). Hướng dẫn cho người dùng: [huong-dan-su-dung.md](huong-dan-su-dung.md).

---

## 1. Tổng quan

| Thành phần | Lựa chọn | Lý do |
|---|---|---|
| Khung web | **Next.js 16** (App Router, React 19, TypeScript) | Giao diện và xử lý server nằm chung một dự án; trang render sẵn ở server nên máy yếu ở quầy vẫn chạy nhanh |
| Cơ sở dữ liệu | **SQLite** — một file `web/data/cuahang.db` | Cửa hàng nhỏ, 1 máy chủ, ít người dùng cùng lúc; không cần cài máy chủ CSDL, sao lưu chỉ là chép 1 file |
| Driver CSDL | `node:sqlite` có sẵn trong Node ≥ 22.13 | Không phải cài thêm gói biên dịch C++ trên Windows |
| Giao diện | Tailwind CSS v4 | Viết nhanh, giao diện gọn, dùng được trên điện thoại |
| Đăng nhập | Tự làm: cookie phiên + mật khẩu băm `scrypt` | Chỉ có vài tài khoản nội bộ, không cần dịch vụ ngoài |

Hệ thống chạy trên **một máy** (máy tính ở cửa hàng hoặc một máy chủ nhỏ). Nhân viên mở bằng trình duyệt trong mạng nội bộ.

```
  Trình duyệt (Chủ / NV bán hàng / Thủ kho)
        │  HTTP (trang HTML + form)
        ▼
 ┌──────────────────── Next.js server (Node) ────────────────────┐
 │  Tầng giao diện   app/(app)/<màn hình>/page.tsx               │
 │        │ gửi form                                              │
 │  Tầng điều khiển  app/(app)/<màn hình>/actions.ts  (server action)
 │        │ requireUser(vai trò) → gọi hàm nghiệp vụ              │
 │  Tầng nghiệp vụ   lib/sales.ts, inventory.ts, debt.ts, ...     │
 │        │ SQL qua all / get / run / tx                           │
 │  Tầng dữ liệu     lib/db.ts  ──►  data/cuahang.db (SQLite)     │
 └────────────────────────────────────────────────────────────────┘
```

---

## 2. Phân tầng

Quy tắc chung: **tầng trên chỉ gọi tầng dưới**, không gọi ngược. Mọi quy tắc nghiệp vụ nằm ở tầng nghiệp vụ, không nằm trong giao diện.

### 2.1 Tầng giao diện — `src/app/`

- Mỗi màn hình là một thư mục trong `app/(app)/`. Mỗi thư mục có `page.tsx`, chạy ở server: đọc dữ liệu rồi trả HTML.
- Thư mục nhóm `(app)` có chung `layout.tsx`. Layout này bắt buộc người dùng đăng nhập và vẽ menu theo vai trò.
- Chỉ những chỗ cần tương tác tức thì mới dùng **client component** (`"use client"`):
  - `ban-hang/PosForm.tsx`: tìm món không dấu, thêm và xóa dòng, tính tổng tạm.
  - `nhap-hang/ImportForm.tsx`: nhập nhiều dòng hàng.
  - `login/LoginForm.tsx`.
- Các thành phần dùng chung nằm trong `components/`: `Flash` (thông báo), `Tabs`, `Stat`, `Empty`, `SubmitButton`.

### 2.2 Tầng điều khiển — `actions.ts` (server action)

Mỗi màn hình có một file `actions.ts`. Mỗi hàm trong file đều làm đúng 4 bước:

1. `requireUser(...vai trò)` kiểm tra quyền lại ở server.
2. Đọc và chuyển kiểu dữ liệu từ form (`num`, `str` trong `lib/actions.ts`).
3. Gọi **một** hàm nghiệp vụ trong `lib/`.
4. Quay lại trang kèm thông báo (`?ok=...` hoặc `?err=...`), hoặc trả lỗi về form.

Người thực hiện (người bán, người nhập, người thu tiền) luôn lấy từ phiên đăng nhập, không bao giờ lấy từ form.

### 2.3 Tầng nghiệp vụ — `src/lib/`

| File | Nội dung | Use case |
|---|---|---|
| `auth.ts` | Đăng nhập, khóa tài khoản khi sai nhiều lần, phiên, `requireUser` | UC-01 |
| `menu.ts` | Bảng phân quyền: màn hình nào cho vai trò nào | UC-01, UC-05 |
| `catalog.ts` | Hàng hóa và đơn vị tính, khách hàng, nhà cung cấp, tài khoản nhân viên | UC-02 → 05 |
| `sales.ts` | Lập phiếu bán (tiền mặt hoặc ghi nợ), nhận hàng trả lại | UC-06 → 11 |
| `debt.ts` | Sổ công nợ, số dư, "nợ từ ngày", thu nợ | UC-08, 11, 12, 17 |
| `inventory.ts` | Tồn kho, lô hàng FIFO, nhập hàng, kiểm kê, duyệt chênh lệch | UC-09, 13 → 15 |
| `reports.ts` | 6 báo cáo | UC-16 → 22 |
| `format.ts` | Định dạng tiền, số lượng, ngày giờ Việt Nam | — |
| `seed.ts` | Dữ liệu mẫu khoảng 2 tháng, tạo bằng chính các hàm nghiệp vụ trên | — |

Khi vi phạm quy tắc, hàm nghiệp vụ ném `BizError("thông báo cho người dùng")`. Tầng điều khiển bắt lỗi này và hiển thị nguyên văn thông báo.

### 2.4 Tầng dữ liệu — `src/lib/db.ts`

- **Kết nối:** mở **một kết nối duy nhất**, bật chế độ WAL và khóa ngoại.
- **Khởi tạo lần đầu:** tự tạo bảng (`schema.ts`), ghi cấu hình mặc định và nạp dữ liệu mẫu nếu chưa có người dùng.
- **Hàm truy vấn:**
  - `all(sql, ...)` và `get(sql, ...)` đọc dữ liệu.
  - `run(sql, ...)` ghi dữ liệu.
- **`tx(fn)`:** gom nhiều câu lệnh thành **một giao dịch**. Có lỗi giữa chừng thì hoàn tác toàn bộ, ví dụ phiếu bán và trừ kho phải cùng thành công.
- **Hàm tiện ích:**
  - `setting(key)` đọc con số nghiệp vụ từ bảng `settings`.
  - `nextCode(...)` sinh mã chứng từ theo ngày, ví dụ `PB-261102-007`.

Mọi câu SQL đều dùng tham số `?`, không ghép chuỗi, nên tránh được SQL injection.

---

## 3. Luồng xử lý mẫu: lập phiếu bán ghi nợ (UC-07 + UC-08 + UC-09)

```
NV bán hàng      PosForm (trình duyệt)     createSaleAction         sales.createSale           SQLite
    │ chọn món, ĐVT, SL │                         │                         │                      │
    │──────────────────►│ submit form ───────────►│ requireUser(CH,NV)      │                      │
    │                   │                         │ đọc form ──────────────►│ tx(BEGIN)            │
    │                   │                         │                         │ kiểm tra khách được  │
    │                   │                         │                         │   ghi nợ             │
    │                   │                         │                         │ lấy giá từ danh mục  │
    │                   │                         │                         │ quy đổi ĐVT → ĐV gốc │
    │                   │                         │                         │ consumeFIFO: trừ lô  │
    │                   │                         │                         │   cũ nhất, tính vốn ─┼─► batches
    │                   │                         │                         │ ghi sales, sale_items┼─► sales…
    │                   │                         │                         │ ghi debt_entries(+)  ┼─► debt_entries
    │                   │                         │                         │ COMMIT               │
    │                   │◄── redirect ?ok=Đã lưu phiếu PB-… ◄───────────────│                      │
```

Nếu một món không đủ tồn kho, `consumeFIFO` ném `BizError` và giao dịch được hoàn tác. Phiếu không được lưu, kho không bị trừ, form hiện lỗi và giữ nguyên dữ liệu đã nhập.

---

## 4. Dữ liệu

### 4.1 Sơ đồ quan hệ (rút gọn)

```
users ──< sessions
users ──< sales >── customers ──< debt_entries
            │
            └──< sale_items >── products ──< product_units
                     │              │
returns ──< return_items            ├──< batches        (lô hàng, nguồn: IMPORT / RETURN / ADJUST)
                                    ├──< import_items >── imports >── suppliers
                                    └──< stocktake_items >── stocktakes
settings (key, value)
```

### 4.2 Quy ước lưu trữ

| Quy ước | Chi tiết |
|---|---|
| Số lượng | Luôn lưu theo **đơn vị gốc** của món (con, m, kg, bao). Đơn vị khác quy đổi qua `product_units.factor`, ví dụ 1 hộp = 100 con |
| Tiền | Số nguyên VND |
| Thời gian | Chuỗi ISO giờ UTC; khi hiển thị đổi sang giờ Việt Nam |
| Tồn kho | **Không có cột "tồn"**. Tồn kho = tổng `batches.qty_left` của món, nên không bao giờ lệch với lịch sử nhập, xuất |
| Công nợ | Sổ cái `debt_entries`: bán chịu ghi số dương; trả hàng và thu tiền ghi số âm. Số dư = tổng cộng |
| Chứng từ | Không sửa, không xóa phiếu đã lưu. Sai thì lập phiếu trả hàng hoặc kiểm kê điều chỉnh |
| Ngừng dùng | Hàng, khách, tài khoản chỉ đánh dấu `active = 0`, không xóa, để giữ lịch sử |

### 4.3 Giá vốn theo lô (FIFO)

- **Nhập hàng:** mỗi dòng nhập tạo một **lô** (`batches`) có giá vốn của một đơn vị gốc.
- **Bán hàng:** lấy hàng từ lô cũ nhất còn hàng. Giá vốn của dòng bán = tổng (số lấy × giá vốn lô).
- **Trả hàng:** hàng trả lại tạo một lô mới với đúng giá vốn lúc bán, nên báo cáo lãi lỗ không bị sai.
- **Kiểm kê:** chênh lệch đã được chủ duyệt tạo lô điều chỉnh khi thừa hàng, hoặc trừ lô khi thiếu hàng.

> Câu hỏi còn mở với khách hàng: dùng FIFO hay giá bình quân. Nếu đổi sang giá bình quân, chỉ cần sửa `consumeFIFO` trong `lib/inventory.ts`.

### 4.4 Cấu hình nghiệp vụ (bảng `settings`)

Các con số không viết cứng trong code:

| Khóa | Mặc định | Dùng ở |
|---|---|---|
| `slow_moving_months` | 12 | Báo cáo tồn lâu (UC-19) |
| `overdue_debt_days` | 30 | Đánh dấu nợ quá hạn (UC-17) |
| `login_max_failures` | 5 | Khóa tài khoản sau N lần nhập sai (UC-01) |
| `login_lock_minutes` | 15 | Thời gian khóa |
| `session_hours` | 12 | Thời hạn phiên đăng nhập |

---

## 5. Bảo mật và phân quyền

| Vai trò | Mã | Màn hình được vào |
|---|---|---|
| Chủ cửa hàng | `CH` | Tất cả |
| Nhân viên bán hàng | `NV` | Trang chủ, Bán hàng, Trả hàng, Công nợ |
| Thủ kho | `TK` | Trang chủ, Nhập hàng, Kiểm kê |

- **Kiểm tra quyền 2 lớp:** menu ẩn những mục không được phép, **và** mọi `page.tsx` cũng như mọi server action đều gọi `requireUser(...)`. Gõ thẳng đường dẫn cũng bị chặn.
- **Mật khẩu:** băm bằng `scrypt` có salt riêng từng tài khoản và so sánh bằng `timingSafeEqual`. Không lưu mật khẩu gốc.
- **Phiên đăng nhập:**
  - Token ngẫu nhiên 32 byte, lưu ở bảng `sessions` và trong cookie `httpOnly` + `sameSite=lax`.
  - Đăng xuất là xóa phiên trong CSDL.
- **Chống dò mật khẩu:** nhập sai quá số lần cho phép thì tài khoản bị khóa tạm. Thông báo lỗi chung chung, không tiết lộ tài khoản có tồn tại hay không.
- **Không tin dữ liệu từ trình duyệt:**
  - Giá bán lấy từ danh mục ở server.
  - Người thực hiện lấy từ phiên đăng nhập.
  - Số lượng trả không được vượt số còn lại trên phiếu bán.
- **Tự bảo vệ:** chủ không thể tự khóa hoặc tự bỏ quyền Chủ của chính mình. Khách đang còn nợ thì không ngừng theo dõi được.

---

## 6. Cấu trúc thư mục

```
bt_usecase/
├── docs/                       tài liệu phân tích (file này, use case, sơ đồ, wireframe)
└── web/
    ├── data/cuahang.db         CSDL SQLite (tự tạo khi chạy lần đầu, không đưa lên git)
    ├── next.config.ts
    └── src/
        ├── app/
        │   ├── layout.tsx              khung HTML, font
        │   ├── globals.css             lớp giao diện dùng chung (card, btn, tbl, tag…)
        │   ├── login/                  UC-01
        │   └── (app)/                  các màn hình sau khi đăng nhập
        │       ├── layout.tsx          kiểm tra đăng nhập + menu theo vai trò
        │       ├── page.tsx            trang chủ theo vai trò
        │       ├── ban-hang/           UC-06 → 09
        │       ├── tra-hang/           UC-10, 11
        │       ├── cong-no/            UC-12
        │       ├── nhap-hang/          UC-13
        │       ├── kiem-ke/            UC-14, 15
        │       ├── hang-hoa/           UC-02
        │       ├── khach-hang/         UC-03, 04 (khách hàng + nhà cung cấp)
        │       ├── tai-khoan/          UC-05
        │       ├── bao-cao/            UC-16 → 22 (6 tab)
        │       └── doi-mat-khau/
        ├── components/                 Flash, Tabs, Stat, Empty, SubmitButton
        └── lib/                        nghiệp vụ + truy cập dữ liệu (mục 2.3, 2.4)
```

---

## 7. Triển khai và vận hành

- **Chạy thử:** `npm install` rồi `npm run dev`, mở `http://localhost:3000`.
- **Chạy thật:** `npm run build` rồi `npm run start` trên máy ở cửa hàng. Các máy khác trong mạng nội bộ mở `http://<IP máy chủ>:3000`.
- **Sao lưu:** chép file `data/cuahang.db` (kèm `-wal` và `-shm` nếu có) sang ổ khác hoặc lưu trữ đám mây mỗi ngày. Nên tắt server trước khi chép, hoặc dùng lệnh `.backup` của SQLite.
- **Làm lại dữ liệu mẫu:** tắt server, xóa thư mục `data/`, chạy lại.
- **Mở xem CSDL:** dùng extension SQLite Viewer trong VS Code.

### Bản demo trên Render

Cấu hình nằm ở file `render.yaml` ở thư mục gốc repo (Render Blueprint). Repo GitHub được nối với Render, và mỗi lần `git push` lên `main`, Render tự build và triển khai lại.

| Mục | Giá trị |
|---|---|
| Loại dịch vụ | Web Service, Node, gói Free |
| Thư mục gốc | `web` |
| Build | `npm ci && npm run build` |
| Start | `npm run start` (Next.js tự nghe cổng ở biến `PORT` mà Render cấp) |
| Kiểm tra sống | `/login` |
| Node | `NODE_VERSION=24`, cần ≥ 22.13 để có `node:sqlite`. `package.json` cũng khai báo `engines.node` |

**Về dữ liệu:**
- Render chạy **một máy chủ liên tục**, nên CSDL `web/data/cuahang.db` dùng chung cho mọi người trong lúc máy chủ chạy, và phiên đăng nhập ổn định.
- Ổ đĩa gói Free là tạm thời. Khi máy chủ khởi động lại (mỗi lần deploy, hoặc khi "ngủ" sau 15 phút không ai dùng), CSDL được tạo lại kèm **dữ liệu mẫu**, mọi thay đổi trước đó mất.
- Lần mở đầu tiên sau khi máy chủ ngủ phải chờ khoảng 30–50 giây.
- **Phạm vi dùng:** bản này chỉ dùng để **xem thử và chấm bài**, không dùng cho cửa hàng thật.

**Vercel:** `db.ts` vẫn hỗ trợ chạy trên Vercel. Khi có biến `VERCEL`, CSDL đặt ở `/tmp/cuahang.db`. Tuy vậy, Vercel chạy theo kiểu serverless, có thể dùng nhiều máy chủ cùng lúc, mỗi máy một CSDL riêng, nên không hợp với SQLite bằng Render. Có thể ghi đè chỗ đặt CSDL bằng biến `DB_PATH`.

### Giới hạn và hướng mở rộng

| Giới hạn hiện tại | Khi cần mở rộng |
|---|---|
| SQLite chỉ một máy chủ ghi; đủ cho vài chục người dùng cùng lúc | Chuyển sang PostgreSQL: chỉ thay `lib/db.ts` và cú pháp SQL, tầng nghiệp vụ giữ nguyên |
| Bản demo trên Render mất dữ liệu khi máy chủ khởi động lại | Gắn ổ đĩa lâu dài (Render Persistent Disk, gói trả phí) rồi đặt `DB_PATH` vào ổ đó; hoặc dùng CSDL ngoài (Turso, Postgres). Driver ngoài là bất đồng bộ, nên phải đổi các hàm `lib/` sang `async` |
| Chưa có nút xuất Excel cho báo cáo (có trong wireframe) | Thêm route trả file CSV trong `bao-cao/` |
| Chưa in hóa đơn | Thêm trang in phiếu bán dùng CSS `@media print` |
| Giá vốn tạm theo FIFO | Chờ khách chốt, sửa `consumeFIFO` |
