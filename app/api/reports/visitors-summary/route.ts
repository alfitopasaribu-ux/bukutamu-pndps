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

type Mode = "week" | "month" | "year";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

async function getDepartmentCounts(start: Date, end: Date) {
  const result = await prisma.visitor.groupBy({
    by: ["department_id"],
    where: {
      visit_date: {
        gte: start,
        lte: end,
      },
    },
    _count: {
      department_id: true,
    },
  });

  return Object.fromEntries(
    result.map((item) => [
      item.department_id,
      item._count.department_id,
    ])
  );
}

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

    const url = new URL(request.url);

    const mode = (url.searchParams.get("mode") || "week") as Mode;

    const today = new Date();

    const selectedYear = Number(url.searchParams.get("year")) || today.getFullYear();
    const selectedMonth =
      Number(url.searchParams.get("month")) || today.getMonth() + 1;

    const selectedDate = new Date(selectedYear, selectedMonth - 1, 1);

    const departments = await prisma.department.findMany({
      where: {
        is_active: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        order: "asc",
      },
    });

    const rows: Array<Record<string, string | number>> = [];

    if (mode === "week") {
      const weekStart = startOfWeek(
        selectedYear === today.getFullYear() &&
          selectedMonth === today.getMonth() + 1
          ? today
          : selectedDate,
        { weekStartsOn: 1 }
      );

      const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

      for (const day of days) {
        const { start, end } = getBaliDayRange(day);

        const total = await countVisitorsBetween(start, end);
        const departmentCounts = await getDepartmentCounts(start, end);

        const row: Record<string, string | number> = {
          periode: format(day, "EEEE", { locale: localeId }),
          tanggal_awal: format(day, "yyyy-MM-dd"),
          tanggal_akhir: format(day, "yyyy-MM-dd"),
          total_tamu: total,
        };

        departments.forEach((department) => {
          row[department.name] = departmentCounts[department.id] ?? 0;
        });

        rows.push(row);
      }
    }

    if (mode === "month") {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);

      const weeks: Array<{
        label: string;
        startDate: Date;
        endDate: Date;
      }> = [];

      let current = new Date(monthStart);
      let weekNumber = 1;

      while (current <= monthEnd) {
        const startDate = new Date(current);
        const endDate = new Date(current);

        while (endDate < monthEnd && getDay(endDate) !== 0) {
          endDate.setDate(endDate.getDate() + 1);
        }

        weeks.push({
          label: `Minggu ${weekNumber}`,
          startDate,
          endDate,
        });

        current = addDays(endDate, 1);
        weekNumber++;
      }

      for (const week of weeks) {
        const { start } = getBaliDayRange(week.startDate);
        const { end } = getBaliDayRange(week.endDate);

        const total = await countVisitorsBetween(start, end);
        const departmentCounts = await getDepartmentCounts(start, end);

        const row: Record<string, string | number> = {
          periode: week.label,
          tanggal_awal: format(week.startDate, "yyyy-MM-dd"),
          tanggal_akhir: format(week.endDate, "yyyy-MM-dd"),
          total_tamu: total,
        };

        departments.forEach((department) => {
          row[department.name] = departmentCounts[department.id] ?? 0;
        });

        rows.push(row);
      }
    }

    if (mode === "year") {
      const yearStart = startOfYear(new Date(selectedYear, 0, 1));
      const yearEnd = endOfYear(yearStart);

      const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(selectedYear, i, 1);

        return {
          label: format(date, "MMMM yyyy", { locale: localeId }),
          startDate: startOfMonth(date),
          endDate: endOfMonth(date),
        };
      });

      for (const month of months) {
        const { start } = getBaliDayRange(month.startDate);
        const { end } = getBaliDayRange(month.endDate);

        const total = await countVisitorsBetween(start, end);
        const departmentCounts = await getDepartmentCounts(start, end);

        const row: Record<string, string | number> = {
          periode: month.label,
          tanggal_awal: format(month.startDate, "yyyy-MM-dd"),
          tanggal_akhir: format(month.endDate, "yyyy-MM-dd"),
          total_tamu: total,
        };

        departments.forEach((department) => {
          row[department.name] = departmentCounts[department.id] ?? 0;
        });

        rows.push(row);
      }
    }

    const header = [
      "periode",
      "tanggal_awal",
      "tanggal_akhir",
      "total_tamu",
      ...departments.map((department) => department.name),
    ];

    const csv =
      "\uFEFF" +
      header.map(escapeCsv).join(",") +
      "\n" +
      rows
        .map((row) =>
          header.map((key) => escapeCsv(row[key] ?? 0)).join(",")
        )
        .join("\n");

    const fileLabel =
      mode === "week"
        ? "mingguan"
        : mode === "month"
        ? "bulanan"
        : "tahunan";

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="laporan-tamu-${fileLabel}-${selectedYear}-${String(
          selectedMonth
        ).padStart(2, "0")}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export visitors summary error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}