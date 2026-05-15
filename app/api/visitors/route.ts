import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { visitorSchema } from "@/lib/validations";
import { generateRegisterNumber, sanitizeInput } from "@/lib/utils";
import { getUserFromCookie } from "@/lib/auth";



// GET - List visitors (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookie(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const departmentId = searchParams.get("departmentId") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { registerNumber: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { purpose: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;

    if (dateFrom || dateTo) {
      where.visitDate = {};
      if (dateFrom) where.visitDate.gte = new Date(dateFrom);
      if (dateTo) where.visitDate.lte = new Date(dateTo + "T23:59:59");
    }

    const [visitors, total] = await Promise.all([
      prisma.visitor.findMany({
        where,
        include: {
          department: { select: { id: true, name: true, code: true } },
          uploadedFiles: { select: { id: true, originalName: true, fileType: true } },
          _count: { select: { uploadedFiles: true } },
        },
        orderBy: { visitDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.visitor.count({ where }),
    ]);

    return NextResponse.json({
      data: visitors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get visitors error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST - Create visitor (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = visitorSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation Error", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Sanitize inputs
    const sanitized = {
      name: sanitizeInput(data.name),
      address: sanitizeInput(data.address),
      phone: sanitizeInput(data.phone),
      purpose: sanitizeInput(data.purpose),
      departmentId: data.departmentId,
      notes: data.notes ? sanitizeInput(data.notes) : undefined,
    };

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: sanitized.departmentId },
    });

    if (!department || !department.isActive) {
      return NextResponse.json(
        { error: "Department tidak ditemukan atau tidak aktif" },
        { status: 400 }
      );
    }

    // Generate register number
    const registerNumber = await generateRegisterNumber(prisma);

    // Create visitor
    const visitor = await prisma.visitor.create({
      data: {
        ...sanitized,
        registerNumber,
        status: "REGISTERED",
        visitDate: new Date(),
      },
      include: {
        department: true,
      },
    });

    // Log activity
    await prisma.visitLog.create({
      data: {
        visitorId: visitor.id,
        action: "VISITOR_REGISTERED",
        details: `Tamu baru: ${visitor.name} - ${registerNumber}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registrasi berhasil",
        data: visitor,
        registerNumber,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create visitor error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}