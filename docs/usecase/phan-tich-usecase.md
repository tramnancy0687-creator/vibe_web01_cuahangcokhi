# Phân tích use case — Cửa hàng Thành Phát

> Bài 1 · Khách hàng kể. Website quản lý cửa hàng bán đồ cơ khí và vật tư xây dựng.
> Sơ đồ: [usecase_cuahang_cokhi.puml](usecase_cuahang_cokhi.puml)

## 1. Hồ sơ cửa hàng

| Mục | Nội dung |
|---|---|
| Cửa hàng | Thành Phát, bán đồ cơ khí và vật tư xây dựng |
| Người | 1 chủ · 2 nhân viên bán · 1 người giữ kho |
| Đang dùng | Một cuốn sổ công nợ, một file Excel tồn kho |
| Mỗi ngày | 40 tới 60 lượt khách |

## 2. Tác nhân (Actor)

| Tác nhân | Vai trò trong hệ thống |
|---|---|
| **Người dùng** | Tác nhân tổng quát. Ai cũng phải đăng nhập (đây là website). |
| **Chủ cửa hàng** | Quản lý danh mục, tài khoản nhân viên; thu nợ; xem các báo cáo. |
| **Nhân viên bán hàng** (2 người) | Tra cứu hàng, lập phiếu bán, nhận hàng trả lại, thu nợ. Doanh số ghi theo từng nhân viên. |
| **Thủ kho** (1 người) | Lập phiếu nhập theo lô, kiểm kê kho, ghi lại chỗ lệch. |

- Chủ cửa hàng, Nhân viên bán hàng, Thủ kho đều **kế thừa** Người dùng.
- **Khách lẻ, nhà thầu, nhà cung cấp không phải tác nhân**: họ không tự dùng website, nhân viên thao tác thay. Họ là dữ liệu hệ thống quản lý (danh mục khách hàng, nhà cung cấp).

## 3. Danh sách use case

### 3.1 Tài khoản

| Mã | Use case | Tác nhân | Nghiệp vụ |
|---|---|---|---|
| UC-01 | Đăng nhập | Người dùng | Mở chức năng theo vai trò; phiếu bán tự ghi đúng nhân viên để tính doanh số. |

### 3.2 Danh mục

| Mã | Use case | Tác nhân | Nghiệp vụ rút ra từ lời kể |
|---|---|---|---|
| UC-02 | Quản lý hàng hóa & đơn vị tính | Chủ cửa hàng | Khai báo món hàng, đơn vị gốc, các đơn vị bán (con, kg, mét), tỉ lệ quy đổi, giá lẻ/sỉ, mức tồn tối thiểu. |
| UC-03 | Quản lý nhà cung cấp | Chủ cửa hàng | Hàng nhập từ nhiều nhà cung cấp khác nhau. |
| UC-04 | Quản lý khách hàng | Chủ cửa hàng | Danh sách nhà thầu được mua chịu, trả cuối tháng. |
| UC-05 | Quản lý tài khoản nhân viên | Chủ cửa hàng | Tạo/khóa tài khoản, gán vai trò; nhân viên không xem giá nhập, lãi lỗ. |

### 3.3 Bán hàng

| Mã | Use case | Tác nhân | Nghiệp vụ rút ra từ lời kể | Quan hệ |
|---|---|---|---|---|
| UC-06 | Tra cứu hàng hóa (tồn kho, giá bán) | NV bán hàng | Khách hỏi món gì thì tra còn hàng không và báo giá theo đơn vị bán. | |
| UC-07 | Lập phiếu bán hàng | NV bán hàng | Khách đồng ý thì lấy hàng, viết phiếu bán, trừ tồn kho. Khách lẻ trả tiền ngay. | «include» UC-09 |
| UC-08 | Ghi nợ cho khách mua chịu | (tự động) | Nhà thầu lấy hàng suốt tháng: ghi nợ từng người, nợ bao nhiêu, từ ngày nào. | «extend» UC-07 [khách mua chịu] |
| UC-09 | Quy đổi đơn vị tính | (tự động) | Ốc vít bán lẻ tính con, bán sỉ cân ký; dây điện tính mét. Tồn kho luôn tính trên đơn vị gốc. | được include bởi UC-07, UC-13 |

### 3.4 Công nợ & trả hàng

| Mã | Use case | Tác nhân | Nghiệp vụ rút ra từ lời kể | Quan hệ |
|---|---|---|---|---|
| UC-10 | Nhận hàng khách trả lại | NV bán hàng | Chỉ nhận hàng còn nguyên; cộng lại tồn kho. | |
| UC-11 | Trừ công nợ khi trả hàng | (tự động) | Giá trị hàng trả được trừ vào công nợ. | «extend» UC-10 [khách đang có nợ] |
| UC-12 | Thu nợ khách hàng | Chủ, NV bán hàng | Nhà thầu thanh toán một lần cuối tháng, giảm số nợ. | |

### 3.5 Kho

| Mã | Use case | Tác nhân | Nghiệp vụ rút ra từ lời kể | Quan hệ |
|---|---|---|---|---|
| UC-13 | Lập phiếu nhập hàng (theo lô, giá nhập) | Thủ kho | Mỗi lần nhập là một lô: nhà cung cấp, số lượng, giá nhập riêng của đợt đó. | «include» UC-09 |
| UC-14 | Kiểm kê kho | Thủ kho | Đếm hàng thực tế, đối chiếu với sổ sách. | |
| UC-15 | Ghi nhận chênh lệch kiểm kê | (tự động) | Số thực tế khác sổ sách: ghi lại cho chủ biết. | «extend» UC-14 [có lệch] |

### 3.6 Báo cáo

UC-16 **Xem báo cáo** (Chủ cửa hàng) là use case tổng quát; các báo cáo cụ thể bên dưới là trường hợp riêng của nó (quan hệ tổng quát hóa).

| Mã | Báo cáo | Nghiệp vụ rút ra từ lời kể |
|---|---|---|
| UC-17 | Công nợ khách hàng | Ai còn nợ, nợ bao nhiêu, nợ từ hôm nào. |
| UC-18 | Lãi lỗ theo tháng | Doanh thu trừ giá vốn; giá vốn theo giá nhập của từng lô. |
| UC-19 | Hàng tồn lâu không bán được | Món nằm kho cả năm không ai mua, để ngừng nhập. |
| UC-20 | Hàng sắp hết | Món có tồn dưới mức tối thiểu, để đặt thêm. |
| UC-21 | Chênh lệch kiểm kê | Các lần kiểm kê bị lệch do thủ kho ghi lại. |
| UC-22 | Doanh số theo nhân viên | Nhân viên nào bán nhiều nhất, để tính thưởng. |

## 4. Quan hệ giữa các use case

| Use case | Quan hệ | Use case | Ý nghĩa |
|---|---|---|---|
| UC-07 Lập phiếu bán hàng | «include» | UC-09 Quy đổi đơn vị tính | Luôn quy về đơn vị gốc |
| UC-13 Lập phiếu nhập hàng | «include» | UC-09 Quy đổi đơn vị tính | Luôn quy về đơn vị gốc |
| UC-08 Ghi nợ cho khách mua chịu | «extend» | UC-07 Lập phiếu bán hàng | Chỉ khi khách là nhà thầu mua chịu |
| UC-11 Trừ công nợ khi trả hàng | «extend» | UC-10 Nhận hàng khách trả lại | Chỉ khi khách đang có nợ |
| UC-15 Ghi nhận chênh lệch kiểm kê | «extend» | UC-14 Kiểm kê kho | Chỉ khi số thực tế lệch sổ sách |
| UC-17 … UC-22 | tổng quát hóa | UC-16 Xem báo cáo | Mỗi báo cáo là một loại "Xem báo cáo" |

## 5. Câu hỏi cần hỏi lại khách

1. Khi bán, giá vốn lấy theo lô nào: nhập trước xuất trước (FIFO) hay giá bình quân? Quyết định cách tính lãi ở UC-18.
2. Tỉ lệ quy đổi con ↔ ký cố định cho từng loại ốc vít, hay mỗi lô nhập lại khác?
3. Nhà thầu có hạn mức nợ không? Quá hạn cuối tháng chưa trả thì xử lý thế nào?
4. Hàng trả lại không còn nguyên thì từ chối hẳn hay nhận với giá thấp hơn? Khách lẻ trả hàng thì hoàn tiền mặt?
5. "Sắp hết" là dưới bao nhiêu, "nằm kho lâu" là bao lâu? Mỗi món một ngưỡng hay dùng chung?
6. Nhân viên được xem những gì: giá nhập, lãi lỗ, doanh số người khác? Quyết định phân quyền ở UC-05.
7. Có cần dùng trên điện thoại (thủ kho kiểm kê tại kệ)? Có cần in phiếu bán từ trình duyệt?
8. Khi kiểm kê bị lệch, chủ có điều chỉnh tồn kho theo số thực tế luôn không?
