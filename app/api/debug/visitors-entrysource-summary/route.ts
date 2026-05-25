import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import { parseISO, startOfDay, endOfDay, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookie(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const dateFromRaw = url.searchParams.get("dateFrom") || "";
    const dateToRaw = url.searchParams.get("dateTo") || "";

    const today = new Date();
    const defaultFrom = new Date(today);
    defaultFrom.setDate(defaultFrom.getDate() - 29);

    const dateFrom = dateFromRaw ? parseISO(dateFromRaw) : defaultFrom;
    const dateTo = dateToRaw ? parseISO(dateToRaw) : today;

    const from = startOfDay(dateFrom);
    const to = endOfDay(dateTo);

    // Range hari untuk ditampilkan
    const days: Date[] = [];
    {
      const d = new Date(from);
      while (d.getTime() <= to.getTime()) {
        days.push(new Date(d));
        d.setDate(d.getDate() + 1);
      }
    }

    // Ambil ringkasan per entrySource per hari (gunakan count dengan groupBy departmentDate tidak perlu)
    const rows = await Promise.all(
      days.map(async (day) => {
        const start = startOfDay(day);
        const end = endOfDay(day);

        const counts = await prisma.visitor.groupBy({
          // Prisma type-safe groupBy membatasi `by` ke field enum yang benar.
          // Agar tidak tergantung typing Prisma versi tertentu, gunakan casting.
          by: ["entrySource"] as any,
          where: {
            visitDate: { gte: start, lte: end },
          },
          _count: { id: true },
        } as any);

        // Prisma groupBy output untuk enum biasanya berupa properti:
        // - untuk item groupBy: field itu langsung ada di output (entrySource)
        // - untuk agregasi: _count berisi count
        const map: Record<string, number> = {};
        for (const r of counts as any[]) {
          const key = String((r as any).entrySource ?? "");
          const countId = (r as any)._count?.id ?? 0;
          map[key] = countId;
        }



        return {
          date: format(day, "yyyy-MM-dd"),
          PUBLIC_FORM: map["PUBLIC_FORM"] ?? 0,
          ADMIN_FORM: map["ADMIN_FORM"] ?? 0,
          TOTAL: (map["PUBLIC_FORM"] ?? 0) + (map["ADMIN_FORM"] ?? 0),
        };
      })
    );

    return NextResponse.json({
      ok: true,
      dateFrom: format(from, "yyyy-MM-dd"),
      dateTo: format(to, "yyyy-MM-dd"),
      rows,
    });
  } catch (error) {
    console.error("Debug entrySource summary error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

