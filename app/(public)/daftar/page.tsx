"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  User,
  MapPin,
  Phone,
  FileText,
  Upload,
  CheckCircle2,
  Loader2,
  X,
  File,
  Image,
} from "lucide-react";
import { toast } from "sonner";
import {
  visitorSchema,
  VisitorFormData,
  validateFile,
} from "@/lib/validations";
import DepartmentSelect from "@/components/shared/DepartmentSelect";

export default function DaftarPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [success, setSuccess] = useState<{ registerNumber: string } | null>(
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VisitorFormData>({
    resolver: zodResolver(visitorSchema),
  });

  const onSubmit = async (data: VisitorFormData) => {
    if (isLoading) return;

    setIsLoading(true);
    setLoadingStep(1);
    setLoadingMessage("Menyimpan data tamu...");

    try {
      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          entrySource: "PUBLIC_FORM",
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || result.error || "Gagal mendaftar");
        return;
      }

      const newVisitorId = result?.data?.id;

      if (!newVisitorId) {
        toast.error("Data tamu berhasil dibuat, tetapi ID tamu tidak ditemukan.");
        return;
      }

      const uploadedCount = {
        ok: 0,
        total: uploadedFiles.length,
      };

      const uploadErrors: string[] = [];

      if (uploadedFiles.length > 0) {
        setLoadingStep(2);
        setLoadingMessage(
          uploadedFiles.length === 1
            ? "Mengupload dokumen..."
            : `Mengupload dokumen 1/${uploadedFiles.length}...`
        );

        for (let index = 0; index < uploadedFiles.length; index++) {
          const file = uploadedFiles[index];

          setLoadingMessage(
            uploadedFiles.length === 1
              ? "Mengupload dokumen..."
              : `Mengupload dokumen ${index + 1}/${uploadedFiles.length}...`
          );

          const formData = new FormData();
          formData.append("file", file);
          formData.append("visitorId", newVisitorId);

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            const errJson = await uploadRes.json().catch(() => ({}));

            uploadErrors.push(
              errJson?.details
                ? `${errJson.error}: ${errJson.details}`
                : errJson?.error || `Upload gagal untuk ${file.name}`
            );

            continue;
          }

          uploadedCount.ok += 1;
        }
      }

      setLoadingStep(3);
      setLoadingMessage("Menyelesaikan pendaftaran...");

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (uploadedCount.total > 0 && uploadedCount.ok === 0) {
        toast.error(uploadErrors[0] || "Upload dokumen gagal.");
      } else if (uploadedCount.total > 0 && uploadErrors.length > 0) {
        toast.error(
          `Upload: ${uploadedCount.ok}/${uploadedCount.total} berhasil. Sebagian gagal.`
        );
      } else if (uploadedCount.total > 0) {
        toast.success(
          `Dokumen berhasil diupload (${uploadedCount.ok}/${uploadedCount.total}).`
        );
      }

      setSuccess({
        registerNumber: result.registerNumber,
      });

      reset();
      setUploadedFiles([]);
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
      setLoadingStep(0);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isLoading) return;

    const files = Array.from(event.target.files || []);
    const validFiles: File[] = [];

    for (const file of files) {
      const validation = validateFile(file);

      if (!validation.valid) {
        toast.error(validation.error);
      } else {
        validFiles.push(file);
      }
    }

    setUploadedFiles((prev) => [...prev, ...validFiles].slice(0, 5));

    event.target.value = "";
  };

  const removeFile = (index: number) => {
    if (isLoading) return;

    setUploadedFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#07152c] px-4 py-10 text-white">
        <main className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="h-9 w-9 text-emerald-400" />
            </div>

            <h1 className="text-2xl font-bold tracking-wide">
              Registrasi Berhasil!
            </h1>

            <p className="mt-3 text-sm text-white/60">
              Nomor register Anda telah diterbitkan.
            </p>

            <div className="my-8 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Nomor Register
              </p>
              <p className="mt-2 break-words text-2xl font-bold text-blue-300">
                {success.registerNumber}
              </p>
            </div>

            <p className="text-sm leading-relaxed text-white/60">
              Silakan tunjukkan nomor register ini kepada petugas PTSP. Harap
              simpan nomor ini untuk keperluan pelacakan.
            </p>

            <button
              onClick={() => setSuccess(null)}
              className="mt-8 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Daftar Tamu Baru
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07152c] px-4 py-10 text-white">
      <main className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-[0.25em] text-white">
            SAPA TAMU PANDE
          </h1>
          <p className="mt-3 text-sm text-white/50">
            Sistem Administrasi Penerimaan Tamu Pengadilan
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl md:p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/60">
                Nama Lengkap *
              </label>

              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  {...register("name")}
                  disabled={isLoading}
                  placeholder="Masukkan nama lengkap"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-3 pl-10 pr-4 text-sm text-white placeholder-white/20 transition-all focus:border-blue-400/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-60"
                />
              </div>

              {errors.name && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/60">
                Alamat *
              </label>

              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-white/30" />
                <textarea
                  {...register("address")}
                  disabled={isLoading}
                  placeholder="Masukkan alamat lengkap"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.05] py-3 pl-10 pr-4 text-sm text-white placeholder-white/20 transition-all focus:border-blue-400/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-60"
                />
              </div>

              {errors.address && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/60">
                No. Telepon *
              </label>

              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  {...register("phone")}
                  type="tel"
                  disabled={isLoading}
                  placeholder="08xxxxxxxxxx"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-3 pl-10 pr-4 text-sm text-white placeholder-white/20 transition-all focus:border-blue-400/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-60"
                />
              </div>

              {errors.phone && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/60">
                Tujuan / Bagian *
              </label>

              <DepartmentSelect
                value={watch("departmentId") ?? ""}
                onChange={(value) =>
                  setValue("departmentId", value, { shouldValidate: true })
                }
                error={errors.departmentId?.message}
                dark
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/60">
                Keperluan / Alasan Kunjungan *
              </label>

              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-white/30" />
                <textarea
                  {...register("purpose")}
                  disabled={isLoading}
                  placeholder="Jelaskan keperluan kunjungan Anda"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.05] py-3 pl-10 pr-4 text-sm text-white placeholder-white/20 transition-all focus:border-blue-400/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-60"
                />
              </div>

              {errors.purpose && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.purpose.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/60">
                Upload Dokumen / Tanda Pengenal
                <span className="ml-2 normal-case text-white/30">
                  (Opsional — KTP, PDF, maks. 10MB)
                </span>
              </label>

              <label
                className={[
                  "group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/10 p-6 transition-all",
                  isLoading
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:border-blue-400/30",
                ].join(" ")}
              >
                <Upload className="h-8 w-8 text-white/20 transition-colors group-hover:text-blue-400/60" />

                <div className="text-center">
                  <p className="text-sm text-white/40">
                    Klik untuk upload atau seret file ke sini
                  </p>
                  <p className="mt-1 text-xs text-white/20">
                    JPG, PNG, WebP, PDF — Maks. 10MB
                  </p>
                </div>

                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  disabled={isLoading}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                    >
                      {file.type.startsWith("image/") ? (
                        <Image className="h-4 w-4 flex-shrink-0 text-blue-400" />
                      ) : (
                        <File className="h-4 w-4 flex-shrink-0 text-red-400" />
                      )}

                      <span className="flex-1 truncate text-xs text-white/70">
                        {file.name}
                      </span>

                      <span className="text-xs text-white/30">
                        {(file.size / 1024).toFixed(0)}KB
                      </span>

                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => removeFile(index)}
                        className="text-white/20 transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isLoading && (
              <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-300" />

                  <div>
                    <p className="text-sm font-semibold text-white">
                      {loadingMessage || "Memproses pendaftaran..."}
                    </p>
                    <p className="mt-1 text-xs text-white/50">
                      Mohon tunggu dan jangan tutup halaman ini.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { step: 1, label: "Data tamu" },
                    { step: 2, label: "Dokumen" },
                    { step: 3, label: "Selesai" },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className={[
                        "rounded-lg px-3 py-2 text-center text-xs font-semibold transition-all",
                        loadingStep >= item.step
                          ? "bg-blue-500 text-white"
                          : "bg-white/5 text-white/30",
                      ].join(" ")}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.99 }}
              className="w-full rounded-xl py-4 text-sm font-bold tracking-wide text-white transition-all disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                background: "linear-gradient(135deg, #1a4fd6 0%, #2d6aff 100%)",
                boxShadow: "0 8px 32px rgba(45, 106, 255, 0.35)",
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {loadingMessage || "Memproses pendaftaran..."}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Daftarkan Kunjungan
                </span>
              )}
            </motion.button>
          </form>
        </motion.div>

        <p className="mt-8 text-center font-mono text-xs text-white/20">
          © 2026 Pengadilan Negeri Denpasar — Sistem Buku Tamu Digital v3.0
        </p>
      </main>
    </div>
  );
}