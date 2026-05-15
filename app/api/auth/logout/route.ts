import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromCookie(request);


    if (user) {
      await prisma.visitLog.create({
        data: {
          userId: user.userId,
          action: "ADMIN_LOGOUT",
          details: "Admin logout",
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        },
      });
    }

    const response = NextResponse.json({ success: true, message: "Logout berhasil" });
    response.cookies.delete("auth-token");
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    const response = NextResponse.json({ success: true });
    response.cookies.delete("auth-token");
    return response;
  }
}