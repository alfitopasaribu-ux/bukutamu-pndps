"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, ChevronDown } from "lucide-react";

interface Department {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  parentId: string | null;
  order: number;
  isActive?: boolean;
}

interface DepartmentSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  dark?: boolean;
  disabled?: boolean;
}

export default function DepartmentSelect({
  value,
  onChange,
  error,
  dark = false,
  disabled = false,
}: DepartmentSelectProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDepartments() {
      try {
        setLoading(true);

        const response = await fetch("/api/departments", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Gagal memuat tujuan/bagian");
        }

        if (isMounted) {
          setDepartments(result.data || []);
        }
      } catch (error) {
        console.error("Load departments error:", error);

        if (isMounted) {
          setDepartments([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDepartments();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedDepartments = useMemo(() => {
    return [...departments].sort((a, b) => {
      const orderA = typeof a.order === "number" ? a.order : 9999;
      const orderB = typeof b.order === "number" ? b.order : 9999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return a.name.localeCompare(b.name);
    });
  }, [departments]);

  const selectClass = dark
    ? "border-white/10 bg-[#0d1f40] text-white focus:border-blue-400/40 focus:ring-blue-400/40"
    : "border-gray-200 bg-white text-gray-900 focus:border-blue-500/40 focus:ring-blue-500/30 dark:border-white/10 dark:bg-[#0d1525] dark:text-white";

  const iconClass = dark ? "text-white/30" : "text-gray-400 dark:text-white/30";

  return (
    <div className="w-full">
      <div className="relative">
        <Building2
          className={[
            "pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2",
            iconClass,
          ].join(" ")}
        />

        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={loading || disabled}
          className={[
            "w-full appearance-none rounded-xl border py-3 pl-10 pr-10 text-sm outline-none transition-all",
            "focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
            selectClass,
          ].join(" ")}
        >
          <option value="">
            {loading ? "Memuat tujuan/bagian..." : "— Pilih Tujuan / Bagian —"}
          </option>

          {sortedDepartments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>

        <ChevronDown
          className={[
            "pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2",
            iconClass,
          ].join(" ")}
        />
      </div>

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}