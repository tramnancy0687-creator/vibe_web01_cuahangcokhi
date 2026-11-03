# Quy trình phát triển tính năng — Website Thành Phát

Áp dụng cho mọi người (và AI) khi thêm hoặc sửa tính năng trong `web/`.
Mục tiêu: code đúng đặc tả, đúng kiến trúc, và **tài liệu luôn khớp với code**.

| Tài liệu | Nội dung | Khi nào đọc / sửa |
|---|---|---|
| [usecase/phan-tich-usecase.md](usecase/phan-tich-usecase.md) | Use case, luồng, quy tắc, câu hỏi còn mở | Đọc trước khi làm; sửa khi đặc tả thay đổi hoặc chốt được câu hỏi mở |
| [usecase/usecase_cuahang_cokhi.puml](usecase/usecase_cuahang_cokhi.puml) | Sơ đồ use case | Sửa khi thêm hoặc bớt use case, tác nhân |
| [kien-truc/wireframe.html](kien-truc/wireframe.html) | Bố cục màn hình | Xem khi làm giao diện |
| [kien-truc/kien-truc.md](kien-truc/kien-truc.md) | Công nghệ, phân tầng, dữ liệu, phân quyền, triển khai | **Đọc trước khi code, cập nhật sau khi code** (mục 3) |
| [kien-truc/kien-truc.puml](kien-truc/kien-truc.puml) | Sơ đồ thành phần (PlantUML) | Sửa khi thêm tầng, thành phần, dịch vụ ngoài |
| [kien-truc/thiet-ke-csdl.md](kien-truc/thiet-ke-csdl.md) | Chi tiết từng bảng, cột, quan hệ, bất biến, thao tác ghi theo use case | Cập nhật khi đổi `schema.ts` hoặc đổi bảng mà một hàm nghiệp vụ ghi vào (mục 3) |
| [huong-dan-su-dung.md](huong-dan-su-dung.md) | Hướng dẫn thao tác cho chủ, nhân viên bán hàng, thủ kho | Cập nhật khi thêm hoặc đổi màn hình, nút, quy tắc người dùng thấy (mục 3) |
| `quy-trinh-phat-trien.md` | Tài liệu này | — |

---

## 1. Các bước làm một tính năng

Mỗi lần chỉ làm **một use case** (ví dụ "làm UC-12"), xong hẳn mới sang cái khác.

1. **Đọc đặc tả.** Mở đúng mục UC-xx trong `phan-tich-usecase.md`: luồng chính, luồng thay thế, quy tắc.
2. **Đọc kiến trúc.** Mở các mục liên quan trong `kien-truc.md` để biết code đặt ở đâu và theo quy ước nào.
3. **Code theo tầng, từ dưới lên:**
   1. `lib/schema.ts`: thêm bảng hoặc cột nếu cần.
   2. `lib/<nghiệp vụ>.ts`: hàm nghiệp vụ. Mọi quy tắc nằm ở đây. Lỗi dành cho người dùng thì ném `BizError`. Thao tác ghi nhiều bảng thì bọc trong `tx()`.
   3. `app/(app)/<màn hình>/actions.ts`: server action làm 4 bước: `requireUser`, đọc form, gọi **một** hàm nghiệp vụ, rồi chuyển trang kèm thông báo.
   4. `app/(app)/<màn hình>/page.tsx`: giao diện. Gọi `requireUser` ở đầu trang. Chỉ dùng client component khi cần tương tác tức thì.
   5. `lib/menu.ts`: thêm mục menu và quyền nếu là màn hình mới.
4. **Kiểm tra:**
   - `npx tsc --noEmit` và `npm run lint` không có lỗi.
   - `npm run build` thành công.
   - Mở trình duyệt, thử luồng chính và các luồng lỗi bằng từng vai trò (`chu`, `lan`, `minh`). Vai trò không được phép phải bị chặn, kể cả khi gõ thẳng đường dẫn.
5. **Cập nhật tài liệu:** xem mục 3.
6. **Báo xong việc:** nêu những gì đã làm, kết quả kiểm tra, và dòng **"Đã cập nhật kien-truc.md: mục …"**. Nếu không cần cập nhật thì ghi **"kien-truc.md: không đổi (lý do …)"**.

---

## 2. Quy ước bắt buộc

- **Phân tầng:** tầng trên chỉ gọi tầng dưới, theo thứ tự giao diện → action → nghiệp vụ → dữ liệu. Giao diện không viết SQL.
- **Phân quyền:** mọi `page.tsx` và mọi server action đều gọi `requireUser(...)`. Ẩn menu là chưa đủ.
- **Dữ liệu từ trình duyệt:**
  - Giá, người thực hiện, số tồn đều lấy ở server.
  - Không dùng giá trị trình duyệt gửi lên nếu server tự biết được.
- **Con số nghiệp vụ** (ngưỡng ngày, số lần, thời hạn) đặt trong bảng `settings` và đọc bằng `setting(key)`. Không viết cứng trong code.
- **Lưu trữ:**
  - Số lượng theo đơn vị gốc, tiền là số nguyên VND, thời gian lưu dạng ISO UTC.
  - Không xóa chứng từ. Hàng, khách, tài khoản ngừng dùng thì đánh dấu `active = 0`.
- **SQL** luôn dùng tham số `?`, không ghép chuỗi.
- **Làm ngược kiến trúc:** dừng lại, trao đổi lý do và chỉ làm khi được đồng ý. Sau đó ghi quyết định vào `kien-truc.md`.

---

## 3. Cập nhật tài liệu kiến trúc

Một tính năng chỉ được coi là **xong** khi `kien-truc.md` đã được cập nhật **trong cùng lần làm**.

| Thay đổi trong code | Mục cần sửa trong `kien-truc.md` |
|---|---|
| Thêm hoặc đổi công nghệ, thư viện, phiên bản (`package.json`, `next.config.ts`) | 1. Tổng quan |
| Thêm màn hình (`app/(app)/<ten>/`) hoặc client component | 2.1 Tầng giao diện, 6. Cấu trúc thư mục |
| Thêm server action, hoặc đổi cách xử lý form, thông báo | 2.2 Tầng điều khiển |
| Thêm file trong `lib/`, hoặc thêm, đổi hàm nghiệp vụ chính | 2.3 Tầng nghiệp vụ (bảng file ↔ use case) |
| Đổi `db.ts`: kết nối, giao dịch, sinh mã chứng từ | 2.4 Tầng dữ liệu |
| Thêm luồng nhiều bảng, có giao dịch, khác hẳn luồng bán hàng | 3. Luồng xử lý mẫu (thêm luồng mới) |
| Thêm hoặc sửa bảng, cột, quan hệ (`schema.ts`) | 4.1 Sơ đồ quan hệ, 4.2 Quy ước lưu trữ |
| Đổi cách tính giá vốn, tồn kho, công nợ | 4.2, 4.3 |
| Thêm khóa trong bảng `settings` | 4.4 Cấu hình nghiệp vụ |
| Đổi vai trò hoặc quyền vào màn hình (`menu.ts`, `requireUser`) | 5. Bảo mật và phân quyền |
| Đổi cách chạy, build, sao lưu | 7. Triển khai và vận hành |
| Làm xong một mục trong "Giới hạn và hướng mở rộng" | 7: xóa dòng đó, mô tả phần đã làm ở mục phù hợp |

**Không cần cập nhật** khi chỉ sửa lỗi nhỏ, đổi chữ hiển thị, hoặc chỉnh màu, khoảng cách mà không đổi cấu trúc.

**Hai tài liệu đi kèm** cũng phải cập nhật trong cùng lần làm:

| Thay đổi trong code | Tài liệu, mục cần sửa |
|---|---|
| Thêm hoặc sửa bảng, cột, ràng buộc, chỉ mục (`schema.ts`), khóa `settings`, tiền tố mã chứng từ | `thiet-ke-csdl.md`: mục 1.2, 2, 3 (bảng tương ứng) |
| Hàm nghiệp vụ ghi thêm hoặc bớt bảng, đổi cách tính tồn kho, giá vốn, công nợ | `thiet-ke-csdl.md`: mục 4, 5, 6 |
| Thêm màn hình, nút, ô nhập, hoặc đổi quy tắc người dùng gặp (giới hạn, thông báo lỗi, quyền) | `huong-dan-su-dung.md`: mục của màn hình đó, bảng quyền mục 2, câu hỏi thường gặp nếu liên quan |
| Đổi giá trị mặc định trong `settings` (5 lần, 15 phút, 30 ngày, 12 tháng) | `huong-dan-su-dung.md`: các chỗ nhắc con số đó |

**Cách viết:**
- Viết ngắn, cùng giọng văn với tài liệu hiện có, ghi mã use case (UC-xx) nếu có.
- Tên bảng, tên file, tên hàm trong tài liệu và sơ đồ phải trùng với code thật.
- Nếu tính năng trả lời một câu hỏi còn mở (ví dụ FIFO hay giá bình quân), sửa cả `phan-tich-usecase.md`.

---

## 4. Danh sách kiểm tra trước khi báo xong

- [ ] Làm đúng một use case, đã đối chiếu với đặc tả
- [ ] Nghiệp vụ nằm trong `lib/`, action và trang đều gọi `requireUser`
- [ ] Không có con số nghiệp vụ viết cứng
- [ ] `tsc`, `lint`, `build` không lỗi
- [ ] Đã thử trên trình duyệt với từng vai trò, gồm cả trường hợp bị chặn và trường hợp lỗi
- [ ] `kien-truc.md` đã cập nhật đúng mục, hoặc đã ghi lý do không cần cập nhật
- [ ] `thiet-ke-csdl.md` và `huong-dan-su-dung.md` đã cập nhật nếu thay đổi chạm tới CSDL hoặc màn hình
