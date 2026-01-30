import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/uploads/")) {
    return new NextResponse("Not found", { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/uploads/:path*"]
};
