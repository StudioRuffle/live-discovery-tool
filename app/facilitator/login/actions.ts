"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  FACILITATOR_COOKIE,
  createFacilitatorSessionValue,
  facilitatorCookieOptions,
  verifyPin,
} from "@/lib/facilitator-auth";

export async function login(formData: FormData) {
  const pin = String(formData.get("pin") ?? "");
  const next = String(formData.get("next") ?? "/facilitator");

  if (!verifyPin(pin)) {
    redirect(`/facilitator/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(
    FACILITATOR_COOKIE,
    await createFacilitatorSessionValue(),
    facilitatorCookieOptions
  );

  redirect(next.startsWith("/facilitator") ? next : "/facilitator");
}
