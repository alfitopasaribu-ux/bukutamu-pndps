import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import {
  addDays,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  endOfYear,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { getBaliDayRange } from "@/lib/baliTime";

async function countVisitorsBetween(start: Date, end: Date) {
  return prisma.visitor.count({
    where: {
      visit_date: {
        gte: start,
        lte: end,
      },
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookie(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();

    const { start: todayStart, end: todayEnd } = getBaliDayRange(today);
    const monthStartDate = startOfMonth(today);
    const monthEndDate = endOfMonth(today);
    const { start: monthStart } = getBaliDayRange(monthStartDate);
    const { end: monthEnd } = getBaliDayRange(monthEndDate);

    const yearStartDate = startOfYear(today);
    const yearEndDate = endOfYear(today);
    const { start: yearStart } = getBaliDayRange(yearStartDate);
    const { end: yearEnd } = getBaliDayRange(yearEndDate);

    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

    const monthWeeks: Array<{
      label: string;
      startDate: Date;
      endDate: Date;
    }> = [];

    let current = new Date(monthStartDate);
    let weekNumber = 1;

    while (current <= monthEndDate) {
      const start = new Date(current);
      const end = new Date(current);

      while (end < monthEndDate && getDay(end) !== 0) {
        end.setDate(end.getDate() + 1);
      }

      monthWeeks.push({
        label: `Minggu ${weekNumber}`,
        startDate: start,
        endDate: end,
      });

      current = addDays(end, 1);
      weekNumber++;
    }

    const yearMonths = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(today.getFullYear(), i, 1);
      return {
        month: format(date, "yyyy-MM"),
        label: format(date, "MMM", { locale: localeId }),
        startDate: startOfMonth(date),
        endDate: endOfMonth(date),
      };
    });

    const [
      totalVisitors,
      todayVisitors,
      monthVisitors,
      yearVisitors,
      activeVisitors,
      byStatus,
      byDepartment,
      recentLogs,
      weeklyChart,
      monthlyChart,
      yearlyChart,
    ] = await Promise.all([
      prisma.visitor.count(),

      countVisitorsBetween(todayStart, todayEnd),

      countVisitorsBetween(monthStart, monthEnd),

      countVisitorsBetween(yearStart, yearEnd),

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
        weekDays.map(async (day) => {
          const { start, end } = getBaliDayRange(day);
          const count = await countVisitorsBetween(start, end);

          return {
            date: format(day, "yyyy-MM-dd"),
            label: format(day, "EEEE", { locale: localeId }),
            count,
          };
        })
      ),

      Promise.all(
        monthWeeks.map(async (week) => {
          const { start } = getBaliDayRange(week.startDate);
          const { end } = getBaliDayRange(week.endDate);
          const count = await countVisitorsBetween(start, end);

          return {
            label: week.label,
            startDate: format(week.startDate, "yyyy-MM-dd"),
            endDate: format(week.endDate, "yyyy-MM-dd"),
            count,
          };
        })
      ),

      Promise.all(
        yearMonths.map(async (month) => {
          const { start } = getBaliDayRange(month.startDate);
          const { end } = getBaliDayRange(month.endDate);
          const count = await countVisitorsBetween(start, end);

          return {
            month: month.month,
            label: month.label,
            count,
          };
        })
      ),
    ]);

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
      id: log.id,
      action: log.action,
      details: log.details,
      createdAt: log.created_at,
      visitorId: log.visitor_id,
      userId: log.user_id,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
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

    const avgPerWeek = Math.round(monthVisitors / 4);

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

      charts: {
        week: weeklyChart,
        month: monthlyChart,
        year: yearlyChart,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}