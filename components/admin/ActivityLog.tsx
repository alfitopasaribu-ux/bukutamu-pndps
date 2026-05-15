"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Shield, User, File, LogIn, LogOut, Download, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const actionIcons: Record<string, any> = {
  VISITOR_REGISTERED: { icon: User, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
  VISITOR_UPDATED: { icon: Activity, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
  VISITOR_DELETED: { icon: Trash2, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
  VISITOR_CHECKED_IN: { icon: User, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  VISITOR_CHECKED_OUT: { icon: User, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-500/10" },
  FILE_UPLOADED: { icon: File, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-500/10" },
  FILE_DELETED: { icon: Trash2, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
  ADMIN_LOGIN: { icon: LogIn, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  ADMIN_LOGOUT: { icon: LogOut, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-500/10" },
  DATA_EXPORTED: { icon: Download, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
};

const actionLabels: Record<string, string> = {
  VISITOR_REGISTERED: "Tamu Baru Terdaftar",
  VISITOR_UPDATED: "Data Tamu Diupdate",
  VISITOR_DELETED: "Data Tamu Dihapus",
  VISITOR_CHECKED_IN: "Tamu Check-In",
  VISITOR_CHECKED_OUT: "Tamu Check-Out",
  FILE_UPLOADED: "File Diupload",
  FILE_DELETED: "File Dihapus",
  ADMIN_LOGIN: "Admin Login",
  ADMIN_LOGOUT: "Admin Logout",
  DATA_EXPORTED: "Data Diekspor",
};

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch activity logs
    fetch("/api/visitors?limit=1") // Trigger auth, then custom endpoint would be better
      .then(() =>
        fetch("/api/dashboard")
          .then((r) => r.json())
          .then((d) => {
            setLogs(d.recentLogs || []);
            setIsLoading(false);
          })
      )
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
          Log Aktivitas
        </h1>
        <p className="text-gray-500 dark:text-white/40 text-sm mt-0.5">
          Riwayat seluruh aktivitas sistem
        </p>
      </div>

      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden">
        <div className="divide-y divide-gray-50 dark:divide-white/[0.03]">
          {isLoading
            ? Array(8).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl shimmer-loading flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 shimmer-loading rounded" />
                    <div className="h-3 w-2/3 shimmer-loading rounded" />
                  </div>
                </div>
              ))
            : logs.map((log: any, i: number) => {
                const meta = actionIcons[log.action] || actionIcons.VISITOR_REGISTERED;
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-start gap-4 p-4 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className={`p-2.5 rounded-xl ${meta.bg} flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-white/70">
                        {actionLabels[log.action] || log.action}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5 truncate">
                        {log.details}
                      </p>
                      {log.visitor && (
                        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-mono">
                          {log.visitor.registerNumber}
                        </span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400 dark:text-white/30 font-mono whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </p>
                      {log.user && (
                        <p className="text-xs text-gray-300 dark:text-white/20 mt-0.5">
                          {log.user.name}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
        </div>
      </div>
    </div>
  );
}