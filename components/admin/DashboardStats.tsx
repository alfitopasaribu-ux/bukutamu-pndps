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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import { formatDateTime, cn } from "@/lib/utils";
import {
  format,
  subDays,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
} from "date-fns";
import { id as localeId } from "date-fns/locale";

type ChartMode = "7hari" | "30hari" | "bulan" | "tahun";

interface DayPoint {
  date: string;
  count: number;
  label: string;
}

interface MonthPoint {
  month: string;
  count: number;
  label: string;
}

type DashboardApiResponse = {
  stats: {
    totalVisitors: number;
    todayVisitors: number;
    monthVisitors: number;
    activeVisitors: number;
    avgPerWeek?: number;
  };
  byStatus: Array<{ status: string; count: number }>;
  byDepartment: Array<{ departmentId: string; name: string; count: number }>;
  recentLogs: any[];
  last30Days?: Array<{ date: string; count: number }>;
  last12Months?: Array<{ month: string; count: number; label: string }>;
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1525] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-white/50 text-xs mb-1">{label}</p>
      <p className="text-white font-bold text-xl">
        {payload[0].value?.toLocaleString?.("id-ID") ?? payload[0].value}
        <span className="text-white/40 text-xs font-normal ml-1">tamu</span>
      </p>
    </div>
  );
}

export default function DashboardContent({ user }: { user: any }) {
  const [data, setData] = useState<DashboardApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [chartMode, setChartMode] = useState<ChartMode>("30hari");
  const [chartData, setChartData] = useState<(DayPoint | MonthPoint)[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d: DashboardApiResponse) => {
        setData(d);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!data) return;
    const today = new Date();

    if (chartMode === "7hari") {
      const days: DayPoint[] = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(today, 6 - i);
        const key = format(d, "yyyy-MM-dd");
        const found = (data.last30Days ?? []).find((x) => x.date === key);
        return {
          date: key,
          count: found?.count ?? 0,
          label: format(d, "EEE, dd MMM", { locale: localeId }),
        };
      });
      setChartData(days);
      return;
    }

    if (chartMode === "30hari") {
      const days: DayPoint[] = Array.from({ length: 30 }, (_, i) => {
        const d = subDays(today, 29 - i);
        const key = format(d, "yyyy-MM-dd");
        const found = (data.last30Days ?? []).find((x) => x.date === key);
        return {
          date: key,
          count: found?.count ?? 0,
          label: format(d, "dd MMM", { locale: localeId }),
        };
      });
      setChartData(days);
      return;
    }

    if (chartMode === "bulan") {
      const targetMonth = addMonths(today, monthOffset);
      const start = startOfMonth(targetMonth);
      const end = endOfMonth(targetMonth);
      const days: DayPoint[] = eachDayOfInterval({ start, end }).map((d) => {
        const key = format(d, "yyyy-MM-dd");
        const found = (data.last30Days ?? []).find((x) => x.date === key);
        return {
          date: key,
          count: found?.count ?? 0,
          label: format(d, "dd", { locale: localeId }),
        };
      });
      setChartData(days);
      return;
    }

    // tahun
    const months: MonthPoint[] = (data.last12Months ?? []).map((m: any) => ({
      month: m.month,
      count: m.count,
      label: m.label,
    }));
    setChartData(months);
  }, [data, chartMode, monthOffset]);

  const totalChart = chartData.reduce((s, d: any) => s + (d.count ?? 0), 0);
  const maxPoint: any = chartData.reduce(
    (a: any, b: any) => (b.count > a.count ? b : a),
    { count: 0, label: "" }
  );

  const avgPerDay = (() => {
    const n = chartData.length;
    if (!n) return "0";
    const total = totalChart;
    return (total / n).toFixed(1);
  })();

  const targetMonth = addMonths(new Date(), monthOffset);
  const monthLabelStr = format(targetMonth, "MMMM yyyy", { locale: localeId });

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
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
          Selamat Datang, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 dark:text-white/40 text-sm mt-1">
          Ringkasan data Buku Tamu Pengadilan Negeri Denpasar
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            </div>
            {isLoading ? (
              <div className="h-8 w-24 bg-gray-200 dark:bg-white/10 rounded-lg animate-pulse" />
            ) : (
              <p className="font-display text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value.toLocaleString("id-ID")}
              </p>
            )}
            <p className="text-gray-500 dark:text-white/40 text-sm mt-1 font-medium">
              {stat.label}
            </p>
            <p className="text-gray-400 dark:text-white/20 text-xs mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-2xl p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Grafik Kunjungan Tamu
            </h2>
            {!isLoading && totalChart > 0 && (
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="text-xs text-gray-400 dark:text-white/30">
                  Total periode:
                  <span className="text-gray-800 dark:text-white font-semibold ml-1">
                    {totalChart.toLocaleString("id-ID")} tamu
                  </span>
                </span>
                <span className="text-xs text-gray-400 dark:text-white/30">
                  Rata-rata:
                  <span className="text-gray-800 dark:text-white font-semibold ml-1">
                    {avgPerDay} tamu/hari
                  </span>
                </span>
                {maxPoint.count > 0 && (
                  <span className="text-xs text-gray-400 dark:text-white/30">
                    Tertinggi:
                    <span className="text-blue-500 font-semibold ml-1">
                      {maxPoint.label} ({maxPoint.count} tamu)
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {chartMode === "bulan" && (
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-xl px-2 py-1">
                <button
                  onClick={() => setMonthOffset((m) => m - 1)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-600 dark:text-white/60 font-medium min-w-[100px] text-center">
                  {monthLabelStr}
                </span>
                <button
                  onClick={() => setMonthOffset((m) => Math.min(0, m + 1))}
                  disabled={monthOffset >= 0}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden text-xs">
              {([
                { key: "7hari", label: "7 Hari" },
                { key: "30hari", label: "30 Hari" },
                { key: "bulan", label: "Per Bulan" },
                { key: "tahun", label: "Per Tahun" },
              ] as Array<{ key: ChartMode; label: string }>).map((m) => (
                <button
                  key={m.key}
                  onClick={() => {
                    setChartMode(m.key);
                    setMonthOffset(0);
                  }}
                  className={[
                    "px-3 py-2 font-medium transition-all whitespace-nowrap",
                    chartMode === m.key
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-white/5",
                  ].join(" ")}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="h-72 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
        ) : chartData.every((d: any) => (d.count ?? 0) === 0) ? (
          <div className="h-72 flex flex-col items-center justify-center text-gray-300 dark:text-white/20">
            <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Belum ada data untuk periode ini</p>
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === "tahun" || chartMode === "bulan" ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.1)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "rgba(148,163,184,0.7)" }}
                    tickLine={false}
                    axisLine={false}
                    interval={chartMode === "bulan" ? 2 : 0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "rgba(148,163,184,0.7)" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={35}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(99,102,241,0.05)" }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#barGrad)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              ) : (
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.1)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "rgba(148,163,184,0.7)" }}
                    tickLine={false}
                    axisLine={false}
                    interval={chartMode === "30hari" ? 4 : 0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "rgba(148,163,184,0.7)" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={35}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#areaGrad)"
                    dot={
                      chartMode === "7hari"
                        ? {
                            r: 5,
                            fill: "#3b82f6",
                            strokeWidth: 2,
                            stroke: "#fff",
                          }
                        : false
                    }
                    activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Aktivitas Terkini
            </h3>
            <Link
              href="/admin/activity"
              className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
            >
              Lihat semua →
            </Link>
          </div>
          <div className="space-y-3">
            {isLoading
              ? Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-3/4 bg-gray-100 dark:bg-white/5 animate-pulse rounded" />
                        <div className="h-3 w-1/2 bg-gray-100 dark:bg-white/5 animate-pulse rounded" />
                      </div>
                    </div>
                  ))
              : (data?.recentLogs ?? []).slice(0, 6).map((log: any) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-white/70 truncate">{log.details}</p>
                      <p className="text-xs text-gray-400 dark:text-white/30 font-mono">{formatDateTime(log.createdAt)}</p>
                    </div>
                  </motion.div>
                ))}
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-violet-500" />
            Bagian Terpopuler
          </h3>
          <div className="space-y-3">
            {isLoading
              ? Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="h-3 w-2/3 bg-gray-100 dark:bg-white/5 animate-pulse rounded" />
                      <div className="h-2 w-full bg-gray-100 dark:bg-white/5 animate-pulse rounded-full" />
                    </div>
                  ))
              : (data?.byDepartment ?? []).slice(0, 6).map((dept: any, i: number) => {
                  const max = data?.byDepartment?.[0]?.count || 1;
                  const pct = Math.round((dept.count / max) * 100);
                  return (
                    <motion.div
                      key={dept.departmentId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0 }}
                    >
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-white/60 truncate max-w-[220px]">{dept.name}</span>
                        <span className="text-gray-400 dark:text-white/30 font-mono ml-2 flex-shrink-0">{dept.count} tamu</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
                        />
                      </div>
                    </motion.div>
                  );
                })}
          </div>
        </div>
      </div>
    </div>
  );
}

