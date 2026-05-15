"use client";

import { useEffect, useState } from "react";
import { Building2, ChevronDown } from "lucide-react";

interface Department {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  level: number;
  order: number;
}

const LEVEL_PREFIX: Record<number, string> = {
  0: "",
  1: "|- ",
  2: "|-|- ",
};

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  dark?: boolean;
}

export default function DepartmentSelect({ value, onChange, error, dark = false }: Props) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((d) => setDepartments(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const inputClass = dark
    ? "bg-[#0d1f40] border-white/10 text-white focus:ring-blue-400/50"
    : "bg-gray-50 dark:bg-[#0d1525] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-blue-500/30";

  return (
    <div>
      <div className="relative">
        <Building2
          className={[
            "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10 pointer-events-none",
            dark ? "text-white/30" : "text-gray-300 dark:text-white/20",
          ].join(" ")}
        />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className={[
            "w-full border rounded-xl pl-10 pr-8 py-3 text-sm",
            "focus:outline-none focus:ring-2 transition-all",
            "appearance-none cursor-pointer disabled:opacity-60",
            inputClass,
          ].join(" ")}
        >
          <option value="">— Pilih Tujuan / Bagian —</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {LEVEL_PREFIX[dept.level] ?? ""}{dept.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className={[
            "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none",
            dark ? "text-white/30" : "text-gray-400",
          ].join(" ")}
        />
      </div>

      {error && <p className="mt-1 text-red-400 text-xs">{error}</p>}
    </div>
  );
}

