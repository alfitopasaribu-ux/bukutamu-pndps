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

    const departmentId = url.searchParams.get("departmentId") || "";
    if (!departmentId) {
      return NextResponse.json({ error: "departmentId is required" }, { status: 400 });
    }

    const entrySource = url.searchParams.get("entrySource") || "PUBLIC_FORM";
    const tzOffsetMinutes = parseInt(url.searchParams.get("tzOffsetMinutes") || "480", 10);

    const dateFromRaw = url.searchParams.get("dateFrom") || "";
    const dateToRaw = url.searchParams.get("dateTo") || "";

    const today = new Date();
    const defaultFrom = new Date(today);
    defaultFrom.setDate(defaultFrom.getDate() - 29);

    const dateFrom = dateFromRaw ? parseISO(dateFromRaw) : defaultFrom;
    const dateTo = dateToRaw ? parseISO(dateToRaw) : today;

    const from = getBaliDayRange(dateFrom, tzOffsetMinutes).start;
    const to = getBaliDayRange(dateTo, tzOffsetMinutes).end;

    const visitors = await prisma.visitor.findMany({
      where: {
        entrySource: entrySource as any,
        departmentId,
        visitDate: {
          gte: from,
          lte: to,
        },
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        uploadedFiles: true,
      },
      orderBy: { visitDate: "asc" },
    });

    const header = [
      "date",
      "departmentName",
      "registerNumber",
      "name",
      "phone",
      "purpose",
      "status",
      "entrySource",
      "fileNames",
      "fileUrls",
    ];

    const escapeCsv = (v: any) => {
      const s = String(v ?? "");
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const escapeExcelFormula = (v: string) => v.replace(/"/g, '""');

    // Excel/Sheets: jadikan URL jadi hyperlink agar bisa di-click
    // Format: =HYPERLINK("url","label")
    const toExcelHyperlink = (url: string, label: string) => {
      if (!url) return "";
      return `=HYPERLINK("${escapeExcelFormula(url)}","${escapeExcelFormula(label)}")`;
    };

    const rows = visitors.map((v) => {
      const labelDate = format(
        new Date(v.visitDate.getTime() + tzOffsetMinutes * 60_000),
        "yyyy-MM-dd"
      );

      const fileNames = (v.uploadedFiles ?? []).map((f) => f.originalName).join(";");

      // Excel/Sheets: hyperlink butuh satu link per sel.
      // Agar bisa diklik, pilih file pertama sebagai hyperlink.
      const firstFile = (v.uploadedFiles ?? [])[0];
      const fileUrls = firstFile ? toExcelHyperlink(firstFile.filePath, firstFile.originalName) : "";


      return [
        labelDate,
        v.department?.name || "",
        v.registerNumber,
        v.name,
        v.phone,
        v.purpose,
        v.status,
        (v as any).entrySource,
        fileNames,
        fileUrls,
      ].map(escapeCsv);
    });

    const csv = header.join(",") + "\n" + rows.map((r) => r.join(",")).join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="buku-tamu-department-${departmentId}_${format(dateFrom, "yyyy-MM-dd")}_to_${format(dateTo, "yyyy-MM-dd")}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export department detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

