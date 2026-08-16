import { NextResponse, type NextRequest } from "next/server";
import { FACILITATOR_COOKIE, verifyFacilitatorSessionValue } from "@/lib/facilitator-auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/facilitator/login") {
    return NextResponse.next();
  }

  const authed = await verifyFacilitatorSessionValue(
    request.cookies.get(FACILITATOR_COOKIE)?.value
  );

  if (!authed) {
    const loginUrl = new URL("/facilitator/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/facilitator/:path*"],
};
