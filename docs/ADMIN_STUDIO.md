# Admin Studio

## Kondisi proyek sebelum perubahan

- Aplikasi adalah Vite + Vanilla JavaScript + Tailwind CSS v4, menggunakan hash routing.
- Katalog lokal berisi simulasi System Analyst dan simulasi contoh lain; task mahasiswa dirender dari definisi `fields` yang lama.
- Supabase adapter dan migration admin sudah ada. Role produksi diperiksa lewat `admin_users` dan RPC `is_current_user_admin()`.
- Admin sebelumnya berupa form JSON untuk definisi simulasi dan task.
- Belum tersedia tabel kategori, bank soal terpisah, snapshot versi konten, atau submission review manual.
- Git bersih sebelum pekerjaan dimulai.

## Cara membuka

Jalankan `npm install` lalu `npm run dev`. Konfigurasi `VITE_APP_MODE=supabase`, `VITE_SUPABASE_URL`, dan `VITE_SUPABASE_ANON_KEY`. Setelah mendaftar dan memverifikasi email, pengelola yang berwenang harus menambahkan UUID user ke `public.admin_users` menggunakan panduan di [ADMIN_SETUP.md](./ADMIN_SETUP.md). Jangan mengandalkan metadata registrasi atau role browser. Route admin dan RPC memeriksa otorisasi backend.

## Alur editor yang tersedia

1. Buat/pilih perusahaan.
2. Isi nama simulasi, posisi, perusahaan, bidang, dan jumlah task (1–8).
3. Isi nama task, briefing, dan output. Tambahkan satu atau beberapa soal pada setiap task.
4. Pilih pilihan ganda, pilih beberapa jawaban, isian singkat, atau jawaban panjang. Isi opsi/kunci serta bobot dan feedback untuk tipe yang dinilai otomatis.
5. Validasi konten, lalu simpan sebagai draft atau status tersedia.

Soal ditampilkan dengan field editor visual. Saat disimpan, konten dipetakan ke `fields`, `expected`, `weights`, dan `feedback` yang dipakai katalog dan Workspace.

Preview yang tersedia hanya ringkasan, bukan replay interaktif Workspace. Jawaban panjang disimpan tanpa skor otomatis; antrean review manual belum tersedia.

## Perlindungan konten lama

Schema attempt belum menyimpan versi task. Migration guard baru menolak perubahan isi simulasi atau task dan penghapusan simulasi setelah ada attempt. Status katalog masih dapat diubah, misalnya ke `archived`, untuk mencegah pembelian baru sambil mempertahankan attempt lama. Untuk mengubah isi simulasi yang sudah digunakan, buat simulasi baru dengan ID baru. Ini menjaga konten yang ada tanpa mengubah jawaban/progress yang tersimpan.

Migration guard perlu diterapkan ke project Supabase sebelum mengandalkan perlindungan tersebut. Migration tidak dijalankan dari workspace ini.

## Batasan keamanan dan integrasi

- Supabase authorization yang sudah ada berlaku untuk route/operasi admin. Namun model katalog lama menyimpan jawaban/rubrik bersama definisi task yang dapat dibaca katalog publik; jangan publikasikan kunci jawaban sensitif sebelum skema grading dipindahkan ke sisi server dan kebijakan baca diperketat.
- Kategori saat ini merupakan teks pada definisi simulasi, belum CRUD tabel kategori dan tidak dijamin unik di database.
- Arsip perusahaan, duplicate-as-draft, setting, Question Bank, antrean review, upload privat, dan audit log belum tersedia.
- Builder menggunakan adapter `admin_save_simulation` yang tersedia pada migration admin.

## Verifikasi

- `npm run build` — berhasil.
- `npm test` — 14 tes lulus, termasuk validasi payload Admin Studio dan regresi alur mahasiswa.
- Tes browser untuk Supabase/RLS dan migration belum dijalankan.
