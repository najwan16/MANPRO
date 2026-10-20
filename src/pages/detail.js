import { api } from "../services/index.js";
import { ico, A, pill, logo } from "../components/ui.js";
import { esc } from "../utils/helpers.js";
import { getSimulation, getCompany, rupiah, CASE } from "../data/catalog.js";
import { tasks } from "../data/systemAnalyst.js";

export function DetailPage(id) {
  const p = getSimulation(id || "system-analyst");
  if (!p) {
    return `<section class="container page-pad empty-state"><h1>Simulasi tidak ditemukan</h1>${A("explore", "Kembali ke Katalog")}</section>`;
  }

  const company = getCompany(p.company);
  const s = api.state();
  const isFreeDone = Boolean(s.freeTaskSubmitted);
  const active = api.getActive();

  return `<section class="container page-pad detail-page"><div class="breadcrumbs"><a href="#/explore">Eksplorasi</a>${ico("chevron")}<span>${esc(p.role)}</span></div>
    
    <div class="detail-header"><div><div class="pill-row">${pill(p.status === "ready" ? "Tersedia" : "Segera Hadir", p.status === "ready" ? "green" : "gray")}${pill(p.level, "soft")}</div><h1>${esc(p.role)}</h1><p class="detail-teaser">${esc(p.teaser)}</p><div class="detail-company">${logo(company)}<div><b>${esc(company.name)}</b><span>${esc(company.industry)} · ${esc(company.scale)} · Perusahaan fiktif</span></div></div></div>
      <div class="content-panel detail-card"><h3>${p.status === "ready" ? rupiah(p.price) : "Belum Tersedia"}</h3><p>${p.status === "ready" ? "Akses simulasi terstruktur, evaluasi jawaban, laporan kinerja, dan sertifikat." : "Posisi ini sedang dalam penyusunan studi kasus."}</p>
      ${p.status === "ready" ? (active ? A("workspace/" + active.tasks?.requirements?.final ? "userstory" : "requirements", `Lanjutkan Simulasi ${ico("arrow")}`, "primary btn-lg") : s.hasAccess ? A("welcome", `Mulai Proyek ${ico("arrow")}`, "primary btn-lg") : `${A("checkout", `Aktifkan Akses (${rupiah(p.price)}) ${ico("arrow")}`, "primary btn-lg")}${A("free", isFreeDone ? "Lihat Hasil Tugas Gratis" : "Coba Tugas Gratis Tanpa Akun", "light")}`) : `<button class="btn btn-primary btn-lg" disabled>Belum Tersedia</button>`}
      </div></div>
    
    <div class="detail-grid"><div class="detail-main"><section class="content-panel"><h2>Gambaran Proyek</h2><p>${esc(p.overview)}</p><b>Yang akan kamu pelajari:</b><div class="chip-row">${p.skills.map((skill) => `<span class="chip">${esc(skill)}</span>`).join("")}</div></section>
    
    <section class="content-panel"><h2>Silabus & Deliverable Tugas</h2><div class="syllabus-list">${tasks.map((task) => `<div class="syllabus-item"><span class="syll-num">0${task.number}</span><div><h3>${esc(task.title)}</h3><p>${esc(task.description)}</p><b>Hasil:${esc(task.deliverable)}</b></div></div>`).join("")}</div></section></div>
    
    <aside class="detail-sidebar"><div class="content-panel"><h3>Tentang Perusahaan Fiktif</h3><p>${esc(company.about)}</p><b>Studi Kasus Proyek</b><p><b>${esc(CASE.name)}</b>: ${esc(CASE.problem)}</p></div></aside></div></section>`;
}