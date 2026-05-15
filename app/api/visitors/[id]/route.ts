import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { visitorSchema } from "@/lib/validations";
import { getUserFromCookie } from "@/lib/auth";



type ParamsPromise = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: ParamsPromise }
) {
  const { id } = await params;

  try {
    const user = await getUserFromCookie(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


    const visitor = await prisma.visitor.findUnique({
      where: { id },

      include: {
        department: true,
        uploadedFiles: true,
        visitLogs: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!visitor) {
      return NextResponse.json({ error: "Visitor tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data: visitor });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: ParamsPromise }
) {

  try {
    const user = await getUserFromCookie(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    const validation = visitorSchema.partial().safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Validation Error" }, { status: 400 });
    }

    const { id } = await params;

    const visitor = await prisma.visitor.update({
      where: { id },
      data: {
        ...validation.data,
        ...(body.status && { status: body.status }),
        ...(body.status === "CHECKED_OUT" && { checkoutTime: new Date() }),
      },
      include: { department: true },
    });

    await prisma.visitLog.create({
      data: {
        visitorId: visitor.id,
        userId: user.userId,
        action: "VISITOR_UPDATED",
        details: `Data tamu diupdate oleh ${user.name}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ success: true, data: visitor });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: ParamsPromise }
) {
  const { id } = await params;

  try {

    const user = await getUserFromCookie(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Hanya SUPER_ADMIN yang bisa delete

    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

const visitor = await prisma.visitor.findUnique({
      where: { id },
      select: { id: true, name: true, registerNumber: true },
    });

    if (!visitor) {
      return NextResponse.json({ error: "Visitor tidak ditemukan" }, { status: 404 });
    }

    await prisma.visitLog.create({
      data: {
        userId: user.userId,
        action: "VISITOR_DELETED",
        details: `Tamu dihapus: ${visitor.name} (${visitor.registerNumber}) oleh ${user.name}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    await prisma.visitor.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Tamu berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}