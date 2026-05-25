import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import { parseISO, format } from "date-fns";
import { getBaliDayRange } from "@/lib/baliTime";

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

    const tzOffsetMinutes = parseInt(url.searchParams.get("tzOffsetMinutes") || "480", 10);

    // Timezone fleksibel: gunakan offset sesuai user/opsi query.
    // Default 480 menit (UTC+8 / WITA).
    const from = getBaliDayRange(dateFrom, tzOffsetMinutes).start;
    const to = getBaliDayRange(dateTo, tzOffsetMinutes).end;


    // Ambil data agregat: departmentId + tanggal (per hari)
    // Prisma tidak support groupBy tanggal langsung, jadi: tarik per day dengan generate range di DB via count parallel.
    const days: Date[] = [];
    {
      const d = new Date(from);
      while (d.getTime() <= to.getTime()) {
        days.push(new Date(d));
        d.setDate(d.getDate() + 1);
      }
    }

    const deptIdsRes = await prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { order: "asc" },
    });

    const deptMap = Object.fromEntries(deptIdsRes.map((d) => [d.id, d.name]));

    // Buat semua kombinasi day x department (agar tabel siap untuk Excel)
    const rows = await Promise.all(
      days.map(async (day) => {
        const { start, end } = getBaliDayRange(day);

        const countsByDept = await prisma.visitor.groupBy({
          by: ["departmentId"],
          where: {
            entrySource: "PUBLIC_FORM", // default: sesuai buku tamu daftar (public form)

            visitDate: { gte: start, lte: end },
          },
          _count: { departmentId: true },
        });

        const countMap = Object.fromEntries(
          countsByDept.map((r) => [r.departmentId, r._count.departmentId])
        );

        return deptIdsRes.map((d) => ({
          date: format(day, "yyyy-MM-dd"),

          departmentId: d.id,
          departmentName: d.name,
          count: countMap[d.id] ?? 0,
        }));
      })
    );

    const flat = rows.flat();


    // CSV output (Excel friendly)
    const header = ["date", "departmentId", "departmentName", "count"];
    const escapeCsv = (v: any) => {
      const s = String(v ?? "");
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const csv =
      header.join(",") +
      "\n" +
      flat
        .map((r) => [r.date, r.departmentId, r.departmentName, r.count].map(escapeCsv).join(","))
        .join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="buku-tamu-public-by-department-day_${format(from, "yyyy-MM-dd")}_to_${format(to, "yyyy-MM-dd")}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
