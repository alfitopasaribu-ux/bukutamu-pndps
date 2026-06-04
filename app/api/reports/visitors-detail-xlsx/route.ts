import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatFileSize(size: number) {
  if (!size) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    REGISTERED: "Terdaftar",
    CHECKED_IN: "Check In",
    IN_PROGRESS: "Sedang Diproses",
    COMPLETED: "Selesai",
    CHECKED_OUT: "Check Out",
    CANCELLED: "Dibatalkan",
  };

  return labels[status] || status;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookie(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);

    const search = url.searchParams.get("search") || "";
    const departmentId = url.searchParams.get("departmentId") || "";
    const dateFrom = url.searchParams.get("dateFrom") || "";
    const dateTo = url.searchParams.get("dateTo") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { register_number: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { address: { contains: search, mode: "insensitive" } },
        { purpose: { contains: search, mode: "insensitive" } },
      ];
    }

    if (departmentId) {
      where.department_id = departmentId;
    }

    if (dateFrom || dateTo) {
      where.visit_date = {};

      if (dateFrom) {
        where.visit_date.gte = new Date(`${dateFrom}T00:00:00+08:00`);
      }

      if (dateTo) {
        where.visit_date.lte = new Date(`${dateTo}T23:59:59+08:00`);
      }
    }

    const visitors = await prisma.visitor.findMany({
      where,
      include: {
        departments: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        uploaded_files: {
          orderBy: {
            uploaded_at: "desc",
          },
        },
      },
      orderBy: {
        visit_date: "desc",
      },
      take: 5000,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Buku Tamu PN Denpasar";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Data Buku Tamu", {
      views: [{ state: "frozen", ySplit: 8 }],
    });

    worksheet.mergeCells("A1:K1");
    worksheet.getCell("A1").value = "LAPORAN DETAIL BUKU TAMU";
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

    worksheet.mergeCells("A2:K2");
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

    worksheet.getCell("A4").value = "Filter Tujuan";
    worksheet.getCell("B4").value = departmentId ? "Sesuai pilihan admin" : "Semua Tujuan";

    worksheet.getCell("A5").value = "Tanggal Awal";
    worksheet.getCell("B5").value = dateFrom || "-";

    worksheet.getCell("A6").value = "Tanggal Akhir";
    worksheet.getCell("B6").value = dateTo || "-";

    worksheet.getCell("D4").value = "Tanggal Cetak";
    worksheet.getCell("E4").value = format(new Date(), "dd MMMM yyyy HH:mm", {
      locale: localeId,
    });

    worksheet.getCell("D5").value = "Dicetak Oleh";
    worksheet.getCell("E5").value = user.name || "Admin";

    worksheet.getCell("D6").value = "Total Data";
    worksheet.getCell("E6").value = visitors.length;

    ["A4", "A5", "A6", "D4", "D5", "D6"].forEach((cell) => {
      worksheet.getCell(cell).font = { bold: true };
    });

    const headerRow = worksheet.getRow(8);
    headerRow.values = [
      "No",
      "Tanggal",
      "No. Register",
      "Nama Tamu",
      "Alamat",
      "No. Telepon",
      "Tujuan / Bagian",
      "Keperluan",
      "Status",
      "Dokumen Upload",
      "Link Dokumen",
    ];

    headerRow.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    headerRow.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    headerRow.height = 28;

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

    visitors.forEach((visitor, index) => {
      const rowNumber = 9 + index;
      const files = visitor.uploaded_files || [];

      const fileNames = files.length
        ? files
            .map(
              (file) => `${file.original_name} (${file.file_type}, ${formatFileSize(file.file_size)})`
            )
            .join("\n")
        : "Tidak ada";

      const fileLinks = files.length ? files.map((file) => file.file_path).join("\n") : "-";

      const row = worksheet.getRow(rowNumber);

      row.values = [
        index + 1,
        visitor.visit_date
          ? format(new Date(visitor.visit_date), "dd MMMM yyyy HH:mm", {
              locale: localeId,
            })
          : "-",
        visitor.register_number,
        visitor.name,
        visitor.address,
        visitor.phone,
        visitor.departments?.name || "-",
        visitor.purpose,
        getStatusLabel(visitor.status),
        fileNames,
        fileLinks,
      ];

      row.eachCell((cell) => {
        cell.alignment = {
          vertical: "top",
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

      worksheet.getCell(`K${rowNumber}`).font = {
        color: { argb: "FF2563EB" },
        underline: true,
      };

      row.height = files.length > 1 ? 42 : 28;
    });

    worksheet.columns = [
      { key: "no", width: 7 },
      { key: "tanggal", width: 24 },
      { key: "register", width: 22 },
      { key: "nama", width: 28 },
      { key: "alamat", width: 35 },
      { key: "phone", width: 18 },
      { key: "tujuan", width: 55 },
      { key: "purpose", width: 40 },
      { key: "status", width: 18 },
      { key: "dokumen", width: 45 },
      { key: "link", width: 60 },
    ];

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
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="laporan-detail-buku-tamu-${format(new Date(), "yyyyMMdd-HHmm")}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export visitors detail XLSX error:", error);

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

