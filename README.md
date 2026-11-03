# Thành Phát · Website quản lý cửa hàng cơ khí

Bài tập phân tích use case và xây dựng website cho cửa hàng kim khí, cơ khí Thành Phát: bán hàng, ghi nợ nhà thầu, nhận hàng trả lại, nhập hàng theo lô, kiểm kê kho và báo cáo cho chủ cửa hàng.

**Công nghệ:** Next.js 16 (App Router, TypeScript) · SQLite (`node:sqlite`) · Tailwind CSS v4

## Chạy thử

Cần Node.js ≥ 22.13.

```bash
cd web
npm install
npm run dev        # mở http://localhost:3000
```

Lần chạy đầu tự tạo CSDL `web/data/cuahang.db` kèm dữ liệu mẫu khoảng 2 tháng hoạt động.

| Tài khoản | Mật khẩu | Vai trò |
|---|---|---|
| `chu` | `123456` | Chủ cửa hàng |
| `lan`, `hung` | `123456` | Nhân viên bán hàng |
| `minh` | `123456` | Thủ kho |

## Triển khai

Bản demo: **https://vibe-web01-cuahangcokhi.onrender.com**, chạy trên Render (cấu hình ghi trong [render.yaml](render.yaml)). Mỗi lần push lên `main`, Render tự triển khai lại. Dữ liệu quay về bộ mẫu khi máy chủ khởi động lại, xem [docs/kien-truc.md](docs/kien-truc.md) mục 7.

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [docs/phan-tich-usecase.md](docs/phan-tich-usecase.md) | Phân tích 22 use case, tác nhân, quy tắc nghiệp vụ, câu hỏi còn mở |
| [docs/usecase_cuahang_cokhi.puml](docs/usecase_cuahang_cokhi.puml) | Sơ đồ use case (PlantUML) |
| [docs/wireframe.html](docs/wireframe.html) | Wireframe các màn hình |
| [docs/kien-truc.md](docs/kien-truc.md) | Kiến trúc hệ thống |
| [docs/thiet-ke-csdl.md](docs/thiet-ke-csdl.md) | Thiết kế cơ sở dữ liệu |
| [docs/huong-dan-su-dung.md](docs/huong-dan-su-dung.md) | Hướng dẫn sử dụng cho nhân viên cửa hàng |
| [docs/quy-trinh-phat-trien.md](docs/quy-trinh-phat-trien.md) | Quy trình phát triển tính năng |
| [web/README.md](web/README.md) | Chi tiết mã nguồn: màn hình ↔ use case, cấu trúc thư mục |

## Cấu trúc

```
├── docs/        tài liệu phân tích, thiết kế, hướng dẫn
├── web/         mã nguồn website (Next.js + SQLite)
├── .claude/     cấu hình cho trợ lý AI (rules, skills, agents…)
└── CLAUDE.md    hướng dẫn cho trợ lý AI khi phát triển tiếp
```
