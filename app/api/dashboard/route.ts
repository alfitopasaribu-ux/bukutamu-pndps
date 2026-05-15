import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";


import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subMonths,
  format,
} from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookie(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const yearStart = startOfYear(today);
    const yearEnd = endOfYear(today);

    const [
      totalVisitors,
      todayVisitors,
      monthVisitors,
      activeVisitors,
      byStatus,
      byDepartment,
      recentLogs,
      last30DaysRaw,
      last12MonthsRaw,
    ] = await Promise.all([
      prisma.visitor.count(),
      prisma.visitor.count({
        where: { visitDate: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.visitor.count({
        where: { visitDate: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.visitor.count({
        where: {
          status: { in: ["REGISTERED", "CHECKED_IN", "IN_PROGRESS"] },
        },
      }),
      prisma.visitor.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.visitor.groupBy({
        by: ["departmentId"],
        _count: { departmentId: true },
        orderBy: { _count: { departmentId: "desc" } },
        take: 6,
      }),
      prisma.visitLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          visitor: { select: { name: true, registerNumber: true } },
          user: { select: { name: true } },
        },
      }),
      // 30 hari terakhir (per hari)
      Promise.all(
        Array.from({ length: 30 }, (_, i) => {
          const date = subDays(today, 29 - i);
          const start = startOfDay(date);
          const end = endOfDay(date);
          return prisma.visitor
            .count({ where: { visitDate: { gte: start, lte: end } } })
            .then((count) => ({
              date: format(date, "yyyy-MM-dd"),
              count,
            }));
        })
      ),
      // 12 bulan terakhir (per bulan)
      Promise.all(
        Array.from({ length: 12 }, (_, i) => {
          const m = subMonths(today, 11 - i);
          const start = startOfMonth(m);
          const end = endOfMonth(m);
          return prisma.visitor
            .count({ where: { visitDate: { gte: start, lte: end } } })
            .then((count) => ({
              month: format(m, "yyyy-MM"),
              label: format(m, "MMM yyyy"),
              count,
            }));
        })
      ),
    ]);

    // rata-rata per minggu (perkiraan, bulan ini / 4)
    const weeksInMonth = 4;
    const avgPerWeek = Math.round(monthVisitors / weeksInMonth);

    // Fetch nama department
    const deptIds = byDepartment.map((d) => d.departmentId);
    const depts = await prisma.department.findMany({
      where: { id: { in: deptIds } },
      select: { id: true, name: true },
    });
    const deptMap = Object.fromEntries(depts.map((d) => [d.id, d.name]));

    return NextResponse.json({
      stats: {
        totalVisitors,
        todayVisitors,
        monthVisitors,
        activeVisitors,
        avgPerWeek,
      },
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      byDepartment: byDepartment.map((d) => ({
        departmentId: d.departmentId,
        name: deptMap[d.departmentId] || "Unknown",
        count: d._count.departmentId,
      })),
      recentLogs,
      last30Days: last30DaysRaw,
      last12Months: last12MonthsRaw,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

