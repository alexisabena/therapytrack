"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, expectedSessionToken, verifyPin } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const pin = String(formData.get("pin") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!verifyPin(pin)) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const token = await expectedSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days — shared household device, low-friction re-entry
  });

  redirect(next || "/");
}
