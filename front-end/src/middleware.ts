import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const userToken = request.cookies.get("userToken");
  const { pathname } = request.nextUrl;

  // Allow login and sign-up routes to be accessed without a userToken
  if (pathname === "/user/login" || pathname === "/user/sign-up") {
    return NextResponse.next();
  }

  // Redirect to login if userToken is not present for protected routes
  if (pathname.startsWith("/user") && !userToken) {
    const loginUrl = new URL("/user/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Apply the middleware to `/dashboard` and `/user` routes
export const config = {
  matcher: ["/dashboard/:path*", "/user/:path*"],
};
