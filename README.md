# Thành Phát · Website quản lý cửa hàng cơ khí

**🔗 Link deploy: https://vibe-web01-cuahangcokhi.onrender.com**

Đăng nhập bằng một trong các tài khoản demo (mật khẩu đều là `123456`):

| Tài khoản | Vai trò |
|---|---|
| `chu` | Chủ cửa hàng: toàn quyền, xem báo cáo |
| `lan`, `hung` | Nhân viên bán hàng |
| `minh` | Thủ kho |

> Bản demo chạy gói miễn phí của Render. Nếu không ai dùng trong 15 phút, máy chủ "ngủ"; lần mở sau chờ khoảng 30–50 giây. Mỗi khi máy chủ khởi động lại, dữ liệu quay về bộ mẫu.

Bài tập phân tích use case và xây dựng website cho cửa hàng kim khí, cơ khí Thành Phát: bán hàng, ghi nợ nhà thầu, nhận hàng trả lại, nhập hàng theo lô, kiểm kê kho, báo cáo cho chủ cửa hàng.

**Công nghệ:** Next.js 16 (App Router, TypeScript) · SQLite (`node:sqlite`) · Tailwind CSS v4 · triển khai trên Render

---

## Nội dung bài nộp

| # | Việc | Ở đâu trong repo |
|---|---|---|
| 1 | Khung dự án | [CLAUDE.md](CLAUDE.md) · rule [.claude/rules/](.claude/rules/cap-nhat-kien-truc.md) · skill [.claude/skills/lam-use-case](.claude/skills/lam-use-case/SKILL.md) · agent [.claude/agents/kiem-tra-kien-truc](.claude/agents/kiem-tra-kien-truc.md) · [docs/](docs/) |
| 2 | Use case | [docs/usecase/](docs/usecase/): [phân tích 22 use case](docs/usecase/phan-tich-usecase.md), [sơ đồ PlantUML](docs/usecase/usecase_cuahang_cokhi.puml), [sơ đồ HTML](docs/usecase/so-do-use-case.html) |
| 3 | Kiến trúc | [docs/kien-truc/](docs/kien-truc/): [kiến trúc hệ thống](docs/kien-truc/kien-truc.md), [sơ đồ thành phần](docs/kien-truc/kien-truc.puml), [thiết kế CSDL](docs/kien-truc/thiet-ke-csdl.md), [wireframe](docs/kien-truc/wireframe.html) |
| 4 | Triển khai | Mã nguồn: [web/](web/) · cấu hình [render.yaml](render.yaml) · link deploy ở đầu trang |
| 5 | Nộp bài | Repo này, README có link deploy |

Tài liệu thêm: [hướng dẫn sử dụng cho nhân viên](docs/huong-dan-su-dung.md) · [quy trình phát triển](docs/quy-trinh-phat-trien.md) · [chi tiết mã nguồn](web/README.md)

---

## Chạy trên máy

Cần Node.js ≥ 22.13.

```bash
cd web
npm install
npm run dev        # mở http://localhost:3000
```

Lần chạy đầu tự tạo CSDL `web/data/cuahang.db` kèm dữ liệu mẫu khoảng 2 tháng hoạt động.

## Cấu trúc

```
├── CLAUDE.md                  luật dự án cho trợ lý AI
├── .claude/
│   ├── rules/                 rule: làm tính năng phải cập nhật tài liệu kiến trúc
│   ├── skills/lam-use-case/   skill: làm một use case theo đúng quy trình
│   └── agents/                agent: rà code theo kiến trúc trước khi báo xong
├── docs/
│   ├── usecase/               phân tích & sơ đồ use case
│   ├── kien-truc/             kiến trúc, sơ đồ thành phần, thiết kế CSDL, wireframe
│   ├── huong-dan-su-dung.md
│   └── quy-trinh-phat-trien.md
├── web/                       mã nguồn website (Next.js + SQLite)
└── render.yaml                cấu hình triển khai Render
```
