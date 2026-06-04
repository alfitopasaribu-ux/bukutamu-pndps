import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { getBaliDayRange } from "@/lib/baliTime";

type ReportMode = "day" | "week" | "month" | "year";

const PTSP_CODES = [
  "PTSP_PID",
  "PTSP_PID_K",
  "PTSP_PER",
  "PTSP_PER_K",
  "PTSP_HK",
  "PTSP_UMUM",
  "PTSP_INFO",
  "PTSP_ECOURT",
  "PTSP_INZAGE",
];

function escapeCsv(value: unknown) {
  const text = String(value ?? "");

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function getMonthName(date: Date) {
  return format(date, "MMMM", { locale: localeId });
}

async function countByDepartment(start: Date, end: Date, departmentIds: string[]) {
  const result = await prisma.visitor.groupBy({
    by: ["department_id"],
    where: {
      department_id: {
        in: departmentIds,
      },
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
    result.map((item) => [item.department_id, item._count.department_id])
  );
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookie(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);

    const mode = (url.searchParams.get("mode") || "day") as ReportMode;

    const today = new Date();

    const selectedYear =
      Number(url.searchParams.get("year")) || today.getFullYear();

    const selectedMonth =
      Number(url.searchParams.get("month")) || today.getMonth() + 1;

    const selectedDate = new Date(selectedYear, selectedMonth - 1, 1);

    const departments = await prisma.department.findMany({
      where: {
        code: {
          in: PTSP_CODES,
        },
        is_active: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        order: true,
      },
      orderBy: {
        order: "asc",
      },
    });

    const departmentIds = departments.map((department) => department.id);

    const rows: Array<{
      jenis_laporan: string;
      periode: string;
      tanggal_awal: string;
      tanggal_akhir: string;
      bulan: string;
      tahun: number;
      kode_departemen: string;
      departemen: string;
      total_tamu: number;
    }> = [];

    // =========================
    // MODE DAY
    // Per hari dalam bulan terpilih
    // =========================
    if (mode === "day") {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);

      let current = new Date(monthStart);

      while (current <= monthEnd) {
        const { start, end } = getBaliDayRange(current);
        const countMap = await countByDepartment(start, end, departmentIds);

        for (const department of departments) {
          rows.push({
            jenis_laporan: "harian",
            periode: format(current, "EEEE", { locale: localeId }),
            tanggal_awal: format(current, "yyyy-MM-dd"),
            tanggal_akhir: format(current, "yyyy-MM-dd"),
            bulan: getMonthName(current),
            tahun: current.getFullYear(),
            kode_departemen: department.code,
            departemen: department.name,
            total_tamu: countMap[department.id] ?? 0,
          });
        }

        current = addDays(current, 1);
      }
    }

    // =========================
    // MODE WEEK
    // Per minggu dalam bulan terpilih
    // =========================
    if (mode === "week") {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);

      let current = new Date(monthStart);
      let weekNumber = 1;

      while (current <= monthEnd) {
        const weekStart = current;
        let weekEnd = endOfWeek(current, { weekStartsOn: 1 });

        if (weekEnd > monthEnd) {
          weekEnd = monthEnd;
        }

        const { start } = getBaliDayRange(weekStart);
        const { end } = getBaliDayRange(weekEnd);

        const countMap = await countByDepartment(start, end, departmentIds);

        for (const department of departments) {
          rows.push({
            jenis_laporan: "mingguan",
            periode: `Minggu ${weekNumber}`,
            tanggal_awal: format(weekStart, "yyyy-MM-dd"),
            tanggal_akhir: format(weekEnd, "yyyy-MM-dd"),
            bulan: getMonthName(weekStart),
            tahun: weekStart.getFullYear(),
            kode_departemen: department.code,
            departemen: department.name,
            total_tamu: countMap[department.id] ?? 0,
          });
        }

        current = addDays(weekEnd, 1);
        weekNumber++;
      }
    }

    // =========================
    // MODE MONTH
    // Per bulan dalam tahun terpilih
    // =========================
    if (mode === "month") {
      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const monthDate = new Date(selectedYear, monthIndex, 1);

        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const { start } = getBaliDayRange(monthStart);
        const { end } = getBaliDayRange(monthEnd);

        const countMap = await countByDepartment(start, end, departmentIds);

        for (const department of departments) {
          rows.push({
            jenis_laporan: "bulanan",
            periode: format(monthDate, "MMMM yyyy", { locale: localeId }),
            tanggal_awal: format(monthStart, "yyyy-MM-dd"),
            tanggal_akhir: format(monthEnd, "yyyy-MM-dd"),
            bulan: getMonthName(monthDate),
            tahun: selectedYear,
            kode_departemen: department.code,
            departemen: department.name,
            total_tamu: countMap[department.id] ?? 0,
          });
        }
      }
    }

    // =========================
    // MODE YEAR
    // Total satu tahun terpilih
    // =========================
    if (mode === "year") {
      const yearDate = new Date(selectedYear, 0, 1);

      const yearStart = startOfYear(yearDate);
      const yearEnd = endOfYear(yearDate);

      const { start } = getBaliDayRange(yearStart);
      const { end } = getBaliDayRange(yearEnd);

      const countMap = await countByDepartment(start, end, departmentIds);

      for (const department of departments) {
        rows.push({
          jenis_laporan: "tahunan",
          periode: `Tahun ${selectedYear}`,
          tanggal_awal: format(yearStart, "yyyy-MM-dd"),
          tanggal_akhir: format(yearEnd, "yyyy-MM-dd"),
          bulan: "Semua Bulan",
          tahun: selectedYear,
          kode_departemen: department.code,
          departemen: department.name,
          total_tamu: countMap[department.id] ?? 0,
        });
      }
    }

    const header = [
      "jenis_laporan",
      "periode",
      "tanggal_awal",
      "tanggal_akhir",
      "bulan",
      "tahun",
      "kode_departemen",
      "departemen",
      "total_tamu",
    ];

    const csv =
      "\uFEFF" +
      header.map(escapeCsv).join(",") +
      "\n" +
      rows
        .map((row) =>
          header
            .map((key) => escapeCsv(row[key as keyof typeof row]))
            .join(",")
        )
        .join("\n");

    const label =
      mode === "day"
        ? "harian"
        : mode === "week"
        ? "mingguan"
        : mode === "month"
        ? "bulanan"
        : "tahunan";

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="laporan-ptsp-${label}-${selectedYear}-${String(
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