"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  User,
  MapPin,
  Phone,
  FileText,
  Building2,
  Upload,
  CheckCircle2,
  ChevronRight,
  Loader2,
  X,
  File,
  Image,
} from "lucide-react";
import { toast } from "sonner";
import { visitorSchema, VisitorFormData, validateFile } from "@/lib/validations";
import DepartmentSelect from "@/components/shared/DepartmentSelect";


interface Department {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  children: Department[];
}

export default function DaftarPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [success, setSuccess] = useState<{ registerNumber: string } | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);

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

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((data) => setDepartments(data.data || []));
  }, []);

  const onSubmit = async (data: VisitorFormData) => {
    setIsLoading(true);
    try {
      // 1. Create visitor
      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || "Gagal mendaftar");
        return;
      }

      const newVisitorId = result.data.id;
      setVisitorId(newVisitorId);

      // 2. Upload files if any
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("visitorId", newVisitorId);
          await fetch("/api/upload", { method: "POST", body: formData });
        }
      }

      setSuccess({ registerNumber: result.registerNumber });
      reset();
      setUploadedFiles([]);
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
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
  };

  // Build department tree for display
  const rootDepts = departments.filter((d) => !d.parentId);

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-blue-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-navy-900 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          </motion.div>
          <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Registrasi Berhasil!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Nomor register Anda telah diterbitkan
          </p>
          <div className="bg-navy-50 dark:bg-navy-800 rounded-2xl p-5 mb-6">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 font-mono">
              Nomor Register
            </p>
            <p className="font-mono text-2xl font-bold text-navy-700 dark:text-blue-400">
              {success.registerNumber}
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Silakan tunjukkan nomor register ini kepada petugas PTSP.
            Harap simpan nomor ini untuk keperluan pelacakan.
          </p>
          <button
            onClick={() => setSuccess(null)}
            className="w-full bg-navy-700 hover:bg-navy-800 text-white rounded-xl py-3 font-semibold transition-all"
          >
            Daftar Tamu Baru
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0d1f40] to-[#0a1628]">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/[0.03]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Scale className="w-8 h-8 text-yellow-400" />
          <div>
            <h1 className="font-display text-white font-bold text-lg leading-none">
              Pengadilan Negeri Denpasar
            </h1>
            <p className="text-white/40 text-xs font-mono mt-0.5">
              PTSP — Pelayanan Terpadu Satu Pintu
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
            Register Buku Tamu
          </h2>
          <p className="text-white/50">
            Isi formulir di bawah ini untuk mendaftarkan kunjungan Anda
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-white/60 text-xs font-medium tracking-wider uppercase mb-1.5">
                Nama Lengkap *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  {...register("name")}
                  placeholder="Masukkan nama lengkap"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/30 transition-all"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-red-400 text-xs">{errors.name.message}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-white/60 text-xs font-medium tracking-wider uppercase mb-1.5">
                Alamat *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-white/30" />
                <textarea
                  {...register("address")}
                  placeholder="Masukkan alamat lengkap"
                  rows={3}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/30 transition-all resize-none"
                />
              </div>
              {errors.address && (
                <p className="mt-1 text-red-400 text-xs">{errors.address.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-white/60 text-xs font-medium tracking-wider uppercase mb-1.5">
                No. Telepon *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  {...register("phone")}
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/30 transition-all"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-red-400 text-xs">{errors.phone.message}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-white/60 text-xs font-medium tracking-wider uppercase mb-1.5">
                Tujuan / Bagian *
              </label>
              <DepartmentSelect
                value={watch("departmentId") ?? ""}
                onChange={(v) => setValue("departmentId", v, { shouldValidate: true })}
                error={errors.departmentId?.message}
                dark={true}
              />
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-white/60 text-xs font-medium tracking-wider uppercase mb-1.5">
                Keperluan / Alasan Kunjungan *
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-white/30" />
                <textarea
                  {...register("purpose")}
                  placeholder="Jelaskan keperluan kunjungan Anda"
                  rows={4}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/30 transition-all resize-none"
                />
              </div>
              {errors.purpose && (
                <p className="mt-1 text-red-400 text-xs">{errors.purpose.message}</p>
              )}
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-white/60 text-xs font-medium tracking-wider uppercase mb-1.5">
                Upload Dokumen / Tanda Pengenal
                <span className="ml-2 text-white/30 normal-case">
                  (Opsional — KTP, PDF, maks. 10MB)
                </span>
              </label>

              <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/10 hover:border-blue-400/30 rounded-xl p-6 cursor-pointer transition-all group">
                <Upload className="w-8 h-8 text-white/20 group-hover:text-blue-400/60 transition-colors" />
                <div className="text-center">
                  <p className="text-white/40 text-sm">
                    Klik untuk upload atau seret file ke sini
                  </p>
                  <p className="text-white/20 text-xs mt-1">
                    JPG, PNG, WebP, PDF — Maks. 10MB
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {/* File list */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2"
                    >
                      {file.type.startsWith("image/") ? (
                        <Image className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      ) : (
                        <File className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                      <span className="text-white/70 text-xs flex-1 truncate">{file.name}</span>
                      <span className="text-white/30 text-xs">
                        {(file.size / 1024).toFixed(0)}KB
                      </span>
                      <button
                        type="button"
                        onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-white/20 hover:text-red-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-4 rounded-xl font-bold text-white text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{
                background: "linear-gradient(135deg, #1a4fd6 0%, #2d6aff 100%)",
                boxShadow: "0 8px 32px rgba(45, 106, 255, 0.35)",
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mendaftarkan...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Daftarkan Kunjungan
                </span>
              )}
            </motion.button>
          </form>
        </motion.div>

        <p className="text-center text-white/20 text-xs mt-8 font-mono">
          © 2026 Pengadilan Negeri Denpasar — Sistem Buku Tamu Digital v3.0
        </p>
      </main>
    </div>
  );
}