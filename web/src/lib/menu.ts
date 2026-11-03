import type { Role } from "./auth";

export type MenuItem = { href: string; label: string; roles: Role[]; group: string };

// Quyền theo vai trò, khớp bảng phân quyền trong docs/kien-truc/wireframe.html
export const MENU: MenuItem[] = [
  { href: "/", label: "Trang chủ", roles: ["CH", "NV", "TK"], group: "" },
  { href: "/ban-hang", label: "Bán hàng", roles: ["CH", "NV"], group: "Bán hàng" },
  { href: "/tra-hang", label: "Nhận hàng trả lại", roles: ["CH", "NV"], group: "Bán hàng" },
  { href: "/cong-no", label: "Công nợ & thu nợ", roles: ["CH", "NV"], group: "Bán hàng" },
  { href: "/nhap-hang", label: "Nhập hàng", roles: ["CH", "TK"], group: "Kho" },
  { href: "/kiem-ke", label: "Kiểm kê kho", roles: ["CH", "TK"], group: "Kho" },
  { href: "/hang-hoa", label: "Hàng hóa & đơn vị", roles: ["CH"], group: "Danh mục" },
  { href: "/khach-hang", label: "Khách hàng & NCC", roles: ["CH"], group: "Danh mục" },
  { href: "/tai-khoan", label: "Tài khoản nhân viên", roles: ["CH"], group: "Danh mục" },
  { href: "/bao-cao", label: "Báo cáo", roles: ["CH"], group: "Báo cáo" },
];
