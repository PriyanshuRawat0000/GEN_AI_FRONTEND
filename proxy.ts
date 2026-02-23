import { NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/test")) {
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/test/:path*"],
}
