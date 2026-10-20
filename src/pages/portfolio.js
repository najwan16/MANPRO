import { api } from "../services/index.js";
import { ico, A, scoreTag } from "../components/ui.js";
import { esc, fieldName, dated } from "../utils/helpers.js";
import { tasks } from "../data/systemAnalyst.js";
import { weightedScore, certificateEligible, submittedTask } from "../assessment/rubricEngine.js";
import { CASE, getSimulation } from "../data/catalog.js";
import { artifact } from "../components/artifacts.js";

function getReport(attemptId) {
  const a = attemptId ? api.getAttempt(attemptId) : api.getActive();
  if (!a) return null;
  return {
    a,
    score: weightedScore(tasks, a),
    eligible: certificateEligible(tasks, a),
  };
}

export function formatPortfolio(attemptId) {
  const r = getReport(attemptId);
  if (!r) return "";
  const s = api.state();
  let out = `# PORTOFOLIO LATIHAN SIMAGANG\n\nPeserta: ${s.user?.name || "-"}\nProyek: ${CASE.name}\nTanggal: ${dated(r.a.createdAt)}\n\n`;
  for (const t of tasks) {
    const p = submittedTask(r.a.tasks[t.id]);
    out += `## ${t.number}. ${t.deliverable} — ${p.assessment.score}/100\n\n`;
    for (const f of t.fields)
      out += `- ${f.label}\n  ${fieldName(f, p.answers[f.id])}\n`;
    out += "\n";
  }
  return out;
}

export function PortfolioPage(attemptId) {
  const result = getReport(attemptId),
    suffix = attemptId ? `/${encodeURIComponent(attemptId)}` : "";

  if (!result) {
    return `<section class="container page-pad empty-state">${ico("lock")}<h1>Portofolio belum tersedia</h1><p>Selesaikan seluruh tugas terlebih dahulu.</p>${A("welcome", "Ke Ruang Kerja")}</section>`;
  }

  return `<section class="container page-pad portfolio-page"><div class="breadcrumbs"><a href="#/dashboard">Dashboard</a>${ico("chevron")}<a href="#/report${suffix}">Laporan</a>${ico("chevron")}<span>Portofolio Latihan</span></div><div class="portfolio-title"><div><div class="eyebrow">BUKTI PORTOFOLIO</div><h1>Dokumen hasil kerja <span>${esc(api.state().user?.name || "Peserta")}</span></h1><p>Junior System Analyst · ${esc(CASE.name)} · PT Nusa Digital Solusi (perusahaan fiktif)</p></div><button class="btn btn-primary" data-act="download-portfolio">${ico("download")} Unduh Portofolio (.md)</button></div><div class="content-panel portfolio-skills"><div class="portfolio-score-summary"><div><span>RATA-RATA SKOR AKHIR</span><strong>${result.score === null ? "Belum tersedia" : `${result.score}/100`}</strong></div><div><h2>Kompetensi yang dipraktikkan</h2><div class="chip-row">${getSimulation("system-analyst").skills.map((skill) => `<span class="chip">${esc(skill)}</span>`).join("")}</div></div></div><p>Skor dihitung sebagai rata-rata berbobot dari tugas yang sudah memiliki penilaian. Artefak berikut dibuat dari jawaban yang kamu kirim dalam simulasi.</p></div>${tasks
    .map((task) => {
      const submission = submittedTask(result.a.tasks[task.id]);
      return `<article class="content-panel portfolio-section"><div class="portfolio-section-header"><div><div class="eyebrow">ARTEFAK ${String(task.number).padStart(2, "0")}</div><h2>${esc(task.deliverable)}</h2></div>${scoreTag(submission.assessment.score)}</div>${artifact(task, submission.answers)}</article>`;
    })
    .join("")}<div class="portfolio-footer">${A("report" + suffix, `${ico("arrow")} Kembali ke Laporan`, "light")}${result.eligible ? A("certificate" + suffix, `Lihat Sertifikat ${ico("award")}`, "outline") : ""}</div></section>`;
}
