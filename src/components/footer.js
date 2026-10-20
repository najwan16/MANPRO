import { ico } from "./ui.js";
import { esc } from "../utils/helpers.js";
import { simulations } from "../data/catalog.js";

export function Footer(s) {
  return `<footer class="footer site-footer"><div class="container footer-inner"><div class="footer-top"><a class="brand footer-brand" href="#/dashboard" aria-label="SiMagang, ke Dashboard"><span class="brand-icon">${ico("briefcase")}</span><span>Si<span class="brand-accent">Magang</span></span></a><span>Persiapan magang melalui pengalaman kerja berbasis simulasi.</span></div>
    <div class="footer-columns"><div class="footer-mission"><p>Mulai dari latihan. Bangun bukti kemampuanmu.</p><small>Jelajahi peran, kerjakan tugas, dan lihat hasil pekerjaanmu.</small></div>
      <nav class="footer-column" aria-label="Navigasi peserta"><h2>Untuk Peserta</h2><a href="#/dashboard">Dashboard</a><a href="#/explore">Jelajahi Simulasi</a><a href="#/progress">Progres Saya</a></nav>
      <nav class="footer-column" aria-label="Daftar simulasi"><h2>Simulasi</h2>${simulations.map((item) => `<a href="#/detail/${esc(item.id)}">${esc(item.role)}</a>`).join("")}</nav>
      <nav class="footer-column" aria-label="Akun pengguna"><h2>Akun</h2>${s.user ? `<a href="#/profile">Profil Saya</a><a href="#/progress">Simulasi Saya</a>` : `<a href="#/auth">Masuk</a><a href="#/register">Daftar</a>`}</nav>
      <nav class="footer-column" aria-label="Informasi SiMagang"><h2>Informasi</h2><a href="#/about">Tentang SiMagang</a><a href="#/help">Pusat Bantuan</a><a href="#/privacy">Privasi Data Demo</a></nav></div>
    <div class="footer-bottom"><span>© ${new Date().getFullYear()} SiMagang</span><span>Simulasi pembelajaran · Perusahaan dalam studi kasus bersifat fiktif</span></div></div></footer>`;
}