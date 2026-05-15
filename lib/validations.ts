import { z } from "zod";

// ==========================================
// AUTH VALIDATIONS
// ==========================================
export const loginSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username maksimal 50 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(100, "Password terlalu panjang"),
});

// ==========================================
// VISITOR VALIDATIONS
// ==========================================
export const visitorSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter")
    .regex(/^[a-zA-Z\s,.'()-]+$/, "Nama mengandung karakter tidak valid"),
  address: z
    .string()
    .min(10, "Alamat minimal 10 karakter")
    .max(500, "Alamat maksimal 500 karakter"),
  phone: z
    .string()
    .min(10, "Nomor telepon minimal 10 digit")
    .max(15, "Nomor telepon maksimal 15 digit")
    .regex(/^[0-9+\-\s()]+$/, "Format nomor telepon tidak valid"),
  purpose: z
    .string()
    .min(5, "Keperluan minimal 5 karakter")
    .max(1000, "Keperluan maksimal 1000 karakter"),
  departmentId: z
    .string()
    .min(1, "Pilih tujuan/bagian terlebih dahulu"),
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
});

export type VisitorFormData = z.infer<typeof visitorSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;

// ==========================================
// UPLOAD VALIDATION
// ==========================================
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "Ukuran file maksimal 10MB" };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Format file tidak didukung. Gunakan JPG, PNG, WebP, atau PDF",
    };
  }
  return { valid: true };
}