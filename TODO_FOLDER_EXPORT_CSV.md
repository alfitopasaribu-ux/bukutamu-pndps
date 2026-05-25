# TODO - Folder & Export CSV per Tujuan (Ketua/Wakil/Hakim/Panitera Muda)

## Tujuan
Admin tidak lagi melihat rekap agregat yang berantakan. Admin harus memilih **folder** (mis. Ketua Pengadilan, Panitera Muda Pidana, dll) sehingga:
- daftar tamu di dalam folder **hanya yang tujuannya sesuai**
- download CSV berisi daftar tamu detail, bukan rekap count

## Mapping awal dari data Anda
- Ketua Pengadilan -> keyword: "pak ketua", "mau ketemu pak ketua", "Ketua Pengadilan"
- Panitera Muda Pidana -> keyword: "Panitera Muda Pidana" atau "mau main main" / "mau ketemu" (butuh dipetakan pakai value department/purpose yang pasti)

## Langkah implementasi
1. [ ] Pastikan sumber “tujuan folder” yang benar:
   - cek apakah kategori Ketua/Hakim/Panitera Muda berasal dari **department.name** (Tujuan/Bagian) atau dari **purpose** (Keperluan)
   - dari contoh Anda: 
     - department = Ketua Pengadilan, purpose = "mau ketemu pak ketua"
     - department = Panitera Muda Pidana, purpose = "mau main main" / "mau ketemu aja"
2. [ ] Buat endpoint baru:
   - `/api/reports/visitors-by-folder` (atau `visitors-by-department-detail`)
   - output CSV berisi field:
     - date (local tz)
     - registerNumber, name, phone
     - purpose, status
     - departmentId, departmentName
3. [ ] Buat UI baru di admin:
   - halaman “Folder” (pilih department parent/child sesuai struktur)
   - saat folder dipilih, fetch daftar visitors detail + tombol export CSV
4. [ ] Sinkron timezone Bali/offset (pakai tzOffsetMinutes dari browser) seperti sebelumnya.
5. [ ] Validasi:
   - Saat 4 entri dengan 2 per kategori, harus tampil 2 di folder masing-masing.


