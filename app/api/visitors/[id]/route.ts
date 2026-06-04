import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { visitorSchema } from "@/lib/validations";
import { getUserFromCookie } from "@/lib/auth";

type ParamsPromise = Promise<{ id: string }>;

function formatVisitor(visitor: any) {
  return {
    id: visitor.id,
    registerNumber: visitor.register_number,
    name: visitor.name,
    address: visitor.address,
    phone: visitor.phone,
    purpose: visitor.purpose,
    status: visitor.status,
    notes: visitor.notes,
    visitDate: visitor.visit_date,
    checkoutTime: visitor.checkout_time,
    createdAt: visitor.created_at,
    updatedAt: visitor.updated_at,
    department: visitor.departments
      ? {
          id: visitor.departments.id,
          code: visitor.departments.code,
          name: visitor.departments.name,
        }
      : null,
    uploadedFiles: (visitor.uploaded_files ?? []).map((file: any) => ({
      id: file.id,
      originalName: file.original_name,
      storedName: file.stored_name,
      filePath: file.file_path,
      fileType: file.file_type,
      fileSize: file.file_size,
      mimeType: file.mime_type,
      uploadedAt: file.uploaded_at,
    })),
    visitLogs: (visitor.visit_logs ?? []).map((log: any) => ({
      id: log.id,
      action: log.action,
      details: log.details,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      createdAt: log.created_at,
    })),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: ParamsPromise }
) {
  try {
    const user = await getUserFromCookie(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const visitor = await prisma.visitor.findUnique({
      where: {
        id,
      },
      include: {
        departments: true,
        uploaded_files: {
          orderBy: {
            uploaded_at: "desc",
          },
        },
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

    return NextResponse.json({
      data: formatVisitor(visitor),
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

    const { id } = await params;
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

    const data = validation.data;

    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.address) updateData.address = data.address;
    if (data.phone) updateData.phone = data.phone;
    if (data.purpose) updateData.purpose = data.purpose;
    if (data.departmentId) updateData.department_id = data.departmentId;
    if (typeof data.notes !== "undefined") updateData.notes = data.notes;

    if (body.status) {
      updateData.status = body.status;

      if (body.status === "CHECKED_OUT") {
        updateData.checkout_time = new Date();
      }
    }

    updateData.updated_at = new Date();

    const visitor = await prisma.visitor.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        departments: true,
        uploaded_files: true,
      },
    });

    await prisma.visitLog.create({
      data: {
        visitor_id: visitor.id,
        user_id: user.userId,
        action: "VISITOR_UPDATED",
        details: `Data tamu diupdate oleh ${user.name}`,
        ip_address:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        user_agent: request.headers.get("user-agent") || "",
      },
    });

    return NextResponse.json({
      success: true,
      data: formatVisitor(visitor),
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
  try {
    const user = await getUserFromCookie(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

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
          request.headers.get("x-forwarded-for") ||
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