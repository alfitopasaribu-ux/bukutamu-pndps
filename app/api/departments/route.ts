import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
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

    return NextResponse.json({
      success: true,
      data: departments.map((department) => ({
        id: department.id,
        code: department.code,
        name: department.name,
        description: department.description,
        parentId: department.parent_id,
        order: department.order,
        isActive: department.is_active,
      })),
    });
  } catch (error) {
    console.error("Get departments error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Gagal memuat data tujuan/bagian",
      },
      { status: 500 }
    );
  }
}