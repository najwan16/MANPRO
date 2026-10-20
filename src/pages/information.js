import { ico, A } from "../components/ui.js";

export function InformationPage(kind) {
  const pages = {
    about: {
      label: "TENTANG SIMAGANG",
      title: "Latihan kerja sebelum magang.",
      intro: "SiMagang membantu mahasiswa mengenal pekerjaan melalui simulasi tugas berbasis studi kasus.",
      items: [
        ["Apa yang dapat dicoba?", "Jelajahi posisi pekerjaan, coba latihan singkat, lalu pilih simulasi lengkap jika ingin mengerjakan proyek terstruktur."],
        ["Apa hasil latihannya?", "Jawaban yang dikirim membentuk dokumen pekerjaan, umpan balik berdasarkan rubrik, dan laporan kinerja simulasi."],
        ["Apakah ini magang resmi?", "Bukan. Perusahaan dalam studi kasus bersifat fiktif dan sertifikat hanya menyatakan penyelesaian simulasi."],
      ],
    },
    help: {
      label: "PUSAT BANTUAN",
      title: "Bantuan menggunakan SiMagang.",
      intro: "Jawaban singkat untuk langkah yang paling sering dibutuhkan peserta.",
      items: [
        ["Bagaimana memulai?", "Buka Jelajahi Simulasi, pilih posisi, lalu baca rincian proyek. Latihan gratis dapat dicoba tanpa akun."],
        ["Bagaimana menyimpan progres?", "Daftar dengan identitas demo, konfirmasi akses simulasi, lalu kerjakan tugas secara berurutan."],
        ["Apakah pembelian demo menagih uang?", "Tidak. Konfirmasi pembelian pada versi ini hanya mengaktifkan akses simulasi di browser."],
        ["Di mana hasil saya?", "Buka Progres Saya. Setelah semua tugas selesai, laporan kinerja dan portofolio dapat diakses."],
      ],
    },
    privacy: {
      label: "PRIVASI DATA DEMO",
      title: "Data latihan tersimpan di browsermu.",
      intro: "Versi ini menggunakan penyimpanan lokal browser untuk identitas demo, akses simulasi, draf, dan hasil tugas.",
      items: [
        ["Data apa yang disimpan?", "Nama dan email demo, pengaturan profil, jawaban latihan, progres, serta catatan aktivasi akses."],
        ["Apakah data tersinkron ke akun daring?", "Belum. Data tidak berpindah otomatis ke perangkat lain. Jangan masukkan data pribadi sensitif."],
        ["Bagaimana menghapusnya?", "Gunakan tindakan reset atau bersihkan data situs melalui pengaturan browser."],
      ],
    },
  };

  const page = pages[kind];
  if (!page) return `<section class="container page-pad empty-state"><h1>Halaman tidak ditemukan</h1></section>`;

  return `<section class="container page-pad information-page"><div class="eyebrow">${page.label}</div><h1>${page.title}</h1><p class="page-intro">${page.intro}</p><div class="information-list">${page.items.map(([title, body]) => `<article class="content-panel"><h2>${title}</h2><p>${body}</p></article>`).join("")}</div><a class="btn btn-primary" href="#/explore">Jelajahi Simulasi ${ico("arrow")}</a></section>`;
}