"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  CalendarDays,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Activity,
  Download,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatDateTime } from "@/lib/utils";

type ChartMode = "minggu" | "bulan" | "tahun";

type ChartPoint = {
  label: string;
  count: number;
  date?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
};

type DashboardApiResponse = {
  stats: {
    totalVisitors: number;
    todayVisitors: number;
    monthVisitors: number;
    yearVisitors: number;
    activeVisitors: number;
    avgPerWeek?: number;
  };
  byStatus: Array<{ status: string; count: number }>;
  byDepartment: Array<{ departmentId: string; name: string; count: number }>;
  recentLogs: any[];
  charts: {
    week: ChartPoint[];
    month: ChartPoint[];
    year: ChartPoint[];
  };
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-xl dark:border-white/10 dark:bg-gray-950">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {label}
      </p>
      <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
        {payload[0].value?.toLocaleString?.("id-ID") ?? payload[0].value} tamu
      </p>
    </div>
  );
}

function getCsvMode(chartMode: ChartMode) {
  if (chartMode === "minggu") return "week";
  if (chartMode === "bulan") return "month";
  return "year";
}

export default function DashboardContent({ user }: { user: any }) {
  const [data, setData] = useState<DashboardApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartMode, setChartMode] = useState<ChartMode>("minggu");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((response) => response.json())
      .then((result: DashboardApiResponse) => {
        setData(result);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const chartData: ChartPoint[] =
    chartMode === "minggu"
      ? data?.charts?.week ?? []
      : chartMode === "bulan"
      ? data?.charts?.month ?? []
      : data?.charts?.year ?? [];

  const totalChart = chartData.reduce(
    (total, item) => total + (item.count ?? 0),
    0
  );

  const maxPoint = chartData.reduce(
    (highest, item) => (item.count > highest.count ? item : highest),
    { label: "", count: 0 } as ChartPoint
  );

  const averageLabel = (() => {
    if (!chartData.length) return "0";
    return (totalChart / chartData.length).toFixed(1);
  })();

  const periodText =
    chartMode === "minggu"
      ? "per hari kerja"
      : chartMode === "bulan"
      ? "per minggu"
      : "per bulan";

  const stats = [
    {
      label: "Total Tamu",
      value: data?.stats?.totalVisitors ?? 0,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      sub: "Semua waktu",
    },
    {
      label: "Tamu Hari Ini",
      value: data?.stats?.todayVisitors ?? 0,
      icon: CalendarDays,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      sub: format(new Date(), "dd MMM yyyy", { locale: localeId }),
    },
    {
      label: "Bulan Ini",
      value: data?.stats?.monthVisitors ?? 0,
      icon: TrendingUp,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      sub: `Rata-rata ${data?.stats?.avgPerWeek ?? 0}/minggu`,
    },
    {
      label: "Sedang Aktif",
      value: data?.stats?.activeVisitors ?? 0,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      sub: "Live sekarang",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Selamat Datang, {user?.name?.split(" ")[0] || "Admin"}
        </h1>
        <p className="mt-2 text-gray-500 dark:text-white/50">
          Ringkasan data Buku Tamu Pengadilan Negeri Denpasar
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}
                >
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              </div>

              <div className="mt-6">
                {isLoading ? (
                  <div className="h-8 w-20 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value.toLocaleString("id-ID")}
                  </p>
                )}

                <p className="mt-2 text-sm font-medium text-gray-600 dark:text-white/60">
                  {stat.label}
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-white/35">
                  {stat.sub}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <Activity className="h-5 w-5 text-blue-500" />
                Grafik Kunjungan Tamu
              </h2>

              <button
                onClick={() => {
                  const mode = getCsvMode(chartMode);
                  window.location.href = `/api/reports/visitors-summary?mode=${mode}`;
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"
              >
                <Download className="h-4 w-4" />
                Download CSV
              </button>
            </div>

            {!isLoading && (
              <p className="mt-3 text-sm text-gray-500 dark:text-white/50">
                Total periode:{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {totalChart.toLocaleString("id-ID")} tamu
                </span>{" "}
                <span className="mx-2">•</span>
                Rata-rata:{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {averageLabel} tamu/{periodText}
                </span>
                {maxPoint.count > 0 && (
                  <>
                    <span className="mx-2">•</span>
                    Tertinggi:{" "}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {maxPoint.label} ({maxPoint.count} tamu)
                    </span>
                  </>
                )}
              </p>
            )}
          </div>

          <div className="inline-flex overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
            {[
              { key: "minggu", label: "Per Minggu" },
              { key: "bulan", label: "Per Bulan" },
              { key: "tahun", label: "Per Tahun" },
            ].map((mode) => (
              <button
                key={mode.key}
                onClick={() => setChartMode(mode.key as ChartMode)}
                className={[
                  "px-4 py-2 text-sm font-medium transition-all whitespace-nowrap",
                  chartMode === mode.key
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:bg-gray-50 dark:text-white/40 dark:hover:bg-white/5",
                ].join(" ")}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 h-[360px]">
          {isLoading ? (
            <div className="h-full w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
          ) : chartData.every((item) => (item.count ?? 0) === 0) ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-gray-200 text-gray-400 dark:border-white/10">
              Belum ada data untuk periode ini
            </div>
          ) : chartMode === "minggu" ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.18)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  fill="rgba(37,99,235,0.18)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.18)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Aktivitas Terkini
            </h3>
            <Link
              href="/admin/activity"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Lihat semua →
            </Link>
          </div>

          <div className="space-y-4">
            {isLoading
              ? Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <div
                      key={index}
                      className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5"
                    />
                  ))
              : (data?.recentLogs ?? []).slice(0, 6).map((log: any) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-gray-100 p-4 dark:border-white/10"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.details || log.action}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-white/40">
                      {log.createdAt ? formatDateTime(log.createdAt) : "-"}
                    </p>
                  </div>
                ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <h3 className="mb-5 text-lg font-bold text-gray-900 dark:text-white">
            Bagian Terpopuler
          </h3>

          <div className="space-y-4">
            {isLoading
              ? Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <div
                      key={index}
                      className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5"
                    />
                  ))
              : (data?.byDepartment ?? []).slice(0, 6).map((dept, index) => {
                  const max = data?.byDepartment?.[0]?.count || 1;
                  const percentage = Math.round((dept.count / max) * 100);

                  return (
                    <div key={dept.departmentId}>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700 dark:text-white/70">
                          {index + 1}. {dept.name}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {dept.count} tamu
                        </p>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>
    </div>
  );
}