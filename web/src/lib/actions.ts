import { redirect } from "next/navigation";
import { BizError } from "./db";

function withParam(path: string, key: string, value: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

/**
 * Chạy một thao tác nghiệp vụ rồi quay lại trang với thông báo:
 * thành công → ?ok=..., lỗi nghiệp vụ → ?err=...
 */
export function act(path: string, fn: () => string | void): never {
  let message: string | void;
  try {
    message = fn();
  } catch (e) {
    if (e instanceof BizError) redirect(withParam(path, "err", e.message));
    throw e;
  }
  redirect(withParam(path, "ok", message || "Đã lưu."));
}

export const num = (v: FormDataEntryValue | null) => {
  // ô <input type="number"> luôn gửi dấu chấm thập phân; vẫn chấp nhận "1,5" khi gõ tay
  const s = String(v ?? "").trim().replace(",", ".");
  return s === "" ? NaN : Number(s);
};

export const str = (v: FormDataEntryValue | null) => String(v ?? "");

/** Kết quả trả về cho form dùng useActionState */
export type FormState = { error?: string } | null;

export function bizError(e: unknown): FormState {
  if (e instanceof BizError) return { error: e.message };
  throw e;
}
