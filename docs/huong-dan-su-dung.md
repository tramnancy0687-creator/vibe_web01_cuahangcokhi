# Hướng dẫn sử dụng — Phần mềm quản lý cửa hàng Thành Phát

Dành cho: **chủ cửa hàng**, **nhân viên bán hàng**, **thủ kho**.

## Mục lục

1. [Đăng nhập và đổi mật khẩu](#1-đăng-nhập-và-đổi-mật-khẩu)
2. [Ai được dùng màn hình nào](#2-ai-được-dùng-màn-hình-nào)
3. [Trang chủ](#3-trang-chủ)
4. [Bán hàng](#4-bán-hàng) — nhân viên bán hàng, chủ
5. [Nhận hàng trả lại](#5-nhận-hàng-trả-lại) — nhân viên bán hàng, chủ
6. [Công nợ và thu nợ](#6-công-nợ-và-thu-nợ) — nhân viên bán hàng, chủ
7. [Nhập hàng](#7-nhập-hàng) — thủ kho, chủ
8. [Kiểm kê kho](#8-kiểm-kê-kho) — thủ kho, chủ
9. [Hàng hóa và đơn vị tính](#9-hàng-hóa-và-đơn-vị-tính) — chủ
10. [Khách hàng và nhà cung cấp](#10-khách-hàng-và-nhà-cung-cấp) — chủ
11. [Tài khoản nhân viên](#11-tài-khoản-nhân-viên) — chủ
12. [Báo cáo](#12-báo-cáo) — chủ
13. [Câu hỏi thường gặp](#13-câu-hỏi-thường-gặp)

---

## 1. Đăng nhập và đổi mật khẩu

**Đăng nhập**
1. Mở trình duyệt (Chrome, Edge…) và vào địa chỉ phần mềm mà chủ cửa hàng đưa.
2. Gõ **tên đăng nhập** và **mật khẩu** do chủ cấp, rồi bấm **Đăng nhập**.

> Nếu nhập sai mật khẩu **5 lần liên tiếp**, tài khoản bị **tạm khóa 15 phút**. Chờ hết thời gian rồi thử lại, hoặc nhờ chủ cửa hàng đặt lại mật khẩu.

**Đổi mật khẩu**: bấm **Đổi mật khẩu** ở góc trên bên phải, nhập mật khẩu hiện tại, nhập mật khẩu mới hai lần (ít nhất 6 ký tự), rồi bấm **Đổi mật khẩu**.

**Đăng xuất**: bấm **Đăng xuất** ở góc trên bên phải. Nếu dùng chung máy ở quầy, hãy đăng xuất khi hết ca, để phiếu của người sau không bị ghi tên bạn.

---

## 2. Ai được dùng màn hình nào

| Màn hình | Chủ cửa hàng | Nhân viên bán hàng | Thủ kho |
|---|:-:|:-:|:-:|
| Trang chủ | ✔ | ✔ | ✔ |
| Bán hàng | ✔ | ✔ | — |
| Nhận hàng trả lại | ✔ | ✔ | — |
| Công nợ & thu nợ | ✔ | ✔ | — |
| Nhập hàng | ✔ | — | ✔ |
| Kiểm kê kho | ✔ | — | ✔ |
| Hàng hóa & đơn vị | ✔ | — | — |
| Khách hàng & NCC | ✔ | — | — |
| Tài khoản nhân viên | ✔ | — | — |
| Báo cáo | ✔ | — | — |

Menu bên trái chỉ hiện những màn hình bạn được dùng. Nếu thấy dòng *"Tài khoản của bạn không có quyền vào màn hình vừa chọn"*, nghĩa là màn hình đó không thuộc phần việc của bạn.

---

## 3. Trang chủ

Mỗi người thấy những thông tin cần cho phần việc của mình:

| Bạn là | Trang chủ hiển thị |
|---|---|
| Chủ cửa hàng | Doanh thu hôm nay, tổng công nợ phải thu, số món sắp hết, số dòng kiểm kê lệch đang chờ duyệt, danh sách khách **nợ quá 30 ngày**, phiếu bán gần đây |
| Nhân viên bán hàng | Số phiếu và doanh số **của bạn** hôm nay, hàng sắp hết, phiếu bán gần đây của bạn |
| Thủ kho | Hàng sắp hết, đợt kiểm kê đang mở, phiếu nhập gần đây |

Các nút nhanh ở góc phải: **+ Lập phiếu bán**, **+ Phiếu nhập**, **Kiểm kê**.

---

## 4. Bán hàng

Màn hình chia hai nửa: bên trái là **Tra cứu hàng hóa**, bên phải là **Phiếu bán mới**.

### 4.1 Lập phiếu bán

1. **Tìm món**: gõ tên hoặc mã vào ô tìm kiếm. Không cần gõ dấu, ví dụ gõ `oc vit m8` vẫn ra *Ốc vít M8 x 30*. Bảng hiện tồn kho và giá bán theo từng đơn vị.
2. Bấm **Thêm** để đưa món vào phiếu. Bấm thêm lần nữa thì số lượng tăng thêm 1.
3. Ở phiếu bên phải, sửa **SL** (số lượng) và chọn **Đơn vị** khách mua. Ví dụ ốc vít bán được theo *con*, *hộp* (100 con) hoặc *kg* (160 con).
   - Dòng chữ nhỏ dưới tên món cho biết số lượng đã quy đổi, ví dụ *"= 320 con"*.
   - Nếu dòng chữ chuyển **màu đỏ** *"Không đủ hàng, còn … "* thì giảm số lượng xuống.
4. Chọn **Khách hàng**:
   - **Khách lẻ** (mặc định): khách vãng lai, trả tiền ngay.
   - Hoặc chọn tên nhà thầu hay khách quen trong danh sách. Nếu khách đang nợ, danh sách hiện luôn số nợ để bạn biết.
5. Chọn **Thanh toán**:
   - **Trả ngay**: khách trả đủ tiền mặt hoặc chuyển khoản.
   - **Ghi nợ**: chỉ bấm được khi khách đã được chủ cho phép **mua chịu**. Số tiền phiếu sẽ cộng vào công nợ của khách.
6. Kiểm tra **Tổng tiền**, rồi bấm **Lưu phiếu bán**.
7. Phần mềm báo *"Đã lưu phiếu PB-…"* và tạo phiếu trống cho khách tiếp theo. Tồn kho được trừ ngay.

**Lưu ý**
- Giá bán lấy theo bảng giá chủ đã cài, nhân viên không sửa được.
- Món đã **hết hàng** vẫn hiện trong bảng tra cứu (để báo khách), nhưng không có nút Thêm.
- Bấm **Làm lại** để xóa phiếu đang lập và bắt đầu lại. Bấm **✕** để bỏ một dòng.
- **Số phiếu** có dạng `PB-261102-007`, nghĩa là phiếu bán thứ 7 của ngày 02/11/2026. Hãy ghi số phiếu lên hóa đơn giấy, vì khi khách mang hàng trả lại sẽ cần số này.

### 4.2 Xem phiếu đã bán

Bên dưới màn hình có bảng **Phiếu bán gần đây**. Nhân viên thấy phiếu của mình, chủ thấy phiếu của tất cả mọi người.

Phiếu đã lưu **không sửa, không xóa được**. Nếu bán nhầm, hãy làm thủ tục **nhận hàng trả lại** (mục 5) cho phần bị nhầm rồi lập phiếu mới.

---

## 5. Nhận hàng trả lại

Dùng khi khách mang hàng **còn nguyên** đến trả, ví dụ công trình dùng dư.

1. Gõ **số phiếu bán** (in trên hóa đơn, ví dụ `PB-261030-002`) rồi bấm **Tìm phiếu**.
2. Phần mềm hiện các món trên phiếu đó. Cột **Còn trả được** là số lượng chưa trả lần nào.
3. Với từng món khách trả:
   - nhập **SL trả** (không vượt quá số còn trả được);
   - tick **Còn nguyên**. Hàng hư, đã cắt, đã dùng thì **không nhận**.
4. Ghi **Lý do trả** (ví dụ *"công trình dư"*).
5. Đọc dòng hướng dẫn trước khi bấm, để biết sẽ hoàn tiền theo cách nào:
   - **Khách đang nợ**: giá trị hàng trả được **trừ vào công nợ**. Nếu giá trị hàng trả lớn hơn số nợ, phần dư hoàn **tiền mặt**.
   - **Khách không nợ hoặc khách lẻ**: hoàn **tiền mặt** theo giá trị hàng trả.
6. Bấm **Xác nhận nhận hàng**. Hàng trả được **cộng lại tồn kho ngay**. Phiếu trả có số dạng `TH-…`.

Bảng **Phiếu trả gần đây** cho biết mỗi lần trả đã hoàn lại bằng cách nào (trừ công nợ hay tiền mặt).

---

## 6. Công nợ và thu nợ

### 6.1 Xem ai đang nợ

Bảng bên trái liệt kê **khách đang nợ**, gồm số còn nợ và ngày bắt đầu nợ:
- Nhãn **vàng**: số ngày nợ, chưa quá hạn.
- Nhãn **đỏ**: nợ **quá 30 ngày**, cần nhắc khách.

"Nợ từ" là ngày của khoản mua chịu **cũ nhất chưa trả hết**. Tiền khách trả luôn được trừ vào khoản cũ nhất trước.

### 6.2 Xem sổ nợ của một khách

Bấm vào tên khách. Bên phải hiện **sổ nợ** theo thứ tự thời gian:
- **Mua chịu** (+): phiếu bán ghi nợ.
- **Trả hàng** (−): hàng trả lại được trừ nợ.
- **Thu tiền** (−): các lần khách thanh toán.
- Cột **Còn nợ** là số dư sau mỗi dòng.

### 6.3 Ghi nhận khách trả tiền

1. Chọn khách, rồi kéo xuống phần dưới sổ nợ.
2. Nhập **Số tiền thu**. Khách được trả một phần; số tiền tối đa là số đang nợ.
3. Chọn **Hình thức**: *Tiền mặt* hoặc *Chuyển khoản*.
4. Ghi chú nếu cần (ví dụ *"thanh toán đợt tháng 10"*), rồi bấm **Ghi nhận thanh toán**.

Khi khách trả hết, màn hình báo *"Khách đã trả hết nợ"* và khách không còn trong danh sách đang nợ.

---

## 7. Nhập hàng

Dùng khi hàng từ nhà cung cấp về cửa hàng.

1. Chọn **Nhà cung cấp** và ghi **Số hóa đơn NCC** (số trên hóa đơn của họ, để đối chiếu sau này).
2. Ở dòng cuối bảng, chọn món trong ô **"+ Chọn món để thêm…"** rồi bấm **Thêm dòng**. Làm lại cho từng món.
3. Với mỗi dòng:
   - **SL nhập** và **Đơn vị nhập**. Phần mềm gợi ý đơn vị lớn nhất (cuộn, hộp, kg…). Cột **= đơn vị gốc** cho biết tồn kho sẽ tăng bao nhiêu, ví dụ 3 cuộn = 300 m.
   - **Giá nhập / đơn vị** theo hóa đơn, ví dụ 720.000 đ/cuộn.
4. Kiểm tra **Tổng tiền nhập** khớp với hóa đơn, rồi bấm **Lưu & cộng tồn kho**.

Phiếu nhập có số dạng `PN-…`. Mỗi dòng nhập là **một lô hàng** với giá nhập riêng. Khi bán, phần mềm tính giá vốn theo lô **nhập trước, bán trước**, nên nhập đúng giá thì báo cáo lãi lỗ mới đúng.

> Chỉ chọn được món và nhà cung cấp đã có trong danh mục. Nếu chưa có, nhờ chủ cửa hàng thêm vào (mục 9, 10).

---

## 8. Kiểm kê kho

Dùng để đếm hàng thực tế và so với số trên phần mềm.

### 8.1 Thủ kho: đếm hàng

1. Vào **Kiểm kê kho** và bấm **Bắt đầu đợt kiểm kê**. Phần mềm tạo đợt `KK-…`, liệt kê mọi món kèm số **Sổ sách** (số phần mềm đang ghi).
2. Có thể **lọc theo nhóm hàng** (ví dụ *Ốc vít, bu lông*) để đếm từng khu.
3. Nhập số đếm được vào cột **Thực tế**. Đếm theo **đơn vị gốc** ghi ở cột Đơn vị (con, m, kg, bao…).
4. Bấm **Lưu tạm** bất cứ lúc nào. Số đã nhập được giữ lại, và cột **Lệch** hiện chênh lệch:
   - **+** (vàng): thực tế nhiều hơn sổ sách.
   - **−** (đỏ): thực tế ít hơn sổ sách.
5. Dòng nào lệch thì **bắt buộc ghi Lý do** (ví dụ *"rơi vãi khi chia lẻ"*, *"nhập thiếu"*).
6. Đếm xong thì bấm **Hoàn tất & báo chủ**.

**Lưu ý**
- Đợt kiểm kê có thể kéo dài nhiều ngày; cửa hàng vẫn bán bình thường. Khi bấm **Hoàn tất**, số sổ sách được lấy lại đúng tại thời điểm đó rồi mới so sánh.
- Kiểm kê **chưa làm thay đổi tồn kho**. Tồn kho chỉ thay đổi khi chủ duyệt (mục 8.2).

### 8.2 Chủ cửa hàng: duyệt chênh lệch

Vào **Báo cáo › Chênh lệch kiểm kê**. Với từng dòng lệch, đọc lý do rồi chọn:
- **Duyệt điều chỉnh**: tồn kho được sửa theo số thực tế.
- **Bỏ qua**: giữ nguyên tồn kho, ví dụ khi nghi đếm nhầm và sẽ đếm lại.

---

## 9. Hàng hóa và đơn vị tính

*(Chỉ chủ cửa hàng)*

### 9.1 Tìm và xem món hàng

Gõ mã hoặc tên rồi bấm **Tìm**. Cột **Trạng thái**:
- **Đang bán**.
- **Sắp hết**: tồn kho dưới mức tối thiểu.
- **Ngừng KD**: ngừng kinh doanh.

### 9.2 Thêm hoặc sửa món hàng

Bấm **+ Thêm hàng**, hoặc bấm vào tên món để sửa, rồi điền:

| Ô | Ý nghĩa | Ví dụ |
|---|---|---|
| Mã hàng | Mã ngắn, không trùng | `OV-M8-30` |
| Nhóm hàng | Để lọc khi kiểm kê | `Ốc vít, bu lông` |
| Tên hàng | Tên hiện khi bán | `Ốc vít M8 x 30` |
| Đơn vị gốc | Đơn vị **nhỏ nhất** dùng để đếm tồn kho | `con` |
| Tồn tối thiểu | Dưới mức này thì báo "sắp hết", tính theo đơn vị gốc | `800` |

**Bảng đơn vị bán và quy đổi**: mỗi dòng là một cách bán, kèm giá.

| Đơn vị | = số đơn vị gốc | Giá bán |
|---|---|---|
| con | 1 | 500 |
| hộp | 100 | 48.000 |
| kg | 160 | 70.000 |

- Đơn vị gốc luôn có hệ số **1**.
- Muốn thêm đơn vị thì điền vào dòng trống. Muốn xóa một đơn vị thì xóa trống ô tên đơn vị.
- Khi món đã có tồn kho thì **không đổi được đơn vị gốc**, để tránh sai số lượng.

Bấm **Lưu**.

### 9.3 Ngừng kinh doanh

Mở món và bấm **Ngừng kinh doanh**. Món bị ẩn khỏi màn hình bán và nhập, nhưng lịch sử vẫn được giữ. Bấm **Bán lại** để mở lại.

---

## 10. Khách hàng và nhà cung cấp

*(Chỉ chủ cửa hàng)*

### 10.1 Khách hàng (tab *Khách hàng*)

- **Khách lẻ vãng lai không cần tạo.** Chỉ lưu nhà thầu và khách quen.
- **Thêm khách**: điền tên, điện thoại, chọn **Loại** (*Nhà thầu* hoặc *Khách quen*), tick **"Cho mua chịu, thanh toán cuối tháng"** nếu cho phép ghi nợ, rồi bấm **Thêm khách**.
- **Sửa**: bấm **Sửa** ở dòng khách, chỉnh rồi bấm **Lưu thay đổi**.
- **Ngừng giao dịch**: bấm **Ngừng**. Khách **còn nợ** thì không ngừng được; khi đó hãy bỏ tick *Mua chịu* để không cho nợ thêm.

### 10.2 Nhà cung cấp (tab *Nhà cung cấp*)

Điền tên, người liên hệ, điện thoại, mặt hàng chính, rồi bấm **Thêm nhà cung cấp**. Cột **Nhập gần nhất** cho biết lần cuối nhập hàng của nhà cung cấp đó.

---

## 11. Tài khoản nhân viên

*(Chỉ chủ cửa hàng)*

| Việc cần làm | Cách làm |
|---|---|
| Thêm nhân viên mới | Ở khung **Thêm tài khoản**, điền họ tên, tên đăng nhập (chữ thường, ví dụ `hoa.nv`), vai trò và mật khẩu ban đầu (≥ 6 ký tự), rồi bấm **Tạo tài khoản**. Đưa tên đăng nhập và mật khẩu cho nhân viên, dặn họ đổi mật khẩu khi vào lần đầu |
| Đổi tên hoặc vai trò | Sửa ngay trên dòng của người đó rồi bấm **Lưu** |
| Nhân viên quên mật khẩu | Gõ mật khẩu mới ở cột **Đặt lại mật khẩu** rồi bấm **Đặt lại**. Việc này cũng mở khóa nếu họ bị khóa do nhập sai |
| Nhân viên nghỉ việc | Bấm **Khóa**. Người đó bị đăng xuất ngay và không vào được nữa. Phiếu cũ vẫn giữ tên họ cho báo cáo doanh số |

Bạn không thể tự khóa tài khoản của mình hoặc tự bỏ quyền Chủ, để tránh mất quyền quản lý.

Bảng **Quyền theo vai trò** ở cuối trang cho biết mỗi vai trò được vào những màn hình nào.

---

## 12. Báo cáo

*(Chỉ chủ cửa hàng)*

Chọn tab báo cáo. Với ba báo cáo theo tháng, chọn tháng rồi bấm **Xem**.

| Tab | Cho biết | Dùng để |
|---|---|---|
| **Lãi lỗ** (theo tháng) | Doanh thu bán hàng − hàng trả lại = doanh thu thuần; trừ giá vốn = **lãi gộp**. Có biểu đồ lãi gộp 6 tháng gần nhất | Biết tháng này lời bao nhiêu |
| **Công nợ** (theo tháng) | Mỗi khách: nợ đầu tháng, phát sinh thêm, đã giảm (thu tiền, trả hàng), nợ cuối tháng, nợ từ ngày | Đối chiếu công nợ cuối tháng với nhà thầu |
| **Doanh số NV** (theo tháng) | Mỗi nhân viên: số phiếu, doanh số, hàng bị trả, **doanh số thuần** | Tính thưởng |
| **Hàng sắp hết** | Món dưới mức tồn tối thiểu, lượng bán 4 tuần qua, nhà cung cấp gần nhất | Lên danh sách đặt hàng |
| **Tồn lâu** | Món nằm kho hơn 12 tháng mà không bán được, kèm giá trị vốn đang nằm kho | Quyết định giảm giá, xả hàng |
| **Chênh lệch kiểm kê** | Các dòng lệch sau kiểm kê, lý do, trạng thái | Duyệt điều chỉnh tồn kho (mục 8.2) |

---

## 13. Câu hỏi thường gặp

**Bán nhầm số lượng hoặc nhầm món, sửa phiếu thế nào?**
Phiếu đã lưu không sửa được. Làm **Nhận hàng trả lại** cho phần nhầm (mục 5), rồi lập phiếu mới cho đúng.

**Bấm "Ghi nợ" không được?**
Khách đang chọn là *Khách lẻ*, hoặc khách chưa được cho phép mua chịu. Nhờ chủ bật **"Cho mua chịu"** cho khách đó (mục 10.1).

**Báo "Không đủ hàng" dù ngoài kệ vẫn còn?**
Có thể số trên phần mềm đang thấp hơn thực tế, ví dụ do hàng về nhưng chưa làm phiếu nhập. Báo thủ kho kiểm tra phiếu nhập, hoặc kiểm kê lại món đó.

**Khách trả tiền nhiều hơn số nợ?**
Phần mềm chỉ cho thu tối đa bằng số đang nợ. Phần thừa trả lại khách.

**Tồn kho tính theo đơn vị nào?**
Luôn theo **đơn vị gốc** (đơn vị nhỏ nhất). Trên màn hình, phần mềm ghi kèm số quy đổi ra đơn vị lớn nhất cho dễ hình dung, ví dụ dây điện hiện *"40 m (≈ 0,4 cuộn)"*.

**Bị khóa tài khoản do nhập sai mật khẩu?**
Chờ 15 phút rồi thử lại, hoặc nhờ chủ **đặt lại mật khẩu**.

**Mất điện, máy tắt giữa chừng thì có mất phiếu không?**
Phiếu chỉ được ghi khi đã hiện thông báo *"Đã lưu phiếu…"*. Nếu chưa thấy thông báo, phiếu chưa được lưu và tồn kho cũng chưa bị trừ: hãy lập lại phiếu. Phần mềm không bao giờ lưu nửa phiếu.
