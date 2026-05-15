import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Department tree — sama persis dengan sistem PTSP+ referensi ─────────────
const DEPARTMENTS = [
  // ── PTSP (root nodes, tampil paling atas dropdown) ──────────────────────
  { id: "d_ptsp_pid", code: "PTSP_PID", name: "Pelayanan Terpadu Satu Pintu Kepaniteraan Muda Pidana", parentId: null, order: 1 },
  { id: "d_ptsp_pidk", code: "PTSP_PIDK", name: "Pelayanan Terpadu Satu Pintu Kepaniteraan Muda Pidana Khusus", parentId: null, order: 2 },
  { id: "d_ptsp_per", code: "PTSP_PER", name: "Pelayanan Terpadu Satu Pintu Kepaniteraan Muda Perdata", parentId: null, order: 3 },
  { id: "d_ptsp_perk", code: "PTSP_PERK", name: "Pelayanan Terpadu Satu Pintu Kepaniteraan Muda Perdata Khusus", parentId: null, order: 4 },
  { id: "d_ptsp_hk", code: "PTSP_HK", name: "Pelayanan Terpadu Satu Pintu Kepaniteraan Muda Hukum", parentId: null, order: 5 },
  { id: "d_ptsp_umum", code: "PTSP_UMUM", name: "Pelayanan Terpadu Satu Pintu Sub Bagian Umum", parentId: null, order: 6 },
  { id: "d_ptsp_info", code: "PTSP_INFO", name: "Pelayanan Terpadu Satu Pintu Informasi dan Pengaduan", parentId: null, order: 7 },

  // ── Pimpinan ─────────────────────────────────────────────────────────────
  { id: "d_ketua", code: "KETUA", name: "Ketua Pengadilan", parentId: null, order: 10 },
  { id: "d_wkil", code: "WKIL", name: "Wakil Ketua Pengadilan", parentId: null, order: 11 },
  { id: "d_hakim", code: "HAKIM", name: "Hakim", parentId: null, order: 12 },

  // ── Panitera & jajaran ───────────────────────────────────────────────────
  { id: "d_pan", code: "PAN", name: "Panitera", parentId: null, order: 20 },
  { id: "d_panmud_pid", code: "PANMUD_PID", name: "Panitera Muda Pidana", parentId: "d_pan", order: 21 },
  { id: "d_staf_pid", code: "STAF_PID", name: "Staf Panitera Muda Pidana", parentId: "d_panmud_pid", order: 22 },
  { id: "d_panmud_per", code: "PANMUD_PER", name: "Panitera Muda Perdata", parentId: "d_pan", order: 23 },
  { id: "d_staf_per", code: "STAF_PER", name: "Staf Panitera Muda Perdata", parentId: "d_panmud_per", order: 24 },
  { id: "d_panmud_hk", code: "PANMUD_HK", name: "Panitera Muda Hukum", parentId: "d_pan", order: 25 },
  { id: "d_staf_hk", code: "STAF_HK", name: "Staf Panitera Muda Hukum", parentId: "d_panmud_hk", order: 26 },
  { id: "d_panmud_tipikor", code: "PANMUD_TIPIKOR", name: "Panitera Muda Tindak Pidana Korupsi", parentId: "d_pan", order: 27 },
  { id: "d_staf_tipikor", code: "STAF_TIPIKOR", name: "Staf Panitera Muda Tindak Pidana Korupsi", parentId: "d_panmud_tipikor", order: 28 },
  { id: "d_panmud_perikanan", code: "PANMUD_PERIKANAN", name: "Panitera Muda Khusus Perikanan", parentId: "d_pan", order: 29 },
  { id: "d_staf_perikanan", code: "STAF_PERIKANAN", name: "Staf Panitera Muda Khusus Perikanan", parentId: "d_panmud_perikanan", order: 30 },
  { id: "d_panmud_niaga", code: "PANMUD_NIAGA", name: "Panitera Muda Khusus Niaga", parentId: "d_pan", order: 31 },
  { id: "d_staf_niaga", code: "STAF_NIAGA", name: "Staf Panitera Muda Khusus Niaga", parentId: "d_panmud_niaga", order: 32 },
  { id: "d_panmud_phi", code: "PANMUD_PHI", name: "Panitera Muda Khusus PHI", parentId: "d_pan", order: 33 },
  { id: "d_staf_phi", code: "STAF_PHI", name: "Staf Panitera Muda Khusus PHI", parentId: "d_panmud_phi", order: 34 },
  { id: "d_panmud_ham", code: "PANMUD_HAM", name: "Panitera Muda Khusus HAM", parentId: "d_pan", order: 35 },
  { id: "d_staf_ham", code: "STAF_HAM", name: "Staf Panitera Muda Khusus HAM", parentId: "d_panmud_ham", order: 36 },
  { id: "d_wkil_pan", code: "WKIL_PAN", name: "Wakil Panitera", parentId: "d_pan", order: 37 },
  { id: "d_pan_pengganti", code: "PAN_PENGGANTI", name: "Panitera Pengganti", parentId: "d_pan", order: 38 },
  { id: "d_jurusita", code: "JURUSITA", name: "Jurusita / Jurusita Pengganti", parentId: "d_pan", order: 39 },

  // ── Sekretaris & jajaran ─────────────────────────────────────────────────
  { id: "d_sekretaris", code: "SEKRETARIS", name: "Sekretaris", parentId: null, order: 50 },
  { id: "d_kabag_umum", code: "KABAG_UMUM", name: "Kepala Bagian Umum", parentId: "d_sekretaris", order: 51 },
  { id: "d_kasubag_kepeg", code: "KASUBAG_KEPEG", name: "Kepala Sub Bagian Kepegawaian, Organisasi dan Tatalaksana", parentId: "d_kabag_umum", order: 52 },
  { id: "d_staf_kepeg", code: "STAF_KEPEG", name: "Staf Sub Bagian Kepegawaian, Organisasi dan Tatalaksana", parentId: "d_kasubag_kepeg", order: 53 },
  { id: "d_kasubag_it", code: "KASUBAG_IT", name: "Kepala Sub Bagian Perencanaan, Teknologi Informasi dan Pelaporan", parentId: "d_kabag_umum", order: 54 },
  { id: "d_staf_it", code: "STAF_IT", name: "Staf Sub Bagian Perencanaan, Teknologi Informasi dan Pelaporan", parentId: "d_kasubag_it", order: 55 },
  { id: "d_kasubag_keu", code: "KASUBAG_KEU", name: "Kepala Sub Bagian Umum dan Keuangan", parentId: "d_kabag_umum", order: 56 },
  { id: "d_staf_keu", code: "STAF_KEU", name: "Staf Sub Bagian Umum dan Keuangan", parentId: "d_kasubag_keu", order: 57 },
];

async function main() {
  console.log("🌱 Starting database seed...\n");

  // ── Admin user ─────────────────────────────────────────────────────────────
  const hashed = await bcrypt.hash("PNDPS2026", 12);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      id: "user_admin_001",
      username: "admin",
      password: hashed,
      name: "Administrator PTSP",
      email: "admin@pn-denpasar.go.id",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });
  console.log("✅ Admin:", admin.username, "/ password: PNDPS2026");

  // ── Departments — insert parent-first (root nodes first) ───────────────
  const roots = DEPARTMENTS.filter((d) => d.parentId === null);
  for (const d of roots) {
    await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, order: d.order },
      create: {
        id: d.id,
        code: d.code,
        name: d.name,
        parentId: null,
        order: d.order,
        isActive: true,
      },
    });
  }

  const level1 = DEPARTMENTS.filter(
    (d) => d.parentId !== null && DEPARTMENTS.find((p) => p.id === d.parentId)?.parentId === null
  );
  for (const d of level1) {
    await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, order: d.order },
      create: {
        id: d.id,
        code: d.code,
        name: d.name,
        parentId: d.parentId,
        order: d.order,
        isActive: true,
      },
    });
  }

  const level2 = DEPARTMENTS.filter(
    (d) => d.parentId !== null && DEPARTMENTS.find((p) => p.id === d.parentId)?.parentId !== null
  );
  for (const d of level2) {
    await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, order: d.order },
      create: {
        id: d.id,
        code: d.code,
        name: d.name,
        parentId: d.parentId,
        order: d.order,
        isActive: true,
      },
    });
  }

  console.log(`✅ Departments: ${DEPARTMENTS.length} bagian berhasil di-seed`);

  // ── Register counter ──────────────────────────────────────────────────────
  const year = new Date().getFullYear();
  await prisma.registerCounter.upsert({
    where: { year },
    update: {},
    create: { year, counter: 0 },
  });
  console.log(`✅ Register counter: tahun ${year} siap`);

  console.log("\n🎉 Seed selesai!");
  console.log("─────────────────────────────");
  console.log("  URL Login : http://localhost:3000/login");
  console.log("  Username  : admin");
  console.log("  Password  : PNDPS2026");
  console.log("─────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

