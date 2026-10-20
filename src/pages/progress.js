import { api } from "../services/index.js";
import { ico, A, scoreTag } from "../components/ui.js";
import { esc, dated } from "../utils/helpers.js";
import { tasks } from "../data/systemAnalyst.js";
import { weightedScore, submittedTask } from "../assessment/rubricEngine.js";
import { CASE, getCompany } from "../data/catalog.js";

export function ProgressPage() {
  const attempts = api.getAttempts();
  const company = getCompany("nusa");

  return `<section class="container page-pad progress-page"><div class="eyebrow">PROGRES SAYA</div><h1 class="page-title">Riwayat & progres simulasi</h1><p class="page-intro">Tinjau kembali simulasi yang pernah kamu kerjakan, lihat laporan kinerja, atau unduh artefak portofolio.</p>
    
    ${attempts.length === 0 ? `<div class="content-panel empty-state">${ico("workflow")}<h2>Belum ada simulasi yang diikuti</h2><p>Pilih simulasi di katalog dan mulai kerjakan tugas pertama.</p>${A("explore", "Jelajahi Simulasi", "primary")}</div>` : `<div class="progress-list">${attempts.map((attempt) => {
      const finishedTasks = tasks.filter((task) => submittedTask(attempt.tasks[task.id])).length;
      const isComplete = finishedTasks === tasks.length;
      const score = weightedScore(tasks, attempt);
      const routeSuffix = `/${encodeURIComponent(attempt.id)}`;

      return `<article class="content-panel progress-card"><div class="progress-card-head"><div><span class="pill pill-${isComplete ? "green" : "blue"}">${isComplete ? "Selesai" : "Sedang Berjalan"}</span><h2>System Analyst</h2><p>${esc(CASE.name)} · ${esc(company.name)}</p></div>${isComplete ? scoreTag(score) : ""}</div>
      <div class="progress-card-body"><div class="dashboard-progress-meta"><span>${finishedTasks} dari ${tasks.length} tugas dikirim</span><span>${Math.round((finishedTasks / tasks.length) * 100)}%</span></div><div class="dashboard-progress-track" role="progressbar" aria-valuenow="${finishedTasks}" aria-valuemin="0" aria-valuemax="${tasks.length}"><span style="width:${(finishedTasks / tasks.length) * 100}%"></span></div><small>Dimulai pada ${dated(attempt.createdAt)}</small></div>
      <div class="progress-card-foot">${isComplete ? `${A("report" + routeSuffix, "Laporan Kinerja", "primary")}${A("portfolio" + routeSuffix, "Portofolio", "light")}` : `${A("workspace/" + (attempt.tasks.requirements?.final ? "userstory" : "requirements"), "Lanjutkan Ruang Kerja " + ico("arrow"), "primary")}`}</div></article>`;
    }).join("")}</div>`}</section>`;
}