"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Activity,
  Settings,
  Scale,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/visitors", icon: Users, label: "Buku Tamu" },
  { href: "/admin/activity", icon: Activity, label: "Log Aktivitas" },
  { href: "/admin/settings", icon: Settings, label: "Pengaturan" },
];

export default function AdminSidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Berhasil logout");
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="w-64 h-screen bg-white dark:bg-[#0a1020] border-r border-gray-200 dark:border-white/5 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600 shadow-lg shadow-blue-600/25">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-gray-900 dark:text-white leading-none">
              PN Denpasar
            </p>
            <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5 font-mono">
              PTSP Admin
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isActive ? "text-white" : "text-gray-400 dark:text-white/30 group-hover:text-gray-600 dark:group-hover:text-white/60"
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-white/60" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-white/5">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-gray-50 dark:bg-white/[0.03]">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user.name?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-400 dark:text-white/30 truncate font-mono">
              {user.role}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </aside>
  );
}