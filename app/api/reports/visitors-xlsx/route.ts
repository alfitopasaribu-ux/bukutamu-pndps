import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import {
  addDays,
  endOfMonth,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { getBaliDayRange } from "@/lib/baliTime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

const REPORT_LABEL: Record<ReportMode, string> = {
  day: "Harian",
  week: "Mingguan",
  month: "Bulanan",
  year: "Tahunan",
};

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

function getReportPeriod(params: {
  mode: ReportMode;
  year: number;
  month: number;
  week: number;
  dateParam: string | null;
}) {
  const { mode, year, month, week, dateParam } = params;

  if (mode === "day") {
    const selectedDate = dateParam ? parseISO(dateParam) : new Date();
    const { start, end } = getBaliDayRange(selectedDate);

    return {
      title: "LAPORAN HARIAN KUNJUNGAN TAMU PTSP",
      label: format(selectedDate, "EEEE, dd MMMM yyyy", { locale: localeId }),
      fileLabel: `harian-${format(selectedDate, "yyyy-MM-dd")}`,
      startDate: selectedDate,
      endDate: selectedDate,
      queryStart: start,
      queryEnd: end,
    };
  }

  if (mode === "week") {
    const { startDate, endDate } = getWeekRangeInMonth(year, month, week);
    const { start } = getBaliDayRange(startDate);
    const { end } = getBaliDayRange(endDate);

    return {
      title: "LAPORAN MINGGUAN KUNJUNGAN TAMU PTSP",
      label: `Minggu ${week}, ${format(startDate, "dd MMMM yyyy", {
        locale: localeId,
      })} - ${format(endDate, "dd MMMM yyyy", { locale: localeId })}`,
      fileLabel: `minggu-${week}-${year}-${String(month).padStart(2, "0")}`,
      startDate,
      endDate,
      queryStart: start,
      queryEnd: end,
    };
  }

  if (mode === "month") {
    const selectedDate = new Date(year, month - 1, 1);
    const startDate = startOfMonth(selectedDate);
    const endDate = endOfMonth(selectedDate);

    const { start } = getBaliDayRange(startDate);
    const { end } = getBaliDayRange(endDate);

    return {
      title: "LAPORAN BULANAN KUNJUNGAN TAMU PTSP",
      label: format(selectedDate, "MMMM yyyy", { locale: localeId }),
      fileLabel: `bulanan-${year}-${String(month).padStart(2, "0")}`,
      startDate,
      endDate,
      queryStart: start,
      queryEnd: end,
    };
  }

  const selectedDate = new Date(year, 0, 1);
  const startDate = startOfYear(selectedDate);
  const endDate = endOfYear(selectedDate);

  const { start } = getBaliDayRange(startDate);
  const { end } = getBaliDayRange(endDate);

  return {
    title: "LAPORAN TAHUNAN KUNJUNGAN TAMU PTSP",
    label: `Tahun ${year}`,
    fileLabel: `tahunan-${year}`,
    startDate,
    endDate,
    queryStart: start,
    queryEnd: end,
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

    const year = Number(url.searchParams.get("year")) || today.getFullYear();
    const month = Number(url.searchParams.get("month")) || today.getMonth() + 1;
    const week = Number(url.searchParams.get("week")) || 1;
    const dateParam = url.searchParams.get("date");

    const period = getReportPeriod({
      mode,
      year,
      month,
      week,
      dateParam,
    });

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

    const countMap = await countByDepartment(
      period.queryStart,
      period.queryEnd,
      departmentIds
    );

    const rows = departments.map((department, index) => ({
      no: index + 1,
      code: department.code,
      name: department.name,
      total: countMap[department.id] ?? 0,
    }));

    const totalKeseluruhan = rows.reduce((sum, row) => sum + row.total, 0);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Buku Tamu PN Denpasar";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Laporan PTSP", {
      views: [{ state: "frozen", ySplit: 8 }],
    });

    worksheet.mergeCells("A1:D1");
    worksheet.getCell("A1").value = period.title;
    worksheet.getCell("A1").font = {
      bold: true,
      size: 16,
      color: { argb: "FFFFFFFF" },
    };
    worksheet.getCell("A1").alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E40AF" },
    };
    worksheet.getRow(1).height = 28;

    worksheet.mergeCells("A2:D2");
    worksheet.getCell("A2").value = "PENGADILAN NEGERI DENPASAR";
    worksheet.getCell("A2").font = {
      bold: true,
      size: 13,
      color: { argb: "FFFFFFFF" },
    };
    worksheet.getCell("A2").alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell("A2").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" },
    };
    worksheet.getRow(2).height = 24;

    worksheet.getCell("A4").value = "Jenis Laporan";
    worksheet.getCell("B4").value = REPORT_LABEL[mode];

    worksheet.getCell("A5").value = "Periode";
    worksheet.getCell("B5").value = period.label;

    worksheet.getCell("A6").value = "Tanggal Awal";
    worksheet.getCell("B6").value = format(period.startDate, "dd MMMM yyyy", {
      locale: localeId,
    });

    worksheet.getCell("C4").value = "Tanggal Akhir";
    worksheet.getCell("D4").value = format(period.endDate, "dd MMMM yyyy", {
      locale: localeId,
    });

    worksheet.getCell("C5").value = "Tanggal Cetak";
    worksheet.getCell("D5").value = format(new Date(), "dd MMMM yyyy HH:mm", {
      locale: localeId,
    });

    worksheet.getCell("C6").value = "Dicetak Oleh";
    worksheet.getCell("D6").value = user.name || "Admin";

    ["A4", "A5", "A6", "C4", "C5", "C6"].forEach((cell) => {
      worksheet.getCell(cell).font = { bold: true };
    });

    const headerRow = worksheet.getRow(8);
    headerRow.values = ["No", "Kode Departemen", "Departemen PTSP", "Total Tamu"];
    headerRow.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    headerRow.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    headerRow.height = 24;

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2563EB" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    rows.forEach((row, index) => {
      const rowNumber = 9 + index;
      const excelRow = worksheet.getRow(rowNumber);

      excelRow.values = [row.no, row.code, row.name, row.total];

      excelRow.eachCell((cell) => {
        cell.alignment = {
          vertical: "middle",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });

      worksheet.getCell(`A${rowNumber}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      worksheet.getCell(`D${rowNumber}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
    });

    const totalRowNumber = 9 + rows.length;

    worksheet.mergeCells(`A${totalRowNumber}:C${totalRowNumber}`);
    worksheet.getCell(`A${totalRowNumber}`).value = "TOTAL KESELURUHAN";
    worksheet.getCell(`D${totalRowNumber}`).value = totalKeseluruhan;

    [`A${totalRowNumber}`, `D${totalRowNumber}`].forEach((cell) => {
      worksheet.getCell(cell).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      worksheet.getCell(cell).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF16A34A" },
      };
      worksheet.getCell(cell).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.getCell(cell).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    worksheet.getRow(totalRowNumber).height = 24;

    worksheet.columns = [
      { key: "no", width: 8 },
      { key: "code", width: 22 },
      { key: "name", width: 75 },
      { key: "total", width: 15 },
    ];

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.font = {
          name: "Calibri",
          size: cell.font?.size || 11,
          bold: cell.font?.bold || false,
          color: cell.font?.color,
        };
      });
    });

    worksheet.pageSetup = {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    };

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="laporan-ptsp-${period.fileLabel}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export XLSX error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}