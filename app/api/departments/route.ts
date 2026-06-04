import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    const departments = await prisma.department.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        parent_id: true,
        order: true,
        is_active: true,
      },
    });

    const formattedDepartments = departments.map((department) => ({
      id: department.id,
      code: department.code,
      name: department.name,
      description: department.description,
      parentId: department.parent_id,
      order: department.order,
      isActive: department.is_active,
    }));

    return NextResponse.json({
      data: formattedDepartments,
    });
  } catch (error) {
    console.error("GET /api/departments error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}