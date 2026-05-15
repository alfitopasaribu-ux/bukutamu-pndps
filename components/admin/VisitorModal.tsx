"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, User, MapPin, Phone, FileText, Building2 } from "lucide-react";
import { toast } from "sonner";
import { visitorSchema, VisitorFormData } from "@/lib/validations";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/utils";
import DepartmentSelect from "@/components/shared/DepartmentSelect";


interface Department {
  id: string;
  name: string;
  children: Department[];
}

export default function VisitorModal({
  isOpen,
  onClose,
  visitor,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  visitor: any | null;
  onSuccess: () => void;
}) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!visitor;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VisitorFormData>({
    resolver: zodResolver(visitorSchema),
    defaultValues: visitor
      ? {
          name: visitor.name,
          address: visitor.address,
          phone: visitor.phone,
          purpose: visitor.purpose,
          departmentId: visitor.department?.id || visitor.departmentId,
          notes: visitor.notes || "",
        }
      : {},
  });

  useEffect(() => {
    if (isOpen) {
      fetch("/api/departments")
        .then((r) => r.json())
        .then((d) => setDepartments(d.data || []));
    }
  }, [isOpen]);

  useEffect(() => {
    if (visitor) {
      reset({
        name: visitor.name,
        address: visitor.address,
        phone: visitor.phone,
        purpose: visitor.purpose,
        departmentId: visitor.department?.id || visitor.departmentId,
        notes: visitor.notes || "",
      });
    } else {
      reset({ name: "", address: "", phone: "", purpose: "", departmentId: "", notes: "" });
    }
  }, [visitor, reset]);

  const onSubmit = async (data: VisitorFormData) => {
    setIsLoading(true);
    try {
      const url = isEditing ? `/api/visitors/${visitor.id}` : "/api/visitors";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || "Operasi gagal");
        return;
      }

      toast.success(isEditing ? "Data tamu berhasil diupdate" : `Tamu terdaftar: ${result.registerNumber}`);
      onSuccess();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-[#0d1525] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
                <div>
                  <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">
                    {isEditing ? "Edit Data Tamu" : "Tambah Tamu Baru"}
                  </h2>
                  {isEditing && (
                    <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-md text-xs font-medium ${getStatusBadgeColor(visitor?.status)}`}>
                      {getStatusLabel(visitor?.status)}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                {isEditing && (
                  <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl px-4 py-2.5">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                      No. Register: {visitor?.registerNumber}
                    </p>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wide mb-1.5">
                    Nama Lengkap *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-white/20" />
                    <input
                      {...register("name")}
                      placeholder="Nama lengkap tamu"
                      className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-red-500 text-xs">{errors.name.message}</p>}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wide mb-1.5">
                    Alamat *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-300 dark:text-white/20" />
                    <textarea
                      {...register("address")}
                      placeholder="Alamat lengkap"
                      rows={2}
                      className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none"
                    />
                  </div>
                  {errors.address && <p className="mt-1 text-red-500 text-xs">{errors.address.message}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wide mb-1.5">
                    No. Telepon *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-white/20" />
                    <input
                      {...register("phone")}
                      placeholder="08xxxxxxxxxx"
                      className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-red-500 text-xs">{errors.phone.message}</p>}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wide mb-1.5">
                    Tujuan / Bagian *
                  </label>
                  <DepartmentSelect
                    value={watch("departmentId") ?? ""}
                    onChange={(v) => setValue("departmentId", v, { shouldValidate: true })}
                    error={errors.departmentId?.message}
                  />
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wide mb-1.5">
                    Keperluan *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-300 dark:text-white/20" />
                    <textarea
                      {...register("purpose")}
                      placeholder="Jelaskan keperluan kunjungan"
                      rows={3}
                      className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none"
                    />
                  </div>
                  {errors.purpose && <p className="mt-1 text-red-500 text-xs">{errors.purpose.message}</p>}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                    ) : (
                      isEditing ? "Simpan Perubahan" : "Daftarkan Tamu"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}