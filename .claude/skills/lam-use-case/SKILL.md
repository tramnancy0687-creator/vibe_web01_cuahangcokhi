---
name: lam-use-case
description: Làm trọn một use case (UC-xx) của website cửa hàng Thành Phát theo đúng quy trình dự án — đọc đặc tả, code theo tầng, kiểm tra, cập nhật tài liệu. Dùng khi người dùng nói "làm UC-xx", "thêm chức năng ...", "/lam-use-case UC-xx".
argument-hint: UC-xx
---

# Làm một use case: $ARGUMENTS

Chỉ làm **đúng một** use case. Làm xong và kiểm tra xong mới nhận việc khác.

## 1. Đọc trước khi code

1. Mở `docs/usecase/phan-tich-usecase.md`, đọc đúng mục $ARGUMENTS: tác nhân, luồng chính, luồng thay thế, quy tắc, câu hỏi còn mở liên quan.
2. Mở `docs/kien-truc/kien-truc.md` (mục 2 phân tầng, mục 4 dữ liệu, mục 5 phân quyền) và `docs/kien-truc/thiet-ke-csdl.md` (bảng sẽ đọc hoặc ghi).
3. Nếu đặc tả chưa rõ hoặc mâu thuẫn với kiến trúc → hỏi người dùng, không tự đoán.

## 2. Code theo tầng, từ dưới lên

| Thứ tự | File | Quy tắc |
|---|---|---|
| 1 | `web/src/lib/schema.ts` | Chỉ khi cần bảng hoặc cột mới. Bảng đã có thì nhớ CSDL cũ không tự thêm cột |
| 2 | `web/src/lib/<nghiệp vụ>.ts` | Mọi quy tắc ở đây. Lỗi cho người dùng → `throw new BizError("…")`. Ghi nhiều bảng → bọc `tx()`. Con số nghiệp vụ → `setting(key)` |
| 3 | `web/src/app/(app)/<màn hình>/actions.ts` | `"use server"`; `requireUser(...)` → đọc form (`num`, `str`) → gọi **một** hàm nghiệp vụ → `act()` hoặc `redirect` |
| 4 | `web/src/app/(app)/<màn hình>/page.tsx` | `requireUser(...)` ở đầu trang. Không viết SQL ở đây. Client component chỉ khi cần tương tác tức thì |
| 5 | `web/src/lib/menu.ts` | Thêm mục menu + vai trò nếu là màn hình mới |

Không tin dữ liệu trình duyệt: giá, người thực hiện, tồn kho luôn lấy ở server.

## 3. Kiểm tra

Chạy trong `web/` (Node portable: thêm `$env:LOCALAPPDATA\Programs\node-v26.13.0-win-x64` vào PATH nếu cần):

```
npx tsc --noEmit
npm run lint
npm run build
```

Rồi mở trình duyệt, thử luồng chính và từng luồng thay thế bằng các tài khoản `chu`, `lan`, `minh` (mật khẩu `123456`). Vai trò không được phép phải bị chặn kể cả khi gõ thẳng URL.

Gọi agent `kiem-tra-kien-truc` để rà phần code vừa sửa trước khi báo xong.

## 4. Cập nhật tài liệu (bắt buộc)

Theo bảng ở mục 3 của `docs/quy-trinh-phat-trien.md`:
- `docs/kien-truc/kien-truc.md` (và `kien-truc.puml` nếu thêm thành phần)
- `docs/kien-truc/thiet-ke-csdl.md` nếu chạm CSDL
- `docs/huong-dan-su-dung.md` nếu đổi màn hình, nút, quy tắc người dùng thấy
- `docs/usecase/phan-tich-usecase.md` nếu chốt được câu hỏi mở

## 5. Báo cáo

- Đã làm gì, theo luồng nào của $ARGUMENTS
- Kết quả tsc / lint / build và những gì đã thử trên trình duyệt (cái gì chưa thử thì nói rõ)
- Dòng **"Đã cập nhật kien-truc.md: mục …"** hoặc **"kien-truc.md: không đổi (lý do …)"**
