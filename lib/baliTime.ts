import { addMinutes } from "date-fns";

// DB menyimpan DateTime (timestamp). Untuk kebutuhan tampilan “tanggal Bali” (UTC+8),
// kita geser waktu dengan offset +8 agar range startOfDay/endOfDay sesuai tanggal lokal Bali.
//
// Konfigurasi:
// Endpoint ini awalnya dipakai untuk Bali (WITA, UTC+8).
// Supaya lebih fleksibel (WITA/WIB/WIT), offset dibuat bisa diubah lewat param.
// Default: WITA/Bali = UTC+8.
const DEFAULT_OFFSET_MINUTES = 8 * 60;

function toOffsetInstant(d: Date, offsetMinutes: number): Date {
  return addMinutes(d, offsetMinutes);
}

function fromOffsetInstant(d: Date, offsetMinutes: number): Date {
  return addMinutes(d, -offsetMinutes);
}

export function toBaliInstant(d: Date): Date {
  return toOffsetInstant(d, DEFAULT_OFFSET_MINUTES);
}

export function fromBaliInstant(d: Date): Date {
  return fromOffsetInstant(d, DEFAULT_OFFSET_MINUTES);
}

// Buat range query berdasarkan “tanggal YYYY-MM-DD” dalam zona Bali.
// input dateRef bisa berupa Date (yg mewakili waktu saat ini di server) atau string.
export function getBaliDayRange(dateRef: Date | string, offsetMinutes: number = DEFAULT_OFFSET_MINUTES) {
  const base = typeof dateRef === "string" ? new Date(dateRef) : dateRef;
  const bali = toBaliInstant(base);

  // Kita tidak pakai startOfDay/endOfDay dari date-fns langsung karena perlu pada basis “bali instant”.
  const year = bali.getFullYear();
  const month = bali.getMonth();
  const day = bali.getDate();

  const startBali = new Date(year, month, day, 0, 0, 0, 0);
  const endBali = new Date(year, month, day, 23, 59, 59, 999);

  return {
    start: fromBaliInstant(startBali),
    end: fromBaliInstant(endBali),
  };
}

