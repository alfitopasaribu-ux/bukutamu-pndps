# TODO - PTSP Pojok e-Court & Meja Inzage (via Department)

## Rencana Implementasi

1. Edit `prisma/seed.ts` untuk menambahkan 2 department baru:
   - PTSP_ECOURT: "Pelayanan Terpadu Satu Pintu Pojok e-Court" (parentId: `d_ptsp_info`)
   - PTSP_INZAGE: "Pelayanan Terpadu Satu Pintu Meja Inzage" (parentId: `d_ptsp_info`)
   - Pilih `order` setelah `PTSP_INFO` child yang ada (gunakan order > 7, misal 71/72).
2. Pastikan `code` unik dan konsisten (dipakai juga untuk insert SQL bila diperlukan).
3. Jalankan seed atau buat migration supaya Neon database ter-update:
   - opsi paling praktis: `npm run prisma db seed`
   - opsi lebih rapi: tambah migration insert ke tabel `departments`.
4. Verifikasi dropdown tujuan di `components/shared/DepartmentSelect.tsx` menampilkan 2 item baru.
