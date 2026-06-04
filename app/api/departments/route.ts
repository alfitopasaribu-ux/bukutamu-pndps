import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    // Ambil semua department (termasuk isActive=false) supaya dropdown tidak kosong.
    // Saat submit visitor, backend sudah memvalidasi isActive.
    const all = await prisma.department.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        code: true,
        name: true,


        order: true,
      },
    });

    const map = new Map(all.map((d) => [d.id, d]));

    const withLevel = all.map((d) => {
      // Karena sebagian database yang terhubung tidak menyediakan kolom parent,
      // kita fallback: anggap semua sebagai level 0.
      return { ...d, level: 0 };
    });


    // Urutkan konsisten: level lalu order
    const sorted = withLevel.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return (a.order ?? 0) - (b.order ?? 0);
    });

    return NextResponse.json({ data: sorted });
  } catch (error) {
    console.error("GET /api/departments error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

