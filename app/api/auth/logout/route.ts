import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (token) {
      const user = await verifyToken(token);

      if (user) {
        await prisma.visitLog.create({
          data: {
            user_id: user.userId,
            action: "ADMIN_LOGOUT",
            details: "Admin logout",
            ip_address:
              request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
              request.headers.get("x-real-ip") ||
              "unknown",
            user_agent: request.headers.get("user-agent") || "",
          },
        });
      }
    }

    const response = NextResponse.json({
      success: true,
      message: "Logout berhasil",
    });

    response.cookies.delete("auth-token");

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    const response = NextResponse.json({
      success: true,
      message: "Logout berhasil",
    });

    response.cookies.delete("auth-token");

    return response;
  }
}