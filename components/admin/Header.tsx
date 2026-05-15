"use client";

import { Bell, Moon, Sun, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

export default function AdminHeader({ user }: { user: any }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-16 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-[#0a1020] flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex-1">
        <p className="text-xs text-gray-400 dark:text-white/30 font-mono">
          {formatDate(new Date(), "EEEE, dd MMMM yyyy")}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Notification bell */}
        <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

