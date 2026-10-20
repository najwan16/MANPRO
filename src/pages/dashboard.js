import { api } from "../services/index.js";
import { ico, A } from "../components/ui.js";
import { esc, dated, displayName, avatarTone, initials } from "../utils/helpers.js";
import { CASE, getCompany } from "../data/catalog.js";
import { taskById } from "../data/systemAnalyst.js";

export function DashboardPage() {
  const s = api.state();
  const summary = api.getDashboardSummary();
  const name = String(s.user?.nickname || s.user?.name || "").trim();
  const greeting = name
    ? `Halo, ${esc(name.split(/\s+/)[0])}! 👋`
    : "Halo, selamat datang kembali!";
  
  const active = summary.active;
  const recent = summary.recentCompleted;
  const resultRoute = recent ? `/${encodeURIComponent(recent.id)}` : "";
  const continueRoute = active
    ? `workspace/${active.nextTaskId}`
    : summary.hasAccess
      ? "welcome"
      : summary.free
        ? "explore"
        : "free";

  const continueLabel = active
    ? "Lanjutkan Simulasi"
    : summary.hasAccess
      ? "Mulai Simulasi"
      : summary.free
        ? "Jelajahi Simulasi"
        : "Coba Tugas Gratis";

  return `<section class="dashboard-page"><div class="container dashboard-container">
    <header class="dashboard-welcome"><div><span class="dashboard-kicker">DASHBOARD MAHASISWA</span><h1>${greeting}</h1><p>Lanjutkan progresmu dan persiapkan diri untuk pengalaman magang yang lebih baik.</p></div><span class="profile-avatar dashboard-welcome-avatar tone-${avatarTone(s.user)}" aria-hidden="true">${esc(initials(displayName(s.user)))}</span></header>
    
    <section class="dashboard-section" aria-labelledby="dashboard-overview-title"><div class="dashboard-section-heading"><div><span class="dashboard-kicker">RINGKASAN</span><h2 id="dashboard-overview-title">Ringkasan</h2></div></div><div class="dashboard-overview-grid"><article class="dashboard-metric"><span class="dashboard-metric-icon">${ico("briefcase")}</span><div><span>Simulasi Diikuti</span><strong>${summary.joinedCount}</strong></div></article><article class="dashboard-metric"><span class="dashboard-metric-icon complete">${ico("check-circle")}</span><div><span>Simulasi Selesai</span><strong>${summary.completedCount}</strong></div></article></div></section>
    
    <section class="dashboard-section" aria-labelledby="dashboard-progress-title"><div class="dashboard-section-heading"><div><span class="dashboard-kicker">LANJUTKAN SIMULASI</span><h2 id="dashboard-progress-title">Progresmu</h2></div>${active ? A("progress", "Lihat semua progres", "light") : ""}</div>${active ? `<article class="dashboard-active-card"><div class="dashboard-active-top"><span class="dashboard-position-icon">${ico("workflow")}</span><div class="dashboard-active-identity"><span class="dashboard-status">Sedang Berlangsung</span><h3>System Analyst</h3><p>${esc(CASE.name)} <span aria-hidden="true">·</span> ${esc(getCompany("nusa").name)}</p></div></div><div class="dashboard-progress-meta"><b>${active.finishedTasks} dari ${active.totalTasks} tugas selesai</b><span>${Math.round((active.finishedTasks / active.totalTasks) * 100)}%</span></div><div class="dashboard-progress-track" role="progressbar" aria-label="Progres simulasi System Analyst" aria-valuemin="0" aria-valuemax="${active.totalTasks}" aria-valuenow="${active.finishedTasks}"><span style="width:${(active.finishedTasks / active.totalTasks) * 100}%"></span></div><p class="dashboard-next-task">Berikutnya: ${esc(taskById(active.nextTaskId)?.title || "Lanjutkan tugas")}</p>${A(continueRoute, `Lanjutkan Simulasi ${ico("arrow")}`, "primary")}</article>` : `<div class="dashboard-empty-card"><span class="dashboard-empty-icon">${ico(recent ? "check-circle" : "workflow")}</span><div><h3>${recent ? "Simulasi terakhirmu sudah selesai." : "Belum ada simulasi yang sedang kamu kerjakan."}</h3><p>${recent ? "Lihat hasil pekerjaanmu atau jelajahi posisi lain." : summary.hasAccess ? "Proyek System Analyst siap dimulai." : "Pilih simulasi yang ingin dicoba dan mulai dari langkah pertama."}</p></div><div class="dashboard-empty-actions">${A(recent ? `report${resultRoute}` : continueRoute, recent ? "Lihat Hasil" : continueLabel, "primary")}${recent ? A("explore", "Jelajahi Simulasi", "light") : ""}</div></div>`}</section>
    
    <section class="dashboard-section" aria-labelledby="dashboard-recommend-title"><div class="dashboard-section-heading"><div><span class="dashboard-kicker">UNTUK KAMU</span><h2 id="dashboard-recommend-title">Rekomendasi pekerjaan</h2></div></div><div class="dashboard-recommend-grid">${summary.recommendations
      .map(
        ({ simulation, reason, detail }) =>
          `<article class="dashboard-recommend-card"><span class="dashboard-recommend-icon">${ico(simulation.icon)}</span><div class="dashboard-recommend-content"><span class="dashboard-reason">${esc(reason)}</span><h3>${esc(simulation.role)}</h3><p>${esc(detail || simulation.teaser)}</p><div class="dashboard-skill-list">${simulation.skills
            .slice(0, 3)
            .map((skill) => `<span>${esc(skill)}</span>`)
            .join("")}</div><div class="dashboard-recommend-bottom"><span class="dashboard-availability ${simulation.status === "ready" ? "available" : ""}">${simulation.status === "ready" ? "Tersedia" : "Pratinjau · Segera hadir"}</span><a href="#/detail/${esc(simulation.id)}">Lihat Rincian ${ico("arrow")}</a></div></div></article>`,
      )
      .join("")}</div></section>
    
    <section class="dashboard-section" aria-labelledby="dashboard-results-title"><div class="dashboard-section-heading"><div><span class="dashboard-kicker">HASIL PEKERJAAN</span><h2 id="dashboard-results-title">Hasil simulasimu</h2></div></div><div class="dashboard-results-card">${recent ? `<div class="dashboard-results-main"><span class="dashboard-results-icon">${ico("file")}</span><div><span class="dashboard-results-status">Selesai</span><h3>System Analyst</h3><p>${esc(CASE.name)} · ${dated(recent.tasks.validation?.final?.submittedAt || recent.createdAt)}</p></div></div><div class="dashboard-results-links">${A(`report${resultRoute}`, "Laporan Kinerja", "light")}${A(`portfolio${resultRoute}`, "Portofolio", "light")}</div>` : `<div class="dashboard-results-main"><span class="dashboard-results-icon">${ico("file")}</span><div><h3>Hasilmu akan tampil di sini</h3><p>Selesaikan simulasi untuk melihat laporan dan portofoliomu.</p></div></div>`}</div></section>
  </div></section>`;
}