import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, formatStr = "dd MMMM yyyy") {
  return format(new Date(date), formatStr, { locale: id });
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: id });
}

export async function generateRegisterNumber(prisma: any): Promise<string> {
  const currentYear = new Date().getFullYear();

  // Atomic transaction untuk prevent duplicate
  const result = await prisma.$transaction(async (tx: any) => {
    const counter = await tx.registerCounter.upsert({
      where: { year: currentYear },
      update: { counter: { increment: 1 } },
      create: { year: currentYear, counter: 1 },
    });
    return counter.counter;
  });

  const paddedCounter = String(result).padStart(6, "0");
  return `PNDPS-${currentYear}-${paddedCounter}`;
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>'"&]/g, "")
    .trim()
    .substring(0, 1000);
}

export function getStatusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    REGISTERED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    CHECKED_IN: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    IN_PROGRESS: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    CHECKED_OUT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  return colors[status] || colors.REGISTERED;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    REGISTERED: "Terdaftar",
    CHECKED_IN: "Hadir",
    IN_PROGRESS: "Dalam Proses",
    COMPLETED: "Selesai",
    CHECKED_OUT: "Keluar",
    CANCELLED: "Dibatalkan",
  };
  return labels[status] || status;
}