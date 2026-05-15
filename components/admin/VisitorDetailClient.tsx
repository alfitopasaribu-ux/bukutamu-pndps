"use client";

import { useEffect, useState } from "react";

type UploadedFile = {
  id: string;
  originalName: string;
  storedName: string;
  fileType: string;
  filePath: string;
};

type VisitorDetail = {
  id: string;
  registerNumber: string;
  name: string;
  address: string;
  phone: string;
  purpose: string;
  status: string;
  visitDate: string;
  department: { id: string; name: string; code: string };
  uploadedFiles: UploadedFile[];
};

export default function VisitorDetailClient({ id }: { id: string }) {
  const [visitor, setVisitor] = useState<VisitorDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/visitors/${id}`, {
          method: "GET",
          cache: "no-store",
          // penting: supaya cookie auth-token ikut terkirim
          credentials: "include",
        });

        const json = (await res.json()) as { data?: VisitorDetail; error?: string };

        if (!res.ok) {
          throw new Error(json.error || `Request failed (${res.status})`);
        }

        if (!cancelled) setVisitor(json.data || null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Gagal memuat detail visitor");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Visitor Detail</h2>
        <p className="text-sm text-zinc-600">Memuat...</p>
      </div>
    );
  }

  if (!visitor) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Visitor Detail</h2>
        <p className="text-sm text-red-500">{error || "Visitor tidak ditemukan"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Detail Tamu</h2>
        <p className="text-sm text-zinc-600">No. Register: {visitor.registerNumber}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wide">Nama</p>
          <p className="mt-1 text-sm text-gray-900 dark:text-white">{visitor.name}</p>

          <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wide mt-4">No. Telepon</p>
          <p className="mt-1 text-sm text-gray-900 dark:text-white">{visitor.phone}</p>

          <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wide mt-4">Tujuan</p>
          <p className="mt-1 text-sm text-gray-900 dark:text-white">{visitor.department?.name}</p>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wide">Alamat</p>
          <p className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{visitor.address}</p>

          <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wide mt-4">Keperluan</p>
          <p className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{visitor.purpose}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Upload File</h3>
          <span className="text-xs text-gray-500 dark:text-white/40">{visitor.uploadedFiles?.length || 0} file</span>
        </div>

        {visitor.uploadedFiles?.length ? (
          <ul className="mt-3 space-y-2">
            {visitor.uploadedFiles.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">{f.originalName}</p>
                  <p className="text-xs text-gray-500 dark:text-white/40 font-mono">{f.fileType}</p>
                </div>

                <a
                  href={f.filePath}
                  target="_blank"
                  rel="noreferrer"
                  download={f.originalName}
                  className="shrink-0 inline-flex items-center justify-center px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-gray-500 dark:text-white/40">Belum ada file upload.</p>
        )}
      </div>
    </div>
  );
}

