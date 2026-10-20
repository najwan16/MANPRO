import { api } from "../services/index.js";
import { tasks } from "../data/systemAnalyst.js";
import { weightedScore, certificateEligible, submittedTask, RUBRIC_VERSION } from "../assessment/rubricEngine.js";
import { CASE } from "../data/catalog.js";
import { ico, A, scoreTag } from "../components/ui.js";
import { esc } from "../utils/helpers.js";

export function getReport(attemptId) {
  const a = attemptId ? api.getAttempt(attemptId) : api.getActive();
  if (!a || !tasks.every((t) => Boolean(submittedTask(a?.tasks?.[t.id])))) return null;
  return {
    a,
    score: weightedScore(tasks, a),
    eligible: certificateEligible(tasks, a),
  };
}

export function incompletePage(title) {
  const a = api.getActive();
  return `<section class="container page-pad empty-state">${ico("lock")}<h1>${esc(title)}</h1><p>Selesaikan semua tugas untuk melihat hasil lengkap.</p>${A(a ? "workspace/" + (tasks.find((t) => !submittedTask(a.tasks[t.id]))?.id || "requirements") : "welcome", `Lanjutkan Simulasi ${ico("arrow")}`, "primary")}</section>`;
}

export function ReportPage(attemptId) {
  const result = getReport(attemptId),
    suffix = attemptId ? `/${encodeURIComponent(attemptId)}` : "";
  if (!result) return incompletePage("Laporan Kinerja belum tersedia");
  return `<section class="container page-pad report-page"><div class="breadcrumbs"><a href="#/dashboard">Dashboard</a>${ico("chevron")}<span>Laporan Kinerja</span></div><div class="report-hero"><div><div class="eyebrow">LAPORAN KINERJA SIMULASI</div><h1>Hasil kerja <span>proyekmu.</span></h1><p>${esc(CASE.name)} · PT Nusa Digital Solusi · Perusahaan fiktif</p><span class="report-complete-status">${ico("check-circle")} Selesai · ${tasks.length} tugas dikirim</span></div><div class="report-icon">${ico("chart")}</div></div><div class="report-summary"><div><span>RATA-RATA TERTIMBANG</span><strong>${result.score}<small>/100</small></strong></div><div><span>TUGAS SELESAI</span><strong>${tasks.length}<small>/${tasks.length}</small></strong></div></div><div class="report-actions">${A("portfolio" + suffix, `Buka Portofolio ${ico("file")}`, "primary")}${result.eligible ? A("certificate" + suffix, `Lihat Sertifikat ${ico("award")}`, "outline") : ""}<button class="btn btn-light" data-act="download-report">${ico("download")} Unduh Laporan (.md)</button></div><div class="report-card-list">${tasks
    .map((task) => {
      const submission = submittedTask(result.a.tasks[task.id]);
      return `<article class="content-panel report-task"><div class="report-task-head"><div><div class="eyebrow">TUGAS ${task.number} · ${esc(task.deliverable.toUpperCase())}</div><h2>${esc(task.title)}</h2></div>${scoreTag(submission.assessment.score)}</div><p class="report-task-intro">Penilaian per aspek</p><ul class="report-rubric-list">${submission.assessment.breakdown.map((item) => `<li><b>${esc(item.label)}</b><span>${item.earned}/${item.max}</span><p>${esc(item.feedback)}</p></li>`).join("")}</ul>${A("portfolio" + suffix, `Lihat ${esc(task.deliverable)}${ico("arrow")}`, "light")}</article>`;
    })
    .join("")}</div><div class="report-bottom-note">${ico("shield")} <span>Skor berasal dari jawaban yang dikirim dan rubrik ${esc(RUBRIC_VERSION)}. Bobot tugas: ${tasks.map((task) => task.weight + "%").join(" / ")}. Hasil ini menggambarkan performa pada simulasi, bukan jaminan kesiapan kerja.</span></div></section>`;
}