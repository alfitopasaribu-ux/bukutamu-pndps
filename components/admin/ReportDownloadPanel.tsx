"use client";

import { useState } from "react";
import { Download } from "lucide-react";

type ReportMode = "day" | "week" | "month" | "year";

const months = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

export default function ReportDownloadPanel() {
  const now = new Date();

  const [mode, setMode] = useState<ReportMode>("day");
  const [date, setDate] = useState<string>(now.toISOString().slice(0, 10));
  const [week, setWeek] = useState<number>(1);
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());

  const years = Array.from({ length: 8 }, (_, index) => now.getFullYear() - 2 + index);

  const handleDownload = () => {
    const params = new URLSearchParams();

    params.set("mode", mode);
    params.set("year", String(year));
    params.set("month", String(month));

    if (mode === "day") params.set("date", date);
    if (mode === "week") params.set("week", String(week));

    window.location.href = `/api/reports/visitors-xlsx?${params.toString()}`;
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Laporan Kunjungan Tamu PTSP</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
          Download laporan harian, mingguan, bulanan, dan tahunan dalam format Excel.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white/70">
            Jenis Laporan
          </label>
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as ReportMode)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-950 dark:text-white"
          >
            <option value="day">Harian</option>
            <option value="week">Mingguan</option>
            <option value="month">Bulanan</option>
            <option value="year">Tahunan</option>
          </select>
        </div>

        {mode === "day" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white/70">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-950 dark:text-white"
            />
          </div>
        )}

        {mode === "week" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white/70">Minggu Ke</label>
            <select
              value={week}
              onChange={(event) => setWeek(Number(event.target.value))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-950 dark:text-white"
            >
              <option value={1}>Minggu 1</option>
              <option value={2}>Minggu 2</option>
              <option value={3}>Minggu 3</option>
              <option value={4}>Minggu 4</option>
              <option value={5}>Minggu 5</option>
            </select>
          </div>
        )}

        {(mode === "week" || mode === "month") && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white/70">Bulan</label>
            <select
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-950 dark:text-white"
            >
              {months.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white/70">Tahun</label>
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-gray-950 dark:text-white"
          >
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleDownload}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Download Excel
          </button>
        </div>
      </div>
    </div>
  );
}

