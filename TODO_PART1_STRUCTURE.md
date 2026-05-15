# TODO - Fix Koneksi Buku Tamu Admin, Upload File, dan Activity Log

## Checklist
1. [x] Fix error import `LoginParticles` di `app/(auth)/login/page.tsx`.
2. [ ] Fix auth API admin agar benar-benar membaca token dari cookie `auth-token`.
3. [ ] Pastikan endpoint admin (`/api/dashboard`, `/api/visitors`, `/api/visitors/[id]`) tidak lagi memakai header `x-user-*` yang tidak ter-set.
4. [ ] Pastikan Activity Log menampilkan data dari `recentLogs` yang benar.
5. [ ] Cek upload file: pastikan entri `UploadedFile` & `VisitLog(FILE_UPLOADED)` masuk dan muncul di admin (table/upload viewer).
6. [ ] Cek statistik: pastikan “bulan ini” benar (tidak selalu 7).
7. [ ] Cek total tamu harian/bulanan sinkron dengan filter `visitDate`.

