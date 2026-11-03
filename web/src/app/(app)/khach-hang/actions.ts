"use server";

import { requireUser } from "@/lib/auth";
import { saveCustomer, saveSupplier, setCustomerActive } from "@/lib/catalog";
import { act, str } from "@/lib/actions";

const idOf = (form: FormData) => (str(form.get("id")) ? Number(form.get("id")) : null);

export async function saveCustomerAction(form: FormData) {
  await requireUser("CH");
  act("/khach-hang", () => {
    saveCustomer({
      id: idOf(form), name: str(form.get("name")), phone: str(form.get("phone")),
      kind: str(form.get("kind")), allowCredit: form.get("allowCredit") === "on",
    });
    return "Đã lưu khách hàng.";
  });
}

export async function toggleCustomerAction(form: FormData) {
  await requireUser("CH");
  act("/khach-hang", () => {
    setCustomerActive(Number(form.get("id")), form.get("active") === "1");
    return "Đã cập nhật trạng thái khách hàng.";
  });
}

export async function saveSupplierAction(form: FormData) {
  await requireUser("CH");
  act("/khach-hang?tab=ncc", () => {
    saveSupplier({
      id: idOf(form), name: str(form.get("name")), contact: str(form.get("contact")),
      phone: str(form.get("phone")), note: str(form.get("note")),
    });
    return "Đã lưu nhà cung cấp.";
  });
}
