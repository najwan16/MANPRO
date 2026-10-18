# SiMagang MVP v3 — Pre-Internship Work Simulation

**SiMagang adalah prototipe akademik Manajemen Produk** untuk mencoba pekerjaan System Analyst secara gratis, melihat feedback, lalu menjalankan satu proyek lengkap melalui *demo checkout*. Pengguna mengirim setiap tugas satu kali, memperoleh penilaian berbasis aturan, dan dapat mengunduh portofolio latihan maupun sertifikat bila memenuhi syarat.

> **TRANSPARANSI:** perusahaan dan supervisor fiktif. Mode autentikasi, checkout, entitlement, sertifikat, dan penyimpanan menggunakan browser lokal. Tidak menerima pembayaran sungguhan, tidak memiliki mitra resmi, tidak menerbitkan sertifikasi profesi, dan tidak membuktikan dampak penempatan kerja.

## Cara paling mudah: jalankan TANPA menginstal paket npm

Membutuhkan **Node.js 20.19+ atau 22.12+** (disarankan Node 22).

```bash
cd SiMagang-MVP-v3
npm run demo
```

Buka `http://localhost:4173/#/home`. Mode ini menggunakan server HTTP bawaan Node.js; **tidak membutuhkan `npm install`**. Windows juga dapat melakukan double-click `start-demo-windows.bat`. Jangan buka `index.html` langsung menggunakan `file://`, karena browser memblokir ES modules lokal dan jalur aset.

## Pengembangan normal dengan Vite + Vanilla JS + Tailwind CSS v4

Jika akses ke npm registry tersedia:

```bash
npm install
npm run dev
npm run build
npm run preview
```

- `vite.config.js` mengaktifkan `@tailwindcss/vite`.
- `src/tailwind-entry.css` mengimpor Tailwind v4; `src/styles.css` menyimpan token dan komponen UI khusus agar jalur demo offline dapat dibuka tanpa build.
- JavaScript menggunakan native ES modules dan Vanilla JS, tanpa React.
- `npm run demo` berfungsi sebagai preview independen dari bundler Vite (Tailwind utilities tambahan hanya diproses dalam mode Vite; antarmuka utama sudah distyling melalui `styles.css`).

## Jalur demonstrasi investor (6–8 menit)

1. Beranda `#/home`: mulai dari **Coba Tugas Gratis**.
2. `#/free`: pilih tiga keputusan mengenai benturan ruang rapat → Submit.
3. `#/free-result`: lihat skor objektif, feedback, dan contoh deliverable premium.
4. `#/checkout/system-analyst`: form login demo otomatis jika belum masuk. Gunakan nama contoh + `andi@example.com` (tanpa password).
5. Checkout demo: pilih ilustrasi QRIS/E-Wallet/VA → **Aktifkan Akses Demo** (tidak ada transaksi).
6. Briefing supervisor `#/welcome`, tekan **Mulai Proyek**.
7. Kerjakan Tugas 1 `Requirement Identification` (termasuk memo analis minimal 25 karakter), kirim tugas, lalu lihat nilai dan feedback. Lanjutkan Tugas 2 dan 3 dengan cara sama; tulis user story sendiri (minimal 30 karakter) dan pertanyaan klarifikasi (minimal 25 karakter). Teks yang ditulis ikut masuk portofolio tetapi tidak dinilai otomatis.
8. `#/report` menampilkan nilai tiga tugas. `#/portfolio` menampilkan dan mengunduh artefak. `#/certificate` memberi sertifikat apabila rerata tertimbang **minimal 70** dan ketiga tugas selesai.

**Catatan:** Tinjau jawaban sebelum mengirim karena setiap tugas hanya dapat dikirim sekali dalam satu percobaan. Sertifikat tidak otomatis tersedia hanya karena checkout.

## Katalog

| Simulasi | Status |
|---|---|
| System Analyst — Requirement Analysis & Validation | **Fungsional lengkap** |
| Data Analyst | Preview, checkout nonaktif |
| UI/UX Designer | Preview, checkout nonaktif |
| Digital Marketing | Preview, checkout nonaktif |

Semua perusahaan dan konteks adalah fiktif. Tool internal berbentuk structured workspace yang dapat digunakan dan artefak diunduh sebagai Markdown (`.md`). Link diagrams.net pada tugas User Story merupakan latihan opsional; file eksternal tidak dinilai otomatis.

## Data dan reset

Data disimpan di `localStorage` dengan kunci `simagang:v3:demo`. Akses demo dikaitkan dengan email identitas simulasi (bukan verifikasi email sungguhan). Keadaan akan tersimpan setelah refresh pada browser yang sama. Tombol **Reset seluruh data demo** terdapat di Dashboard. Jangan gunakan email, kata sandi, atau informasi pribadi sensitif yang sungguhan pada demo.

## Penilaian dan kredensial

- Semua penilaian **deterministik dan client-side untuk demo**, bukan asesmen profesional, keamanan produksi, atau machine learning.
- Penilaian pilihan terstruktur berbeda dari **teks asli peserta**: peserta wajib menulis memo, user story dan pertanyaan klarifikasi. Ketiganya disimpan pada artefak, tetapi tidak dinilai otomatis.
- Setiap task memiliki rubrik dan bobot dari `src/data/systemAnalyst.js`.
- Setiap tugas dinilai sekali dengan rubrik `SA-DEMO-2026.1` setelah dikirim.
- Feedback tersedia setelah tugas dikirim; portofolio dan laporan tersedia setelah semua tugas selesai. Hasil lama dari alur sebelumnya tetap dapat dibaca.
- Sertifikat adalah **Certificate of Completion DEMO**, memiliki ID lokal yang **tidak dapat diverifikasi publik**.

## Quality checks

```bash
npm run check
npm test
```

`npm run check` memeriksa file inti, sintaks, dan penanda alur. `npm test` menguji scoring, akses per akun, satu pengiriman tiap tugas, kelulusan, dan pembacaan hasil lama. Jalur UI visual dapat diuji secara manual memakai `docs/TESTING.md`.

## Peta dokumentasi

- `docs/USER_FLOW.md` — navigasi dan kondisi setiap langkah
- `docs/PAGE_SPECIFICATIONS.md` — halaman, aksi, dan empty/error cases
- `docs/UI_UX_GUIDELINES.md` — palet dan aturan desain
- `docs/SIMULATION_DESIGN.md` — case perusahaan dan spesifikasi tugas
- `docs/ASSESSMENT_RUBRIC.md` — bobot, aturan, validitas, sertifikat
- `docs/DATABASE_SCHEMA.md` — rancangan relasional PostgreSQL dan RLS
- `docs/API_CONTRACT.md` — interface service dan respons
- `docs/BACKEND_HANDOFF.md` — langkah migrasi Supabase serta keamanan
- `docs/BUSINESS_MODEL.md` — hipotesis pasar dan unit economics
- `docs/MONETIZATION_DEMO.md` — batasan transaksi demo
- `docs/TESTING.md` — manual & automated test plan
- `docs/DEMO_GUIDE.md` — skrip presentasi untuk dosen investor
- `docs/PROJECT_OVERVIEW.md` — tujuan dan batas MVP

## Teknologi

Vite · Vanilla JavaScript (ES Modules) · Tailwind CSS v4 · CSS Design System Custom · Supabase Auth/PostgreSQL/RLS/Edge Functions **sebagai rancangan integrasi**, belum tersambung.
