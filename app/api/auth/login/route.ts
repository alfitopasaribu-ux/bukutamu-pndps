import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, AUTH_COOKIE_OPTIONS } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { z } from "zod";

// Rate limiting simple (production: gunakan Redis/Upstash)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);

  if (!attempts || now > attempts.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }

  if (attempts.count >= 5) return false;

  attempts.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Rate limit check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too Many Requests", message: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation Error", message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { username, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!user || !user.isActive) {
      await new Promise((r) => setTimeout(r, 1000)); // Prevent timing attacks
      return NextResponse.json(
        { error: "Unauthorized", message: "Username atau password salah" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      await new Promise((r) => setTimeout(r, 1000));
      return NextResponse.json(
        { error: "Unauthorized", message: "Username atau password salah" },
        { status: 401 }
      );
    }

    // Generate token
    const token = await signToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Log activity
    await prisma.visitLog.create({
      data: {
        userId: user.id,
        action: "ADMIN_LOGIN",
        details: `Login berhasil dari IP: ${ip}`,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") || "",
      },
    });

    // Set cookie
    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set("auth-token", token, AUTH_COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}