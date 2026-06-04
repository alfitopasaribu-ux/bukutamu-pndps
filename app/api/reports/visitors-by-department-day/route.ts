import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import { parseISO, format } from "date-fns";
import { getBaliDayRange } from "@/lib/baliTime";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookie(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);

    const dateFromRaw = url.searchParams.get("dateFrom") || "";
    const dateToRaw = url.searchParams.get("dateTo") || "";

    const today = new Date();
    const defaultFrom = new Date(today);
    defaultFrom.setDate(defaultFrom.getDate() - 29);

    const dateFrom = dateFromRaw ? parseISO(dateFromRaw) : defaultFrom;
    const dateTo = dateToRaw ? parseISO(dateToRaw) : today;

    const tzOffsetMinutes = parseInt(
      url.searchParams.get("tzOffsetMinutes") || "480",
      10
    );

    const from = getBaliDayRange(dateFrom, tzOffsetMinutes).start;
    const to = getBaliDayRange(dateTo, tzOffsetMinutes).end;

    const days: Date[] = [];
    const currentDate = new Date(from);

    while (currentDate.getTime() <= to.getTime()) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

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

    const rows = await Promise.all(
      days.map(async (day) => {
        const { start, end } = getBaliDayRange(day, tzOffsetMinutes);

        const countsByDept = await prisma.visitor.groupBy({
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

        const countMap = Object.fromEntries(
          countsByDept.map((row) => [
            row.department_id,
            row._count.department_id,
          ])
        );

        return departments.map((department) => ({
          date: format(day, "yyyy-MM-dd"),
          departmentId: department.id,
          departmentName: department.name,
          count: countMap[department.id] ?? 0,
        }));
      })
    );

    const flat = rows.flat();

    const header = ["date", "departmentId", "departmentName", "count"];

    const escapeCsv = (value: unknown) => {
      const text = String(value ?? "");

      if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
      }

      return text;
    };

    const csv =
      header.join(",") +
      "\n" +
      flat
        .map((row) =>
          [
            row.date,
            row.departmentId,
            row.departmentName,
            row.count,
          ]
            .map(escapeCsv)
            .join(",")
        )
        .join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="buku-tamu-by-department-day_${format(
          from,
          "yyyy-MM-dd"
        )}_to_${format(to, "yyyy-MM-dd")}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}