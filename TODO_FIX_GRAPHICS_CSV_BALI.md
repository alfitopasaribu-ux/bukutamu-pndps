# TODO - Perbaikan Grafik Kunjungan Tamu & Download CSV (Time Zone Bali + Dimensi Laporan)

## Langkah 1 — Analisis kode yang ada
- [x] Cek endpoint export CSV: `app/api/reports/visitors-by-department-day/route.ts`
- [x] Cek endpoint dashboard: `app/api/dashboard/route.ts`
- [x] Cek endpoint debug entrySource: `app/api/debug/visitors-entrysource-summary/route.ts`
- [ ] Identifikasi tempat filter `entrySource` dan filter `visitDate` dipakai
- [ ] Identifikasi mismatch grafis vs CSV (range hari & timezone)

## Langkah 2 — Perbaikan timezone Bali (utama)
- [ ] Buat helper util di server untuk konversi tanggal ke zona waktu Bali (Asia/Makassar / UTC+8)
- [ ] Terapkan helper itu di semua query agregasi berbasis `visitDate`:
  - export CSV per hari
  - dashboard last30Days / last12Months
  - debug ringkasan per hari

## Langkah 3 — Samakan filter entrySource
- [ ] Ubah export CSV & dashboard agar bisa memilih `entrySource` atau default `ALL`
- [ ] Pastikan input `entrySource` default mengikuti kebutuhan user (buku tamu daftar / public)

## Langkah 4 — Perbaikan struktur laporan “per sub bagian / ketua”
- [ ] Tentukan mapping data “ketua” dari field yang tersedia di schema
- [ ] Tambahkan endpoint baru (atau parameter mode) untuk grouping sesuai sub bagian
- [ ] Sesuaikan UI grafik & CSV agar bisa memilih mode grouping

## Langkah 5 — Validasi
- [ ] Tambahkan 2 tamu (sesuai contoh) dengan `visitDate` now
- [ ] Cek debug entrySource summary untuk tanggal target (Senin 25 Mei)
- [ ] Download CSV untuk range yang sama (7 hari / 30 hari) dan pastikan total 2
- [ ] Grafik “7 Hari” harus menunjukkan hari tertinggi Senin 25 Mei = 2


