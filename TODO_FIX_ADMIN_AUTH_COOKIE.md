# Fix Admin Auth: gunakan cookie `auth-token` untuk API

## Tujuan
- Endpoint admin harus mengakui admin dari cookie `auth-token`.
- Hilangkan ketergantungan pada header `x-user-*` yang tidak selalu tersedia.

## Langkah
1. Tambahkan helper di `lib/auth.ts` untuk baca token dari `NextRequest` dan verifikasi.
2. Ubah `getUserFromRequest` (atau buat function baru) agar bisa mengambil dari cookie.
3. Update endpoint API admin:
   - `app/api/dashboard/route.ts`
   - `app/api/visitors/route.ts` (GET)
   - `app/api/visitors/[id]/route.ts` (GET/PUT/DELETE)
4. Pastikan UI tidak menganggap unauthorized sebagai kosong.

