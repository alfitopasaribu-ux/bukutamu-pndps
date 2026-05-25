"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

export default function ExportReportButton({
  className = "",
  dateFrom,
  dateTo,
  label = "Download Excel",
}: {
  className?: string;
  dateFrom?: string;
  dateTo?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  const onDownload = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      // tz offset menit agar backend bisa hitung “tanggal” sesuai lokasi.
      // Map simple: Browser timezone -> offset.
      const tzOffsetMinutes = -new Date().getTimezoneOffset(); // menit
      params.set("tzOffsetMinutes", String(tzOffsetMinutes));


      const res = await fetch(`/api/reports/visitors-by-department-day?${params.toString()}`, {
        method: "GET",
      });

      if (!res.ok) {
        toast.error("Gagal download laporan");
        return;
      }

      const blob = await res.blob();
      const filename =
        res.headers.get("Content-Disposition")?.match(/filename="?([^";]+)"?/)?.[1] ||
        "laporan.csv";

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Terjadi kesalahan saat download");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onDownload}
      disabled={loading}
      className={[
        "inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-xs font-medium",
        loading ? "opacity-50 cursor-not-allowed" : "",
        className,
      ].join(" ")}
    >
      <Download className="w-4 h-4" />
      {loading ? "Menyiapkan..." : label}
    </button>
  );
}

