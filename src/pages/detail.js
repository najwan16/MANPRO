import { api } from "../services/index.js";
import { ico, A, pill, logo } from "../components/ui.js";
import { esc } from "../utils/helpers.js";
import { getSimulation, getSimulationTasks, getCompany, rupiah } from "../data/catalog.js";
import { submittedTask } from "../assessment/rubricEngine.js";

const workflowTaskList = (simulation) => getSimulationTasks(simulation);

export function DetailPage(id) {
  const simulation = getSimulation(id || "system-analyst");
  if (!simulation) {
    return `<section class="container page-pad empty-state"><h1>Simulasi tidak ditemukan</h1>${A("explore", "Kembali ke Katalog")}</section>`;
  }

  const company = getCompany(simulation.company);
  const activeAttempt = api.getActive(simulation.id);
  const taskList = workflowTaskList(simulation);
  const completedAttempt = api.getAttempts().find((attempt) => attempt.simulationId === simulation.id && taskList.every((task) => submittedTask(attempt.tasks[task.id])));
  const activeIsComplete = Boolean(activeAttempt && taskList.every((task) => submittedTask(activeAttempt.tasks[task.id])));
  const isCompleted = Boolean(completedAttempt && (!activeAttempt || activeIsComplete));
  const hasAccess = api.hasAccess(simulation.id);
  const nextTask = activeAttempt && workflowTaskList(simulation).find((task) => !submittedTask(activeAttempt.tasks[task.id]));
  const firstTask = taskList[0];
  const projectRoute = activeAttempt
    ? nextTask ? `workspace/${nextTask.id}` : `report/${activeAttempt.id}`
    : hasAccess && firstTask ? `workspace/${firstTask.id}`
      : `checkout/${simulation.id}`;
  const isReady = simulation.status === "ready";
  const workflow = getSimulationTasks(simulation).map((task) => ({
    ...task,
    title: task.title,
    duration: task.duration || task.readTime,
    question: task.question || task.briefing || task.description,
    deliverable: task.deliverable,
  }));
  const caseName = simulation.caseName || "Studi Kasus Proyek";
  const caseProblem = simulation.caseProblem || "Kasus peminjaman ruang rapat dari stakeholder.";
  const summary = simulation.summary || simulation.description;

  return `<section class="challenge-page detail-challenge-page"><div class="container challenge-container">
    <div class="breadcrumbs"><a href="#/explore">Eksplorasi</a>${ico("chevron")}<span>${esc(simulation.role)}</span></div>
    <header class="challenge-head detail-challenge-head"><div>${pill(isCompleted ? "Selesai" : simulation.tag || (isReady ? "Tersedia" : "Segera hadir"), isCompleted || isReady || simulation.tag === "Tersedia" ? "green" : "soft")}<h1>${esc(simulation.role)}.</h1><p>${esc(summary)}</p></div><div class="challenge-time">${ico("clock")} ± ${esc(simulation.duration)}</div></header>
    <div class="challenge-layout detail-challenge-layout"><div class="challenge-main">
      <div class="pm-card"><span class="avatar">${esc(company.initials)}</span><div><span class="pm-meta">${esc(company.name.toUpperCase())} · PERUSAHAAN FIKTIF</span><b>${esc(simulation.title)}</b><p>${esc(company.desc)}</p></div></div>
      <section class="content-panel challenge-form-card"><div class="eyebrow">TENTANG SIMULASI</div><h2>${esc(simulation.title)}</h2><p>${esc(simulation.about || simulation.description)}</p><div class="quoted-case"><b>${esc(caseName)}</b><br/>${esc(caseProblem)}</div><div class="eyebrow detail-section-label">KETERAMPILAN YANG DILATIH</div><div class="chip-row">${simulation.skills.map((skill) => `<span class="chip">${esc(skill)}</span>`).join("")}</div></section>
      <section class="content-panel detail-syllabus"><div class="eyebrow">ALUR PENGERJAAN</div><h2>Rangkaian tugas simulasi</h2><p class="simulation-task-intro">Selesaikan tugas secara berurutan. Setiap tahap menghasilkan artefak yang menjadi dasar tahap berikutnya.</p><div class="syllabus-list">${workflow.map((task, index) => `<article class="syllabus-item simulation-task-item"><span class="syll-num">${String(index + 1).padStart(2, "0")}</span><div><h3>${esc(task.title)}</h3><span class="simulation-task-duration">${ico("clock")} Waktu pengerjaan: ${esc(task.duration)}</span><p><b>Soal</b><br/>${esc(task.question || task.description)}</p><b>Hasil: ${esc(task.deliverable)}</b></div></article>`).join("")}</div></section>
    </div><aside class="side-help"><div class="help-card detail-access-card"><div class="eyebrow">AKSES SIMULASI</div><h2>${rupiah(simulation.price)}</h2><span class="availability-label ${isCompleted || hasAccess ? "available" : isReady ? "available" : "unavailable"}">${ico("check-circle")} ${isCompleted ? "Selesai" : hasAccess ? "Simulasi Aktif" : "Tersedia"}</span><p>${isCompleted ? "Simulasi ini sudah kamu selesaikan. Kamu dapat meninjau laporan atau mengulang pengerjaan." : hasAccess ? "Akses simulasi ini aktif. Kamu dapat melanjutkan atau memulai tugas dari awal." : isReady ? "Aktifkan akses simulasi ini untuk memulai seluruh rangkaian tugas. Checkout merupakan demonstrasi dan tidak memproses pembayaran nyata." : "Simulasi tersedia. Lihat ringkasan, konteks kasus, durasi, dan rincian tugas pada halaman ini."}</p><ul class="check-list">${[`${workflow.length} tugas bertahap`, `Total waktu: ± ${simulation.duration}`, simulation.deliverable].map((item) => `<li>${ico("check-circle")} ${esc(item)}</li>`).join("")}</ul>${isCompleted ? `${A(`report/${encodeURIComponent(completedAttempt.id)}`, `Lihat Hasil ${ico("arrow")}`, "primary btn-block")}${A(`restart/${simulation.id}`, `Ulang Simulasi ${ico("refresh")}`, "light btn-block")}` : isReady ? `${A(projectRoute, `${hasAccess ? activeAttempt ? "Lanjutkan Simulasi" : "Mulai Simulasi" : "Aktifkan Akses"} ${ico("arrow")}`, "primary btn-block")}${A(`free/start/${simulation.id}`, `Mulai Uji Coba Gratis ${ico("arrow")}`, "light btn-block")}` : `<button class="btn btn-primary btn-block" disabled aria-disabled="true">Tersedia</button>`}<div class="detail-company detail-company-card">${logo(company)}<span><b>${esc(company.name)}</b><small>Studi kasus fiktif</small></span></div></div><div class="hint-card">${ico("info")}<span>Latihan ini adalah simulasi pembelajaran dan bukan pengalaman kerja atau sertifikasi profesi resmi.</span></div></aside></div>
  </div></section>`;
}
