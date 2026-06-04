import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  format,
  startOfDay,
  endOfDay,
  subDays,
} from "date-fns";
import { getBaliDayRange } from "@/lib/baliTime";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookie(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      yearVisitors,
      activeVisitors,
      byStatus,
      byDepartment,
      recentLogs,
      last30DaysRaw,
      last12MonthsRaw,
    ] = await Promise.all([
      prisma.visitor.count(),

      prisma.visitor.count({
        where: {
          visit_date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),

      prisma.visitor.count({
        where: {
          visit_date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),

      prisma.visitor.count({
        where: {
          visit_date: {
            gte: yearStart,
            lte: yearEnd,
          },
        },
      }),

      prisma.visitor.count({
        where: {
          status: {
            in: ["REGISTERED", "CHECKED_IN", "IN_PROGRESS"],
          },
        },
      }),

      prisma.visitor.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      }),

      prisma.visitor.groupBy({
        by: ["department_id"],
        _count: {
          department_id: true,
        },
        orderBy: {
          _count: {
            department_id: "desc",
          },
        },
        take: 6,
      }),

      prisma.visitLog.findMany({
        take: 10,
        orderBy: {
          created_at: "desc",
        },
        include: {
          visitors: {
            select: {
              name: true,
              register_number: true,
            },
          },
          users: {
            select: {
              name: true,
            },
          },
        },
      }),

      Promise.all(
        Array.from({ length: 30 }, (_, i) => {
          const date = subDays(today, 29 - i);
          const { start, end } = getBaliDayRange(date);

          return prisma.visitor
            .count({
              where: {
                visit_date: {
                  gte: start,
                  lte: end,
                },
              },
            })
            .then((count) => ({
              date: format(date, "yyyy-MM-dd"),
              count,
            }));
        })
      ),

      Promise.all(
        Array.from({ length: 12 }, (_, i) => {
          const month = subMonths(today, 11 - i);
          const start = startOfMonth(month);
          const end = endOfMonth(month);

          return prisma.visitor
            .count({
              where: {
                visit_date: {
                  gte: start,
                  lte: end,
                },
              },
            })
            .then((count) => ({
              month: format(month, "yyyy-MM"),
              label: format(month, "MMM yyyy"),
              count,
            }));
        })
      ),
    ]);

    const weeksInMonth = 4;
    const avgPerWeek = Math.round(monthVisitors / weeksInMonth);

    const deptIds = byDepartment
      .map((item) => item.department_id)
      .filter(Boolean);

    const departments = await prisma.department.findMany({
      where: {
        id: {
          in: deptIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const departmentMap = Object.fromEntries(
      departments.map((department) => [department.id, department.name])
    );

    const mappedRecentLogs = recentLogs.map((log) => ({
      ...log,
      visitorId: log.visitor_id,
      userId: log.user_id,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      createdAt: log.created_at,
      visitor: log.visitors
        ? {
            name: log.visitors.name,
            registerNumber: log.visitors.register_number,
          }
        : null,
      user: log.users
        ? {
            name: log.users.name,
          }
        : null,
    }));

    return NextResponse.json({
      stats: {
        totalVisitors,
        todayVisitors,
        monthVisitors,
        yearVisitors,
        activeVisitors,
        avgPerWeek,
      },

      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count.status,
      })),

      byDepartment: byDepartment.map((item) => ({
        departmentId: item.department_id,
        name: departmentMap[item.department_id] || "Unknown",
        count: item._count.department_id,
      })),

      recentLogs: mappedRecentLogs,
      last30Days: last30DaysRaw,
      last12Months: last12MonthsRaw,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}