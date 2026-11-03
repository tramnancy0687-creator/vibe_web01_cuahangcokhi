# Thiết kế cơ sở dữ liệu — Website quản lý cửa hàng Thành Phát

Mô tả chi tiết CSDL SQLite của dự án. Nguồn chuẩn là [`web/src/lib/schema.ts`](../web/src/lib/schema.ts). Khi hai bên khác nhau thì code đúng, và phải sửa tài liệu này.
Bối cảnh kiến trúc xem [kien-truc.md](kien-truc.md), mục 2.4 và 4.

---

## 1. Tổng quan

| Hạng mục | Giá trị |
|---|---|
| Hệ quản trị | SQLite 3 (driver `node:sqlite` có sẵn trong Node) |
| File dữ liệu | `web/data/cuahang.db` (+ `-wal`, `-shm` khi đang chạy) |
| Chế độ | `PRAGMA journal_mode = WAL`, `PRAGMA foreign_keys = ON` |
| Khởi tạo | Lần đầu kết nối: chạy `CREATE TABLE IF NOT EXISTS`, ghi cấu hình mặc định, nạp dữ liệu mẫu nếu bảng `users` trống |
| Số bảng | 17: 2 hệ thống (`users`, `sessions`), 1 cấu hình (`settings`), 4 danh mục, 10 nghiệp vụ (kho 5, bán hàng và công nợ 5) |

### 1.1 Quy ước chung

| Quy ước | Chi tiết |
|---|---|
| Khóa chính | `id INTEGER PRIMARY KEY` (tự tăng). Riêng `sessions` dùng `token`, `settings` dùng `key` |
| Tên | Bảng số nhiều, chữ thường, `snake_case`. Khóa ngoại đặt tên `<bảng số ít>_id` |
| Số lượng | Kiểu `REAL`, **luôn theo đơn vị gốc** của món, trừ các cột `qty` trên dòng chứng từ (lưu theo đơn vị người dùng chọn, có kèm `factor` và `base_qty`) |
| Tiền | `INTEGER`, đơn vị VND, đã làm tròn. Riêng `batches.unit_cost` là `REAL` vì là giá trên một đơn vị gốc (ví dụ 325 đ/con) |
| Thời gian | `TEXT` chuẩn ISO 8601 giờ UTC (`2026-11-02T02:15:00.000Z`). So sánh chuỗi là so sánh thời gian. Hiển thị đổi sang giờ Việt Nam |
| Cờ đúng/sai | `INTEGER` 0/1 (`active`, `allow_credit`) |
| Mã liệt kê | `TEXT` có ràng buộc `CHECK (... IN (...))` |
| Xóa | Chứng từ không bao giờ xóa. Danh mục chỉ đặt `active = 0`. Chỉ `sessions` bị xóa thật |

### 1.2 Mã chứng từ

Sinh bằng `nextCode(table, prefix)` trong `lib/db.ts`, theo dạng `<TIỀN TỐ>-<YYMMDD giờ VN>-<số thứ tự trong ngày, 3 chữ số>`.

| Tiền tố | Bảng | Ví dụ |
|---|---|---|
| `PB` | `sales` (phiếu bán) | `PB-261102-007` |
| `PN` | `imports` (phiếu nhập) | `PN-261102-001` |
| `TH` | `returns` (phiếu trả hàng) | `TH-261102-001` |
| `KK` | `stocktakes` (đợt kiểm kê) | `KK-261102-001` |

Mã lô (`batches.code`) lấy theo chứng từ sinh ra lô:
- Lô từ nhập hàng: `L-<YYMMDD>-<stt>-<dòng>`, ví dụ `L-261102-001-2` là dòng thứ 2 của phiếu `PN-261102-001`.
- Lô từ trả hàng: mã phiếu `TH-…`.
- Lô từ điều chỉnh kiểm kê: mã đợt `KK-…`.

---

## 2. Sơ đồ quan hệ (ERD)

```
                              ┌──────────────┐
                              │   settings   │  (độc lập)
                              └──────────────┘
┌──────────┐ 1   n ┌──────────┐
│  users   │──────<│ sessions │
└────┬─────┘       └──────────┘
     │ 1 (người lập chứng từ: sales, imports, returns, debt_entries, stocktakes)
     │
     │         ┌────────────┐ 1   n ┌──────────────┐
     │         │ customers  │──────<│ debt_entries │
     │         └─────┬──────┘       └──────────────┘
     │               │ 0..1
     │ n             │ n
     ├──────────<┌───┴────┐ 1   n ┌────────────┐ n   1 ┌───────────┐ 1   n ┌───────────────┐
     │           │ sales  │──────<│ sale_items │>──────│ products  │──────<│ product_units │
     │           └───┬────┘       └─────┬──────┘       └─────┬─────┘       └───────────────┘
     │               │ 1                │ 1                  │ 1
     │               │ n                │ n                  ├──────<┌──────────┐
     ├──────────<┌───┴─────┐ 1   n ┌────┴─────────┐          │       │ batches  │ (lô hàng)
     │           │ returns │──────<│ return_items │          │       └──────────┘
     │           └─────────┘       └──────────────┘          │
     │                                                       ├──────<┌──────────────┐ n   1 ┌─────────┐ n  1 ┌───────────┐
     ├───────────────────────────────────────────────────────┼──────>│ import_items │>──────│ imports │>─────│ suppliers │
     │                                                       │       └──────────────┘       └─────────┘      └───────────┘
     │           ┌────────────┐ 1   n ┌─────────────────┐    │
     └──────────<│ stocktakes │──────<│ stocktake_items │>───┘
                 └────────────┘       └─────────────────┘
```
Ký hiệu: `──────<` là quan hệ một-nhiều (đầu `<` là phía "nhiều").

### 2.1 Danh sách quan hệ

| Bảng con | Cột khóa ngoại | → Bảng cha | Bắt buộc | Ghi chú |
|---|---|---|---|---|
| sessions | user_id | users | ✔ | |
| product_units | product_id | products | ✔ | `ON DELETE CASCADE` |
| imports | supplier_id | suppliers | ✔ | |
| imports | user_id | users | ✔ | Người nhập |
| import_items | import_id | imports | ✔ | |
| import_items | product_id | products | ✔ | |
| batches | product_id | products | ✔ | |
| sales | customer_id | customers | — | `NULL` = khách lẻ |
| sales | user_id | users | ✔ | Nhân viên bán |
| sale_items | sale_id | sales | ✔ | |
| sale_items | product_id | products | ✔ | |
| returns | sale_id | sales | ✔ | Phiếu bán gốc |
| returns | user_id | users | ✔ | Người nhận hàng trả |
| return_items | return_id | returns | ✔ | |
| return_items | sale_item_id | sale_items | ✔ | Dòng bán được trả |
| debt_entries | customer_id | customers | ✔ | |
| debt_entries | user_id | users | ✔ | Người ghi |
| stocktakes | user_id | users | ✔ | Người mở đợt |
| stocktake_items | stocktake_id | stocktakes | ✔ | |
| stocktake_items | product_id | products | ✔ | |

---

## 3. Chi tiết các bảng

Ký hiệu cột "Ràng buộc": **PK** khóa chính · **FK** khóa ngoại · **NN** NOT NULL · **UQ** UNIQUE · **DF** giá trị mặc định · **CK** CHECK.

### 3.1 Hệ thống

#### `users` — Tài khoản nhân viên (UC-01, UC-05)

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | INTEGER | PK | |
| username | TEXT | NN, UQ | Tên đăng nhập, chữ thường, `[a-z0-9._]`, ≥ 3 ký tự |
| full_name | TEXT | NN | Họ tên hiển thị trên chứng từ, báo cáo |
| role | TEXT | NN, CK `CH`/`NV`/`TK` | Chủ cửa hàng / Nhân viên bán hàng / Thủ kho |
| password_hash | TEXT | NN | `salt:hash`, salt 16 byte hex, `scrypt` 64 byte hex |
| active | INTEGER | NN, DF 1 | 0 = đã khóa (nghỉ việc) |
| failed_logins | INTEGER | NN, DF 0 | Số lần nhập sai liên tiếp |
| locked_until | TEXT | | Khóa tạm đến thời điểm này; `NULL` = không khóa |

- Không xóa tài khoản, để chứng từ cũ vẫn giữ tên người lập.
- Khi số lần sai đạt `settings.login_max_failures`, hệ thống đặt `locked_until` = hiện tại + `login_lock_minutes` và đưa `failed_logins` về 0.

#### `sessions` — Phiên đăng nhập

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| token | TEXT | PK | Chuỗi ngẫu nhiên 32 byte hex, trùng với giá trị cookie `sid` |
| user_id | INTEGER | NN, FK users | |
| expires_at | TEXT | NN | Hết hạn sau `settings.session_hours` giờ |

Bảng duy nhất có xóa dòng thật: khi đăng xuất, khi khóa tài khoản, khi đặt lại mật khẩu (xóa mọi phiên của người đó).

#### `settings` — Cấu hình nghiệp vụ

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| key | TEXT | PK | Tên cấu hình |
| value | TEXT | NN | Giá trị, đọc ra bằng `setting(key)` dạng số |

| key | Mặc định | Dùng ở |
|---|---|---|
| `slow_moving_months` | 12 | Báo cáo tồn lâu (UC-19) |
| `overdue_debt_days` | 30 | Nợ quá hạn: trang chủ, công nợ (UC-17) |
| `login_max_failures` | 5 | Khóa tài khoản (UC-01) |
| `login_lock_minutes` | 15 | Thời gian khóa (UC-01) |
| `session_hours` | 12 | Thời hạn phiên |

Giá trị mặc định được ghi bằng `INSERT OR IGNORE`, nên giá trị chủ cửa hàng đã chỉnh không bị ghi đè khi khởi động lại.

### 3.2 Danh mục

#### `products` — Hàng hóa (UC-02)

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | INTEGER | PK | |
| code | TEXT | NN, UQ | Mã hàng, ví dụ `OV-M8-30` |
| name | TEXT | NN | Tên hàng |
| category | TEXT | NN, DF `''` | Nhóm hàng, dùng lọc khi kiểm kê |
| base_unit | TEXT | NN | Đơn vị gốc (nhỏ nhất), mọi số tồn kho tính theo đơn vị này |
| min_stock | REAL | NN, DF 0 | Tồn tối thiểu (đơn vị gốc); dưới mức này thì báo "sắp hết" |
| active | INTEGER | NN, DF 1 | 0 = ngừng kinh doanh |

- **Không có cột tồn kho.** Tồn kho = `SUM(batches.qty_left)` của món (mục 4.1).
- Không đổi được `base_unit` khi món đã có lô hàng.

#### `product_units` — Đơn vị bán và quy đổi (UC-02, UC-09)

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | INTEGER | PK | |
| product_id | INTEGER | NN, FK products (CASCADE) | |
| unit | TEXT | NN | Tên đơn vị: con, hộp, kg, cuộn… |
| factor | REAL | NN, CK > 0 | 1 `unit` = `factor` đơn vị gốc |
| price | INTEGER | NN, DF 0 | Giá bán cho 1 `unit` (VND) |

- Ràng buộc `UNIQUE (product_id, unit)`.
- Luôn có đúng một dòng `unit = base_unit` với `factor = 1`. Hàm `saveProduct` tự thêm hoặc chỉnh dòng này.
- Khi sửa món, các đơn vị cũ bị xóa và ghi lại toàn bộ. Việc này an toàn vì dòng chứng từ đã lưu sẵn `unit`, `factor`, `unit_price` của chính nó.

Ví dụ: Ốc vít M8 x 30, đơn vị gốc `con`.

| unit | factor | price |
|---|---|---|
| con | 1 | 500 |
| hộp | 100 | 48 000 |
| kg | 160 | 70 000 |

#### `customers` — Khách hàng (UC-03)

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | INTEGER | PK | |
| name | TEXT | NN | |
| phone | TEXT | NN, DF `''` | |
| kind | TEXT | NN, CK `CONTRACTOR`/`REGULAR` | Nhà thầu / Khách quen |
| allow_credit | INTEGER | NN, DF 0 | 1 = được mua chịu (ghi nợ) |
| active | INTEGER | NN, DF 1 | 0 = ngừng giao dịch. Không đặt được về 0 khi khách còn nợ |

Khách lẻ vãng lai **không lưu**. Trên phiếu bán, khách lẻ là `sales.customer_id = NULL`.

#### `suppliers` — Nhà cung cấp (UC-04)

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | INTEGER | PK | |
| name | TEXT | NN | |
| contact | TEXT | NN, DF `''` | Người liên hệ |
| phone | TEXT | NN, DF `''` | |
| note | TEXT | NN, DF `''` | Mặt hàng chính, ghi chú |
| active | INTEGER | NN, DF 1 | |

### 3.3 Kho

#### `imports` — Phiếu nhập (UC-13)

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | INTEGER | PK | |
| code | TEXT | NN, UQ | `PN-YYMMDD-nnn` |
| supplier_id | INTEGER | NN, FK suppliers | |
| invoice_no | TEXT | NN, DF `''` | Số hóa đơn của nhà cung cấp |
| user_id | INTEGER | NN, FK users | Người nhập |
| total | INTEGER | NN | Tổng tiền = Σ `import_items.amount` |
| created_at | TEXT | NN | |

#### `import_items` — Dòng phiếu nhập

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | INTEGER | PK | |
| import_id | INTEGER | NN, FK imports | |
| product_id | INTEGER | NN, FK products | |
| unit | TEXT | NN | Đơn vị nhập (chụp lại lúc nhập) |
| factor | REAL | NN | Hệ số quy đổi lúc nhập |
| qty | REAL | NN | Số lượng theo `unit` |
| base_qty | REAL | NN | = `qty × factor` |
| unit_price | INTEGER | NN | Giá nhập cho 1 `unit` |
| amount | INTEGER | NN | = round(`qty × unit_price`) |

Mỗi dòng sinh **một lô** trong `batches` với `unit_cost = unit_price / factor`.

#### `batches` — Lô hàng (nền của tồn kho và giá vốn)

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | INTEGER | PK | |
| product_id | INTEGER | NN, FK products | |
| code | TEXT | NN | Mã lô, theo chứng từ sinh ra lô (mục 1.2) |
| source | TEXT | NN, CK `IMPORT`/`RETURN`/`ADJUST` | Nguồn: nhập hàng / khách trả / điều chỉnh kiểm kê |
| unit_cost | REAL | NN | Giá vốn trên 1 đơn vị gốc |
| qty_in | REAL | NN | Số lượng ban đầu của lô (đơn vị gốc) |
| qty_left | REAL | NN | Số lượng còn lại; giảm dần khi bán |
| created_at | TEXT | NN | Thời điểm vào kho, quyết định thứ tự FIFO |

- Chỉ mục: `idx_batches_fifo (product_id, qty_left, created_at)`, phục vụ tìm lô còn hàng theo thứ tự cũ trước.
- Nguồn `RETURN`: `unit_cost` = giá vốn đã ghi trên dòng bán gốc, chia theo số lượng.
- Nguồn `ADJUST`: `unit_cost` = giá vốn của lô gần nhất của món.

#### `stocktakes` — Đợt kiểm kê (UC-14)

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | INTEGER | PK | |
| code | TEXT | NN, UQ | `KK-YYMMDD-nnn` |
| user_id | INTEGER | NN, FK users | Người mở đợt |
| status | TEXT | NN, CK `DRAFT`/`DONE` | Đang đếm / Đã hoàn tất |
| created_at | TEXT | NN | |
| finished_at | TEXT | | Thời điểm hoàn tất |

Tại một thời điểm chỉ có tối đa một đợt `DRAFT`. Quy tắc này do `openStocktake` đảm bảo: nếu đã có đợt đang mở thì trả về đợt đó.

#### `stocktake_items` — Dòng kiểm kê (UC-14, UC-15, UC-21)

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | INTEGER | PK | |
| stocktake_id | INTEGER | NN, FK stocktakes | |
| product_id | INTEGER | NN, FK products | |
| book_qty | REAL | NN | Số sổ sách. Ghi lúc mở đợt, **ghi lại lúc hoàn tất** |
| actual_qty | REAL | | Số đếm thực tế; `NULL` = chưa đếm |
| reason | TEXT | NN, DF `''` | Lý do lệch, bắt buộc khi `actual_qty ≠ book_qty` lúc hoàn tất |
| status | TEXT | NN, DF `PENDING`, CK `PENDING`/`APPROVED`/`REJECTED` | Trạng thái chủ duyệt |

- Ràng buộc `UNIQUE (stocktake_id, product_id)`.
- Dòng **lệch** là dòng có `actual_qty IS NOT NULL AND ABS(actual_qty − book_qty) > 1e-9` thuộc đợt `DONE`.

### 3.4 Bán hàng và công nợ

#### `sales` — Phiếu bán (UC-07, UC-08)

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | INTEGER | PK | |
| code | TEXT | NN, UQ | `PB-YYMMDD-nnn` |
| customer_id | INTEGER | FK customers | `NULL` = khách lẻ |
| user_id | INTEGER | NN, FK users | Nhân viên bán (lấy từ phiên đăng nhập) |
| payment | TEXT | NN, CK `CASH`/`CREDIT` | Trả ngay / Ghi nợ |
| total | INTEGER | NN | Tổng tiền = Σ `sale_items.amount` |
| cost_total | INTEGER | NN | Tổng giá vốn = Σ `sale_items.cost` |
| created_at | TEXT | NN | |

`payment = CREDIT` chỉ được khi `customer_id` khác `NULL` và khách có `allow_credit = 1`. Điều kiện này kiểm tra ở `createSale`.

#### `sale_items` — Dòng phiếu bán (UC-07, UC-09)

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | INTEGER | PK | |
| sale_id | INTEGER | NN, FK sales | |
| product_id | INTEGER | NN, FK products | |
| unit | TEXT | NN | Đơn vị bán (chụp lại lúc bán) |
| factor | REAL | NN | Hệ số quy đổi lúc bán |
| qty | REAL | NN | Số lượng theo `unit` |
| base_qty | REAL | NN | = `qty × factor` |
| unit_price | INTEGER | NN | Giá bán 1 `unit`, lấy từ `product_units` lúc bán |
| amount | INTEGER | NN | = round(`qty × unit_price`) |
| cost | INTEGER | NN | Giá vốn của dòng, tính theo FIFO lúc bán |
| returned_base_qty | REAL | NN, DF 0 | Tổng số đã trả lại (đơn vị gốc) |

Bất biến: `0 ≤ returned_base_qty ≤ base_qty`.

#### `returns` — Phiếu trả hàng (UC-10, UC-11)

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | INTEGER | PK | |
| code | TEXT | NN, UQ | `TH-YYMMDD-nnn` |
| sale_id | INTEGER | NN, FK sales | Phiếu bán gốc |
| user_id | INTEGER | NN, FK users | Người nhận hàng trả |
| reason | TEXT | NN, DF `''` | Lý do trả |
| refund | TEXT | NN, CK `DEBT`/`CASH` | `DEBT` = có trừ vào công nợ, toàn bộ hoặc một phần; `CASH` = hoàn tiền mặt toàn bộ |
| total | INTEGER | NN | Giá trị hàng trả (theo giá đã bán) |
| cost_total | INTEGER | NN | Giá vốn của hàng trả |
| created_at | TEXT | NN | |

Số tiền trừ nợ là `MIN(total, số nợ lúc trả)`. Phần còn lại hoàn tiền mặt và không lưu thành cột riêng: tính được bằng `total + debt_entries.amount` của dòng `RETURN` tương ứng (dòng này mang số âm).

#### `return_items` — Dòng phiếu trả

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | INTEGER | PK | |
| return_id | INTEGER | NN, FK returns | |
| sale_item_id | INTEGER | NN, FK sale_items | Dòng bán được trả |
| base_qty | REAL | NN | Số lượng trả (đơn vị gốc) |
| amount | INTEGER | NN | = round(số trả theo đơn vị bán × `unit_price`) |
| cost | INTEGER | NN | = round(`sale_items.cost × base_qty / sale_items.base_qty`) |

#### `debt_entries` — Sổ cái công nợ (UC-08, UC-11, UC-12, UC-17)

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | INTEGER | PK | |
| customer_id | INTEGER | NN, FK customers | |
| kind | TEXT | NN, CK `SALE`/`RETURN`/`PAYMENT` | Mua chịu / Trả hàng / Thu tiền |
| ref | TEXT | NN, DF `''` | Mã chứng từ (`PB-…`, `TH-…`), hoặc `Thu tiền` |
| amount | INTEGER | NN | **> 0 tăng nợ** (SALE); **< 0 giảm nợ** (RETURN, PAYMENT) |
| method | TEXT | NN, DF `''` | Hình thức thu: Tiền mặt / Chuyển khoản (chỉ với PAYMENT) |
| note | TEXT | NN, DF `''` | Ghi chú |
| user_id | INTEGER | NN, FK users | Người ghi |
| created_at | TEXT | NN | |

- Số nợ hiện tại của khách = `SUM(amount)`. Bất biến: số nợ luôn ≥ 0, vì tiền thu không vượt số nợ và trả hàng chỉ trừ tối đa bằng số nợ.
- "Nợ từ ngày": trừ tổng các dòng âm lần lượt vào các dòng dương, từ dòng cũ nhất. Dòng dương đầu tiên chưa bị trừ hết là ngày bắt đầu nợ (`debtSince`).

---

## 4. Dữ liệu dẫn xuất (tính ra, không lưu)

| Thông tin | Cách tính |
|---|---|
| Tồn kho của món | `SELECT COALESCE(SUM(qty_left), 0) FROM batches WHERE product_id = ?` |
| Giá trị tồn kho | `SUM(qty_left × unit_cost)` |
| Số còn trả được của dòng bán (theo đơn vị bán) | `(base_qty − returned_base_qty) / factor` |
| Số nợ của khách | `SUM(debt_entries.amount)` |
| Sổ nợ có số dư | Duyệt `debt_entries` theo `created_at, id`, cộng dồn `amount` |
| Doanh thu thuần tháng | `SUM(sales.total)` − `SUM(returns.total)` trong tháng |
| Giá vốn tháng | `SUM(sales.cost_total)` − `SUM(returns.cost_total)` trong tháng |
| Lãi gộp | Doanh thu thuần − giá vốn |
| Hàng sắp hết | Món `active = 1` có tồn kho < `min_stock` |
| Hàng tồn lâu | Lô còn hàng cũ nhất có tuổi > `slow_moving_months` tháng, **và** không có lần bán nào trong khoảng đó |

Không lưu số tồn hay số nợ vào một cột riêng là cố ý: số liệu luôn khớp với lịch sử chứng từ, và không có chuyện "cột tồn bị lệch".

---

## 5. Các thao tác ghi theo use case

Mỗi thao tác chạy trong **một giao dịch** (`tx`): hoặc ghi đủ tất cả, hoặc không ghi gì.

| Use case | Hàm | Bảng bị ghi |
|---|---|---|
| UC-01 Đăng nhập | `login` | `users` (đếm sai, khóa), `sessions` (+1) |
| UC-02 Lưu hàng hóa | `saveProduct` | `products`, `product_units` (xóa rồi ghi lại) |
| UC-03, 04 Khách, NCC | `saveCustomer`, `saveSupplier`, `setCustomerActive` | `customers`, `suppliers` |
| UC-05 Tài khoản | `createUser`, `updateUser`, `setUserActive`, `resetPassword` | `users`; xóa `sessions` khi khóa hoặc đặt lại mật khẩu |
| UC-07 (+08, 09) Bán hàng | `createSale` | `sales` +1, `sale_items` +n, `batches.qty_left` giảm (FIFO), `debt_entries` +1 `SALE` nếu ghi nợ |
| UC-10 (+11) Trả hàng | `createReturn` | `returns` +1, `return_items` +n, `sale_items.returned_base_qty` tăng, `batches` +n (`RETURN`), `debt_entries` +1 `RETURN` (âm) nếu khách đang nợ |
| UC-12 Thu nợ | `recordPayment` | `debt_entries` +1 `PAYMENT` (âm) |
| UC-13 Nhập hàng | `createImport` | `imports` +1, `import_items` +n, `batches` +n (`IMPORT`) |
| UC-14 Mở kiểm kê | `openStocktake` | `stocktakes` +1 (`DRAFT`), `stocktake_items` +1 cho mỗi món đang bán |
| UC-14 Lưu, hoàn tất | `saveStocktake` | Giao dịch 1: `stocktake_items.actual_qty`, `reason`. Giao dịch 2 (khi hoàn tất): ghi lại `book_qty`, `stocktakes.status = DONE` |
| UC-15, 21 Duyệt lệch | `reviewDiff` | `stocktake_items.status`. Nếu duyệt: thừa thì `batches` +1 (`ADJUST`); thiếu thì `batches.qty_left` giảm (FIFO) |

### 5.1 Giá vốn FIFO (`consumeFIFO`)

```sql
SELECT id, qty_left, unit_cost FROM batches
WHERE product_id = ? AND qty_left > 0
ORDER BY created_at, id;          -- lô vào kho trước, xuất trước
```

Lấy dần từ từng lô (`UPDATE batches SET qty_left = qty_left - ?`) cho đến khi đủ số cần xuất. Giá vốn = Σ (số lấy × `unit_cost`). Nếu các lô không đủ hàng thì báo lỗi "Không đủ hàng", và cả giao dịch được hoàn tác.

**Ví dụ**: còn 2 lô Ốc M8×30, gồm lô A 100 con giá 300 đ/con và lô B 500 con giá 325 đ/con. Bán 1 hộp (100 con) + 40 con = 140 con:
- lấy 100 con từ lô A: 100 × 300 = 30 000;
- lấy 40 con từ lô B: 40 × 325 = 13 000;
- giá vốn dòng bán = **43 000 đ**. Lô A còn 0, lô B còn 460.

---

## 6. Ràng buộc toàn vẹn

| # | Bất biến | Được đảm bảo bởi |
|---|---|---|
| 1 | Tồn kho của mọi món ≥ 0 | `consumeFIFO` từ chối khi không đủ; `qty_left` không bao giờ âm |
| 2 | Mỗi món có đúng một đơn vị gốc, hệ số 1 | `saveProduct` |
| 3 | `factor > 0`, giá ≥ 0 | `CHECK` + `saveProduct` |
| 4 | Số trả ≤ số đã bán của từng dòng | `createReturn` kiểm tra `returned_base_qty` |
| 5 | Số nợ của khách ≥ 0 | `recordPayment` (thu ≤ nợ), `createReturn` (trừ ≤ nợ) |
| 6 | Chỉ khách `allow_credit = 1` mới có dòng `SALE` | `createSale` |
| 7 | Không ngừng giao dịch khách còn nợ | `setCustomerActive` |
| 8 | Không đổi đơn vị gốc khi đã có lô | `saveProduct` |
| 9 | Tối đa một đợt kiểm kê `DRAFT` | `openStocktake` |
| 10 | Dòng lệch phải có lý do khi hoàn tất | `saveStocktake` |
| 11 | Giá bán trên phiếu = giá danh mục lúc bán | `createSale` đọc `product_units`, không nhận giá từ trình duyệt |
| 12 | Mã chứng từ duy nhất | `UNIQUE` trên `code` + `nextCode` chạy trong giao dịch `BEGIN IMMEDIATE` |

Các bất biến 1, 4, 5 không viết được bằng `CHECK` của SQLite vì cần dữ liệu nhiều dòng, nên được đảm bảo ở tầng nghiệp vụ (`lib/`). Mọi thao tác ghi đều phải đi qua các hàm này, không ghi thẳng vào CSDL.

---

## 7. Sao lưu, xem và làm lại dữ liệu

- **Xem dữ liệu**: mở `web/data/cuahang.db` bằng extension SQLite Viewer trong VS Code, hoặc dùng DB Browser for SQLite.
- **Sao lưu**: tắt server rồi chép `cuahang.db` (kèm `cuahang.db-wal` và `cuahang.db-shm` nếu có). Khi server đang chạy, dùng `sqlite3 cuahang.db ".backup backup.db"`.
- **Làm lại từ đầu**: tắt server, xóa thư mục `web/data/`, chạy lại. Lần chạy đầu tự tạo bảng và dữ liệu mẫu.
- **Thay đổi cấu trúc**: hiện dùng `CREATE TABLE IF NOT EXISTS`, nên **thêm bảng** thì tự áp dụng, nhưng **thêm hoặc sửa cột** của bảng đã có thì không. Khi cần sửa cột trên dữ liệu thật, phải viết lệnh `ALTER TABLE` riêng, hoặc xóa `data/` nếu chỉ là dữ liệu mẫu. Sau đó cập nhật tài liệu này và mục 4 của [kien-truc.md](kien-truc.md).
