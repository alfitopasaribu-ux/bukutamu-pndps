import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import {
  addDays,
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
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

function getWeekRangeInMonth(year: number, month: number, weekNumber: number) {
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);

  const startDate = addDays(monthStart, (weekNumber - 1) * 7);
  let endDate = addDays(startDate, 6);

  if (endDate > monthEnd) {
    endDate = monthEnd;
  }

  return {
    startDate,
    endDate,
  };
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

    const selectedWeek = Number(url.searchParams.get("week")) || 1;

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
    // HARIAN: semua tanggal dalam bulan terpilih
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
    // MINGGUAN: hanya minggu yang dipilih
    // Contoh: week=1 hanya Minggu 1, tidak ikut Minggu 2
    // =========================
    if (mode === "week") {
      const { startDate, endDate } = getWeekRangeInMonth(
        selectedYear,
        selectedMonth,
        selectedWeek
      );

      const { start } = getBaliDayRange(startDate);
      const { end } = getBaliDayRange(endDate);

      const countMap = await countByDepartment(start, end, departmentIds);

      for (const department of departments) {
        rows.push({
          jenis_laporan: "mingguan",
          periode: `Minggu ${selectedWeek}`,
          tanggal_awal: format(startDate, "yyyy-MM-dd"),
          tanggal_akhir: format(endDate, "yyyy-MM-dd"),
          bulan: getMonthName(startDate),
          tahun: selectedYear,
          kode_departemen: department.code,
          departemen: department.name,
          total_tamu: countMap[department.id] ?? 0,
        });
      }
    }

    // =========================
    // BULANAN: hanya bulan yang dipilih
    // Contoh: month=6&year=2026 hanya Juni 2026
    // =========================
    if (mode === "month") {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);

      const { start } = getBaliDayRange(monthStart);
      const { end } = getBaliDayRange(monthEnd);

      const countMap = await countByDepartment(start, end, departmentIds);

      for (const department of departments) {
        rows.push({
          jenis_laporan: "bulanan",
          periode: format(selectedDate, "MMMM yyyy", { locale: localeId }),
          tanggal_awal: format(monthStart, "yyyy-MM-dd"),
          tanggal_akhir: format(monthEnd, "yyyy-MM-dd"),
          bulan: getMonthName(selectedDate),
          tahun: selectedYear,
          kode_departemen: department.code,
          departemen: department.name,
          total_tamu: countMap[department.id] ?? 0,
        });
      }
    }

    // =========================
    // TAHUNAN: hanya tahun yang dipilih
    // Bisa 2026, 2027, 2028, dst
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
        ? `minggu-${selectedWeek}`
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