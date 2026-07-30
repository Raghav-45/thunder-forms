import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

function checkIsPathRestricted(pathname: string): boolean {
  return (
    pathname !== "/" &&
    !pathname.startsWith("/auth") &&
    pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/dashboard/builder/new-form")
  )
}

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)

  if (checkIsPathRestricted(request.nextUrl.pathname) && !sessionCookie) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
