"use server";

import { redirect } from "next/navigation";
import { login } from "@/lib/auth";
import { str, type FormState } from "@/lib/actions";

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const error = await login(str(form.get("username")), str(form.get("password")));
  if (error) return { error };
  redirect("/");
}
