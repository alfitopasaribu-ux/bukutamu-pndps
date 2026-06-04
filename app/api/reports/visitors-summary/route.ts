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

    let rows: Array<{
      periode: string;
      tanggal_awal: string;
      tanggal_akhir: string;
      total_tamu: number;
    }> = [];

    if (mode === "week") {
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

      rows = await Promise.all(
        days.map(async (day) => {
          const { start, end } = getBaliDayRange(day);
          const count = await countVisitorsBetween(start, end);

          return {
            periode: format(day, "EEEE", { locale: localeId }),
            tanggal_awal: format(day, "yyyy-MM-dd"),
            tanggal_akhir: format(day, "yyyy-MM-dd"),
            total_tamu: count,
          };
        })
      );
    }

    if (mode === "month") {
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);

      const weeks: Array<{
        label: string;
        startDate: Date;
        endDate: Date;
      }> = [];

      let current = new Date(monthStart);
      let weekNumber = 1;

      while (current <= monthEnd) {
        const start = new Date(current);
        const end = new Date(current);

        while (end < monthEnd && getDay(end) !== 0) {
          end.setDate(end.getDate() + 1);
        }

        weeks.push({
          label: `Minggu ${weekNumber}`,
          startDate: start,
          endDate: end,
        });

        current = addDays(end, 1);
        weekNumber++;
      }

      rows = await Promise.all(
        weeks.map(async (week) => {
          const { start } = getBaliDayRange(week.startDate);
          const { end } = getBaliDayRange(week.endDate);
          const count = await countVisitorsBetween(start, end);

          return {
            periode: week.label,
            tanggal_awal: format(week.startDate, "yyyy-MM-dd"),
            tanggal_akhir: format(week.endDate, "yyyy-MM-dd"),
            total_tamu: count,
          };
        })
      );
    }

    if (mode === "year") {
      const yearStart = startOfYear(today);

      rows = await Promise.all(
        Array.from({ length: 12 }, async (_, i) => {
          const month = new Date(yearStart.getFullYear(), i, 1);
          const startMonth = startOfMonth(month);
          const endMonth = endOfMonth(month);

          const { start } = getBaliDayRange(startMonth);
          const { end } = getBaliDayRange(endMonth);
          const count = await countVisitorsBetween(start, end);

          return {
            periode: format(month, "MMMM yyyy", { locale: localeId }),
            tanggal_awal: format(startMonth, "yyyy-MM-dd"),
            tanggal_akhir: format(endMonth, "yyyy-MM-dd"),
            total_tamu: count,
          };
        })
      );
    }

    const header = ["periode", "tanggal_awal", "tanggal_akhir", "total_tamu"];

    const csv =
      header.join(",") +
      "\n" +
      rows
        .map((row) =>
          [row.periode, row.tanggal_awal, row.tanggal_akhir, row.total_tamu]
            .map(escapeCsv)
            .join(",")
        )
        .join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="laporan-tamu-${mode}_${format(
          today,
          "yyyy-MM-dd"
        )}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export visitors summary error:", error);

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

