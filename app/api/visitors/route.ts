import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { visitorSchema } from "@/lib/validations";
import { generateRegisterNumber, sanitizeInput } from "@/lib/utils";
import { getUserFromCookie } from "@/lib/auth";

// GET - List visitors admin
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
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          register_number: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: search,
          },
        },
        {
          purpose: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (departmentId) {
      where.department_id = departmentId;
    }

    if (dateFrom || dateTo) {
      where.visit_date = {};

      if (dateFrom) {
        where.visit_date.gte = new Date(dateFrom);
      }

      if (dateTo) {
        where.visit_date.lte = new Date(`${dateTo}T23:59:59`);
      }
    }

    const [visitors, total] = await Promise.all([
      prisma.visitor.findMany({
        where,
        include: {
          departments: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          uploaded_files: {
            select: {
              id: true,
              original_name: true,
              file_type: true,
            },
          },
          _count: {
            select: {
              uploaded_files: true,
            },
          },
        },
        orderBy: {
          visit_date: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.visitor.count({
        where,
      }),
    ]);

    const mappedVisitors = visitors.map((visitor: any) => ({
      ...visitor,
      registerNumber: visitor.register_number,
      departmentId: visitor.department_id,
      visitDate: visitor.visit_date,
      checkoutTime: visitor.checkout_time,
      createdAt: visitor.created_at,
      updatedAt: visitor.updated_at,
      department: visitor.departments,
      uploadedFiles: visitor.uploaded_files,
    }));

    return NextResponse.json({
      data: mappedVisitors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get visitors error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST - Create visitor public
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = visitorSchema.safeParse(body);

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

    const sanitized = {
      name: sanitizeInput(data.name),
      address: sanitizeInput(data.address),
      phone: sanitizeInput(data.phone),
      purpose: sanitizeInput(data.purpose),
      department_id: data.departmentId,
      notes: data.notes ? sanitizeInput(data.notes) : undefined,
    };

    const department = await prisma.department.findUnique({
      where: {
        id: sanitized.department_id,
      },
    });

    if (!department || !department.is_active) {
      return NextResponse.json(
        { error: "Department tidak ditemukan atau tidak aktif" },
        { status: 400 }
      );
    }

    const registerNumber = await generateRegisterNumber(prisma);

    const visitor = await prisma.visitor.create({
      data: {
        ...sanitized,
        register_number: registerNumber,
        status: "REGISTERED",
        visit_date: new Date(),
      },
      include: {
        departments: true,
      },
    });

    await prisma.visitLog.create({
      data: {
        visitor_id: visitor.id,
        action: "VISITOR_REGISTERED",
        details: `Tamu baru: ${visitor.name} - ${registerNumber}`,
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

    return NextResponse.json(
      {
        success: true,
        message: "Registrasi berhasil",
        data: mappedVisitor,
        registerNumber,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create visitor error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}