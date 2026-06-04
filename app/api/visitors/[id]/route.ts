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

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const visitor = await prisma.visitor.findUnique({
      where: {
        id,
      },
      include: {
        departments: true,
        uploaded_files: true,
        visit_logs: {
          orderBy: {
            created_at: "desc",
          },
          take: 20,
        },
      },
    });

    if (!visitor) {
      return NextResponse.json(
        { error: "Visitor tidak ditemukan" },
        { status: 404 }
      );
    }

    const mappedVisitor = {
      ...visitor,
      registerNumber: visitor.register_number,
      departmentId: visitor.department_id,
      visitDate: visitor.visit_date,
      checkoutTime: visitor.checkout_time,
      createdAt: visitor.created_at,
      updatedAt: visitor.updated_at,
      department: visitor.departments,
      uploadedFiles: visitor.uploaded_files,
      visitLogs: visitor.visit_logs,
    };

    return NextResponse.json({
      data: mappedVisitor,
    });
  } catch (error) {
    console.error("Get visitor detail error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: ParamsPromise }
) {
  try {
    const user = await getUserFromCookie(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const validation = visitorSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation Error",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { id } = await params;

    const data = validation.data;

    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.purpose !== undefined) updateData.purpose = data.purpose;
    if (data.departmentId !== undefined) updateData.department_id = data.departmentId;
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (body.status) {
      updateData.status = body.status;
    }

    if (body.status === "CHECKED_OUT") {
      updateData.checkout_time = new Date();
    }

    const visitor = await prisma.visitor.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        departments: true,
      },
    });

    await prisma.visitLog.create({
      data: {
        visitor_id: visitor.id,
        user_id: user.userId,
        action: "VISITOR_UPDATED",
        details: `Data tamu diupdate oleh ${user.name}`,
        ip_address:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          "unknown",
        user_agent: request.headers.get("user-agent") || "",
      },
    });

    const mappedVisitor = {
      ...visitor,
      registerNumber: visitor.register_number,
      departmentId: visitor.department_id,
      visitDate: visitor.visit_date,
      checkoutTime: visitor.checkout_time,
      createdAt: visitor.created_at,
      updatedAt: visitor.updated_at,
      department: visitor.departments,
    };

    return NextResponse.json({
      success: true,
      data: mappedVisitor,
    });
  } catch (error) {
    console.error("Update visitor error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: ParamsPromise }
) {
  const { id } = await params;

  try {
    const user = await getUserFromCookie(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const visitor = await prisma.visitor.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        register_number: true,
      },
    });

    if (!visitor) {
      return NextResponse.json(
        { error: "Visitor tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.visitLog.create({
      data: {
        user_id: user.userId,
        action: "VISITOR_DELETED",
        details: `Tamu dihapus: ${visitor.name} (${visitor.register_number}) oleh ${user.name}`,
        ip_address:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          "unknown",
        user_agent: request.headers.get("user-agent") || "",
      },
    });

    await prisma.visitor.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tamu berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete visitor error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}