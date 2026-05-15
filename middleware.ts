import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-minimum-32-characters"
);

const PROTECTED_ROUTES = ["/admin"];

const PROTECTED_API_ROUTES = [
  "/api/dashboard",
  "/api/visitors/",
];

// API yang butuh auth hanya untuk method tertentu
const ADMIN_ONLY_GET = ["/api/visitors"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
const reqMethod = request.method;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/logo") ||
    pathname.startsWith("/gedung") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");

  const token = request.cookies.get("auth-token")?.value;

  // Redirect root
  if (pathname === "/") {
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL("/admin", request.url));
      } catch {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
    return NextResponse.redirect(new URL("/daftar", request.url));
  }

  // Cek apakah route admin (halaman)
  const isProtectedRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));

  // Cek API yang selalu butuh auth
  const isProtectedAPI = PROTECTED_API_ROUTES.some((r) => pathname.startsWith(r));

  // Cek API yang butuh auth hanya untuk GET
  const isAdminOnlyGet = ADMIN_ONLY_GET.some((r) => pathname === r) && reqMethod === "GET";

  if (isProtectedRoute || isProtectedAPI || isAdminOnlyGet) {
    if (!token) {
      if (isProtectedAPI || isAdminOnlyGet) {
        return NextResponse.json(
          { error: "Unauthorized", message: "Authentication required" },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", payload.userId as string);
      requestHeaders.set("x-user-role", payload.role as string);
      requestHeaders.set("x-user-name", payload.name as string);
      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      if (isProtectedAPI || isAdminOnlyGet) {
        return NextResponse.json(
          { error: "Unauthorized", message: "Invalid or expired token" },
          { status: 401 }
        );
      }
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth-token");
      return response;
    }
  }

  // Redirect login jika sudah login
  if (pathname === "/login" && token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.redirect(new URL("/admin", request.url));
    } catch {}
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};