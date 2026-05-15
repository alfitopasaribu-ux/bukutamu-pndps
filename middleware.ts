import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-minimum-32-characters"
);

// Routes yang membutuhkan auth
const PROTECTED_ROUTES = ["/admin"];
// Routes publik
const PUBLIC_ROUTES = ["/login", "/daftar", "/api/auth/login"];
// API routes yang butuh auth
const PROTECTED_API_ROUTES = [
  "/api/dashboard",
  "/api/visitors",
  "/api/visitors/",
  "/api/upload",

];


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/logo") ||
    pathname.startsWith("/gedung") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Security headers untuk semua response
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Check apakah route butuh auth
  const isProtectedRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isProtectedAPI = PROTECTED_API_ROUTES.some((r) => pathname.startsWith(r));
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // Ambil token dari cookie
  const token = request.cookies.get("auth-token")?.value;

  // Redirect root ke public form atau admin
  if (pathname === "/") {
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL("/admin", request.url));
      } catch {
        // Token invalid, redirect ke login
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
    return NextResponse.redirect(new URL("/daftar", request.url));
  }

  // Proteksi admin routes
  if (isProtectedRoute || isProtectedAPI) {
    if (!token) {
      if (isProtectedAPI) {
        return NextResponse.json(
          { error: "Unauthorized", message: "Authentication required" },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      // Inject user info ke header untuk API routes
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", payload.userId as string);
      requestHeaders.set("x-user-role", payload.role as string);
      requestHeaders.set("x-user-name", payload.name as string);

      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      if (isProtectedAPI) {
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

  // Jika sudah login, redirect dari login ke admin
  if (pathname === "/login" && token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.redirect(new URL("/admin", request.url));
    } catch {
      // Token expired, lanjutkan ke login
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};