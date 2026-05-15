"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Download,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
} from "lucide-react";
import { formatDateTime, getStatusLabel, getStatusBadgeColor, cn } from "@/lib/utils";
import { toast } from "sonner";
import VisitorModal from "./VisitorModal";
import Link from "next/link";

interface Visitor {
  id: string;
  registerNumber: string;
  name: string;
  address: string;
  phone: string;
  purpose: string;
  status: string;
  visitDate: string;
  department: { id: string; name: string; code: string };
  _count: { uploadedFiles: number };
}

export default function VisitorTablePage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchVisitors = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(search && { search }),
      });
      const res = await fetch(`/api/visitors?${params}`);
      const data = await res.json();
      setVisitors(data.data || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(fetchVisitors, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchVisitors, search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus data tamu "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/visitors/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Data tamu berhasil dihapus");
        fetchVisitors();
      } else {
        toast.error("Gagal menghapus data");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsDeleting(null);
    }
  };

  const columns: ColumnDef<Visitor>[] = [
    {
      header: "#",
      cell: ({ row }) => (
        <span className="text-gray-400 dark:text-white/30 font-mono text-xs">
          {(page - 1) * 10 + row.index + 1}
        </span>
      ),
      size: 50,
    },
    {
      accessorKey: "visitDate",
      header: "Tanggal",
      cell: ({ row }) => (
        <span className="text-xs text-gray-500 dark:text-white/50 font-mono whitespace-nowrap">
          {formatDateTime(row.original.visitDate)}
        </span>
      ),
    },
    {
      accessorKey: "registerNumber",
      header: "No. Register",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
          {row.original.registerNumber}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Nama Tamu",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white text-sm">{row.original.name}</p>
          <p className="text-xs text-gray-400 dark:text-white/30 truncate max-w-[150px]">{row.original.phone}</p>
        </div>
      ),
    },
    {
      accessorKey: "department.name",
      header: "Tujuan",
      cell: ({ row }) => (
        <p className="text-xs text-gray-600 dark:text-white/60 max-w-[180px] leading-relaxed">
          {row.original.department?.name}
        </p>
      ),
    },
    {
      accessorKey: "purpose",
      header: "Keperluan",
      cell: ({ row }) => (
        <p className="text-xs text-gray-500 dark:text-white/40 max-w-[200px] truncate">
          {row.original.purpose}
        </p>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium",
            getStatusBadgeColor(row.original.status)
          )}
        >
          {getStatusLabel(row.original.status)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
            <Link
              href={`/admin/visitors/${row.original.id}`}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all inline-flex items-center justify-center"
              aria-label="Lihat detail visitor"
            >
              <Eye className="w-3.5 h-3.5" />
            </Link>

          <button
            onClick={() => handleDelete(row.original.id, row.original.name)}
            disabled={isDeleting === row.original.id}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
      size: 80,
    },
  ];

  const table = useReactTable({
    data: visitors,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            Buku Tamu
          </h1>
          <p className="text-gray-500 dark:text-white/40 text-sm mt-0.5">
            Total {total.toLocaleString("id-ID")} entri
          </p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <button
            onClick={fetchVisitors}
            className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedVisitor(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-md shadow-blue-600/25"
          >
            <Plus className="w-4 h-4" />
            Tambah Tamu
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Cari nama, no. register, telepon..."
          className="w-full bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5">
                {table.getHeaderGroups()[0].headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider whitespace-nowrap bg-gray-50/50 dark:bg-white/[0.02]"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-white/[0.03]">
                    {columns.map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 shimmer-loading rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center">
                    <p className="text-gray-400 dark:text-white/30 text-sm">
                      {search ? `Tidak ada tamu dengan kata kunci "${search}"` : "Belum ada data tamu"}
                    </p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-gray-50 dark:border-white/[0.03] hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3.5 border-t border-gray-100 dark:border-white/5">
          <p className="text-xs text-gray-400 dark:text-white/30 font-mono">
            Menampilkan {((page - 1) * 10) + 1}–{Math.min(page * 10, total)} dari {total.toLocaleString("id-ID")} entri
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white disabled:opacity-40 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-medium transition-all",
                    pageNum === page
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                      : "text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/5"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white disabled:opacity-40 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <VisitorModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedVisitor(null); }}
        visitor={selectedVisitor}
        onSuccess={() => { fetchVisitors(); setIsModalOpen(false); }}
      />
    </div>
  );
}