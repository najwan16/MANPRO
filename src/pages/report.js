import { api } from "../services/index.js";
import { ico, A, scoreTag } from "../components/ui.js";
import { esc } from "../utils/helpers.js";
import { tasks } from "../data/systemAnalyst.js";
import { weightedScore, certificateEligible, submittedTask, RUBRIC_VERSION } from "../assessment/rubricEngine.js";
import { CASE } from "../data/catalog.js";

function getReport(attemptId) {
  const a = attemptId ? api.getAttempt(attemptId) : api.getActive();
  if (!a) return null;
  return {
    a,
    score: weightedScore(tasks, a),
    eligible: certificateEligible(tasks, a),
  };
}

export function formatReport(attemptId) {
  const r = getReport(attemptId);
  if (!r) return "";
  const s = api.state();
  let out = `# LAPORAN KINERJA SIMAGANG\n\nNama: ${s.user?.name || "-"}\nPosisi: Junior System Analyst\nProyek: ${CASE.name}\nRubrik: ${RUBRIC_VERSION}\nSkor akhir: ${r.score}/100\n\n`;
  for (const t of tasks) {
    const p = submittedTask(r.a.tasks[t.id]);
    out += `## ${t.title}\nBobot: ${t.weight}%\nSkor: ${p.assessment.score}/100\n`;
    for (const b of p.assessment.breakdown)
      out += `- ${b.label}: ${b.earned}/${b.max} — ${b.feedback}\n`;
    out += "\n";
  }
  return out;
}

export function ReportPage(attemptId) {
  const result = getReport(attemptId),
    suffix = attemptId ? `/${encodeURIComponent(attemptId)}` : "";

  if (!result) {
    return `<section class="container page-pad empty-state">${ico("lock")}<h1>Laporan Kinerja belum tersedia</h1><p>Selesaikan semua tugas untuk melihat hasil lengkap.</p>${A("welcome", "Lanjutkan Simulasi", "primary")}</section>`;
  }

  return `<section class="container page-pad report-page"><div class="breadcrumbs"><a href="#/dashboard">Dashboard</a>${ico("chevron")}<span>Laporan Kinerja</span></div><div class="report-hero"><div><div class="eyebrow">LAPORAN KINERJA SIMAGANG</div><h1>Hasil kerja <span>proyekmu.</span></h1><p>${esc(CASE.name)} · PT Nusa Digital Solusi · Perusahaan fiktif</p><span class="report-complete-status">${ico("check-circle")} Selesai · ${tasks.length} tugas dikirim</span></div><div class="report-icon">${ico("chart")}</div></div><div class="report-summary"><div><span>RATA-RATA TERTIMBANG</span><strong>${result.score}<small>/100</small></strong></div><div><span>TUGAS SELESAI</span><strong>${tasks.length}<small>/${tasks.length}</small></strong></div></div><div class="report-actions">${A("portfolio" + suffix, `Buka Portofolio ${ico("file")}`, "primary")}${result.eligible ? A("certificate" + suffix, `Lihat Sertifikat ${ico("award")}`, "outline") : ""}<button class="btn btn-light" data-act="download-report">${ico("download")} Unduh Laporan (.md)</button></div><div class="report-card-list">${tasks
    .map((task) => {
      const submission = submittedTask(result.a.tasks[task.id]);
      return `<article class="content-panel report-task"><div class="report-task-head"><div><div class="eyebrow">TUGAS ${task.number} ·${esc(task.deliverable.toUpperCase())}</div><h2>${esc(task.title)}</h2></div>${scoreTag(submission.assessment.score)}</div><p class="report-task-intro">Penilaian per aspek</p><ul class="report-rubric-list">${submission.assessment.breakdown.map((item) => `<li><b>${esc(item.label)}</b><span>${item.earned}/${item.max}</span><p>${esc(item.feedback)}</p></li>`).join("")}</ul>${A("portfolio" + suffix, `Lihat ${esc(task.deliverable)} ${ico("arrow")}`, "light")}</article>`;
    })
    .join("")}</div><div class="report-bottom-note">${ico("shield")} <span>Skor berasal dari jawaban yang dikirim dan rubrik ${esc(RUBRIC_VERSION)}. Bobot tugas: ${tasks.map((task) => task.weight + "%").join(" / ")}. Hasil ini menggambarkan performa pada simulasi, bukan jaminan kesiapan kerja.</span></div></section>`;
}