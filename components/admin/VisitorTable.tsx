"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Download,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText,
  ExternalLink,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import DepartmentSelect from "@/components/shared/DepartmentSelect";
import { formatDateTime, getStatusBadgeColor, getStatusLabel, cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  originalName: string;
  storedName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

interface Visitor {
  id: string;
  registerNumber: string;
  name: string;
  address: string;
  phone: string;
  purpose: string;
  status: string;
  notes?: string | null;
  visitDate: string;
  checkoutTime?: string | null;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  uploadedFiles: UploadedFile[];
  _count: {
    uploadedFiles: number;
  };
}

function formatFileSize(size: number) {
  if (!size) return "-";

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function VisitorDetailModal({
  visitor,
  onClose,
}: {
  visitor: Visitor | null;
  onClose: () => void;
}) {
  if (!visitor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0b1220] px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">Detail Data Tamu</h2>
            <p className="mt-1 text-sm text-white/50">
              {visitor.registerNumber}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DetailItem label="Nama Lengkap" value={visitor.name} />
            <DetailItem label="No. Telepon" value={visitor.phone} />
            <DetailItem label="Alamat" value={visitor.address} />
            <DetailItem
              label="Tujuan / Bagian"
              value={visitor.department?.name || "-"}
            />
            <DetailItem label="Keperluan" value={visitor.purpose} />
            <DetailItem
              label="Tanggal Kunjungan"
              value={formatDateTime(visitor.visitDate)}
            />
            <DetailItem
              label="Status"
              value={getStatusLabel(visitor.status)}
            />
            <DetailItem
              label="Waktu Checkout"
              value={
                visitor.checkoutTime ? formatDateTime(visitor.checkoutTime) : "-"
              }
            />
          </div>

          {visitor.notes && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                Catatan
              </p>
              <p className="mt-2 text-sm text-white">{visitor.notes}</p>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Dokumen Upload / Tanda Pengenal
                </h3>
                <p className="mt-1 text-sm text-white/50">
                  File yang diupload tamu saat daftar kunjungan.
                </p>
              </div>
              <FileText className="h-5 w-5 text-blue-400" />
            </div>

            {visitor.uploadedFiles?.length ? (
              <div className="space-y-3">
                {visitor.uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {file.originalName}
                      </p>
                      <p className="mt-1 text-xs text-white/50">
                        {file.fileType} • {formatFileSize(file.fileSize)} •{" "}
                        {file.uploadedAt
                          ? formatDateTime(file.uploadedAt)
                          : "-"}
                      </p>
                    </div>

                    <a
                      href={file.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Lihat Dokumen
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/40">
                Tidak ada dokumen yang diupload.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium text-white">{value}</p>
    </div>
  );
}

export default function VisitorTablePage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [folderDepartmentId, setFolderDepartmentId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [exporting, setExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchVisitors = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (search) params.set("search", search);
      if (folderDepartmentId) params.set("departmentId", folderDepartmentId);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/visitors?${params.toString()}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Gagal memuat data");
      }

      setVisitors(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data tamu");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, folderDepartmentId, dateFrom, dateTo]);

  useEffect(() => {
    const timer = setTimeout(fetchVisitors, search ? 300 : 0);

    return () => clearTimeout(timer);
  }, [fetchVisitors, search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus data tamu "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setIsDeleting(id);

    try {
      const res = await fetch(`/api/visitors/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus data");
      }

      toast.success("Data tamu berhasil dihapus");
      fetchVisitors();
    } catch {
      toast.error("Gagal menghapus data");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDownloadCsv = async () => {
    if (!folderDepartmentId) {
      toast.error("Pilih Tujuan / Folder dulu");
      return;
    }

    try {
      setExporting(true);

      const params = new URLSearchParams();

      params.set("departmentId", folderDepartmentId);
      params.set("tzOffsetMinutes", "480");

      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(
        `/api/reports/visitors-by-department-detail?${params.toString()}`
      );

      if (!res.ok) {
        throw new Error("Export failed");
      }

      const blob = await res.blob();

      const filename =
        res.headers
          .get("Content-Disposition")
          ?.match(/filename="?([^";]+)"?/)?.[1] || "buku-tamu-folder.csv";

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Gagal download CSV");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Buku Tamu
          </h1>
          <p className="mt-2 text-gray-500 dark:text-white/50">
            Total {total.toLocaleString("id-ID")} entri
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchVisitors}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          <Link
            href="/daftar"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
          >
            + Tambah Tamu
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_160px_160px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Cari nama, no. register, telepon..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-white/30"
            />
          </div>

          <DepartmentSelect
            value={folderDepartmentId}
            onChange={(value) => {
              setFolderDepartmentId(value);
              setPage(1);
            }}
          />

          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
          />

          <button
            onClick={handleDownloadCsv}
            disabled={exporting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Menyiapkan..." : "Download CSV"}
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-white/[0.04] dark:text-white/40">
                <tr>
                  <th className="px-4 py-4">#</th>
                  <th className="px-4 py-4">Tanggal</th>
                  <th className="px-4 py-4">No. Register</th>
                  <th className="px-4 py-4">Nama Tamu</th>
                  <th className="px-4 py-4">Tujuan</th>
                  <th className="px-4 py-4">Keperluan</th>
                  <th className="px-4 py-4">Upload</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {isLoading ? (
                  Array(6)
                    .fill(0)
                    .map((_, index) => (
                      <tr key={index}>
                        {Array(9)
                          .fill(0)
                          .map((__, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-4">
                              <div className="h-4 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                            </td>
                          ))}
                      </tr>
                    ))
                ) : visitors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-16 text-center text-gray-400"
                    >
                      {search
                        ? `Tidak ada tamu dengan kata kunci "${search}"`
                        : "Belum ada data tamu"}
                    </td>
                  </tr>
                ) : (
                  visitors.map((visitor, index) => (
                    <tr
                      key={visitor.id}
                      className="transition hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-4 text-gray-500 dark:text-white/40">
                        {(page - 1) * 10 + index + 1}
                      </td>

                      <td className="px-4 py-4 text-gray-700 dark:text-white/70">
                        {formatDateTime(visitor.visitDate)}
                      </td>

                      <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                        {visitor.registerNumber}
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {visitor.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-white/40">
                          {visitor.phone}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-gray-700 dark:text-white/70">
                        {visitor.department?.name || "-"}
                      </td>

                      <td className="max-w-[240px] px-4 py-4 text-gray-700 dark:text-white/70">
                        <p className="line-clamp-2">{visitor.purpose}</p>
                      </td>

                      <td className="px-4 py-4">
                        {visitor._count.uploadedFiles > 0 ? (
                          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                            {visitor._count.uploadedFiles} file
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-500/10 px-3 py-1 text-xs font-semibold text-gray-400">
                            Tidak ada
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold",
                            getStatusBadgeColor(visitor.status)
                          )}
                        >
                          {getStatusLabel(visitor.status)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedVisitor(visitor)}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                            title="Lihat detail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(visitor.id, visitor.name)
                            }
                            disabled={isDeleting === visitor.id}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-500/10"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-500 dark:text-white/40">
            Menampilkan{" "}
            {total === 0 ? 0 : (page - 1) * 10 + 1}–
            {Math.min(page * 10, total)} dari {total.toLocaleString("id-ID")}{" "}
            entri
          </p>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1 || isLoading}
              className="rounded-lg border border-gray-200 p-2 text-gray-400 transition hover:text-gray-700 disabled:opacity-40 dark:border-white/10 dark:hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
              let pageNumber: number;

              if (totalPages <= 5) {
                pageNumber = index + 1;
              } else if (page <= 3) {
                pageNumber = index + 1;
              } else if (page >= totalPages - 2) {
                pageNumber = totalPages - 4 + index;
              } else {
                pageNumber = page - 2 + index;
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={cn(
                    "h-9 w-9 rounded-lg text-sm font-medium transition",
                    pageNumber === page
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 hover:bg-gray-100 dark:text-white/40 dark:hover:bg-white/5"
                  )}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              disabled={page >= totalPages || isLoading}
              className="rounded-lg border border-gray-200 p-2 text-gray-400 transition hover:text-gray-700 disabled:opacity-40 dark:border-white/10 dark:hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <VisitorDetailModal
        visitor={selectedVisitor}
        onClose={() => setSelectedVisitor(null)}
      />
    </div>
  );
}