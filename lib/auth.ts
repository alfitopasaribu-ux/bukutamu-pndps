import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";


const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-minimum-32-characters-here"
);

export interface JWTPayload {
  userId: string;
  username: string;
  name: string;
  role: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .setIssuer("pn-denpasar")
    .setAudience("ptsp-system")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: "pn-denpasar",
      audience: "ptsp-system",
    });
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getUserFromRequest(request: NextRequest): {
  userId: string;
  role: string;
  name: string;
} | null {
  const userId = request.headers.get("x-user-id");
  const role = request.headers.get("x-user-role");
  const name = request.headers.get("x-user-name");
  if (!userId || !role) return null;
  return { userId, role, name: name || "" };
}

export async function getUserFromCookie(request: NextRequest): Promise<{
  userId: string;
  role: string;
  name: string;
} | null> {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    userId: payload.userId,
    role: payload.role,
    name: payload.name || "",
  };
}

export function setAuthCookie(token: string): void {
  // Called from API route handlers
}


export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 8 * 60 * 60, // 8 hours
  path: "/",
};