import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    // Ambil semua department terurut by "order"
    const all = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        parentId: true,
        order: true,
      },
    });

    // Build map untuk cari parent
    const map = new Map(all.map((d) => [d.id, d]));

    // Tentukan level tiap item (0 = root, 1 = child, 2 = grandchild)
    const withLevel = all.map((d) => {
      if (!d.parentId) return { ...d, level: 0 };
      const parent = map.get(d.parentId);
      if (!parent?.parentId) return { ...d, level: 1 };
      return { ...d, level: 2 };
    });

    return NextResponse.json({ data: withLevel });
  } catch (error) {
    console.error("GET /api/departments error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
