# TODO - Buku Tamu PN Denpasar

## Prioritas: Folder + Download CSV di halaman Buku Tamu
- [ ] (DONE sebagian) Endpoint export detail per department: `app/api/reports/visitors-by-department-detail/route.ts`
- [ ] Update UI `components/admin/VisitorTable.tsx` menjadi mode folders:
  - [ ] Tambah select Tujuan/Bagian (pakai `components/shared/DepartmentSelect.tsx`)
  - [ ] Tambah range tanggal (dateFrom/dateTo) default 7 hari
  - [ ] Tambah tombol Download CSV Folder yang memanggil endpoint detail:
    - `/api/reports/visitors-by-department-detail?departmentId=...&dateFrom=...&dateTo=...`
- [ ] Pastikan download CSV menghasilkan isi yang sesuai kolom admin (tujuan) dan tidak berantakan

## Prioritas tambahan: sinkron Grafik Kunjungan Tamu
- [ ] Samakan timezone Bali untuk semua perhitungan berbasis `visitDate`.
- [ ] Pastikan grafik 7/30 hari konsisten dengan CSV.

