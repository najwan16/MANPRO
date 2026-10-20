import { api } from "../services/index.js";
import { tasks } from "../data/systemAnalyst.js";
import { getSimulation, CASE } from "../data/catalog.js";
import { submittedTask } from "../assessment/rubricEngine.js";
import { ico, A, scoreTag } from "../components/ui.js";
import { esc } from "../utils/helpers.js";
import { getReport, incompletePage } from "./report.js";
import { artifact } from "../components/artifacts.js";

export function PortfolioPage(attemptId) {
  const result = getReport(attemptId),
    suffix = attemptId ? `/${encodeURIComponent(attemptId)}` : "";
  if (!result) return incompletePage("Portofolio belum tersedia");
  return `<section class="container page-pad portfolio-page"><div class="breadcrumbs"><a href="#/dashboard">Dashboard</a>${ico("chevron")}<a href="#/report${suffix}">Laporan</a>${ico("chevron")}<span>Portofolio Latihan</span></div><div class="portfolio-title"><div><div class="eyebrow">BUKTI PORTOFOLIO</div><h1>Dokumen hasil kerja <span>${esc(api.state().user?.name || "Peserta")}</span></h1><p>Junior System Analyst · ${esc(CASE.name)} · PT Nusa Digital Solusi (perusahaan fiktif)</p></div><button class="btn btn-primary" data-act="download-portfolio">${ico("download")} Unduh Portofolio (.md)</button></div><div class="content-panel portfolio-skills"><h2>Kompetensi yang dipraktikkan</h2><div class="chip-row">${getSimulation("system-analyst")
    .skills.map((skill) => `<span class="chip">${esc(skill)}</span>`)
    .join("")}</div><p>Artefak berikut dibuat dari jawaban yang benar-benar kamu kirim dalam simulasi.</p></div>${tasks
    .map((task) => {
      const submission = submittedTask(result.a.tasks[task.id]);
      return `<article class="content-panel portfolio-section"><div class="portfolio-section-header"><div><div class="eyebrow">ARTEFAK ${String(task.number).padStart(2, "0")}</div><h2>${esc(task.deliverable)}</h2></div>${scoreTag(submission.assessment.score)}</div>${artifact(task, submission.answers)}</article>`;
    })
    .join("")}<div class="portfolio-footer">${A("report" + suffix, `${ico("arrow")} Kembali ke Laporan`, "light")}${result.eligible ? A("certificate" + suffix, `Lihat Sertifikat ${ico("award")}`, "outline") : ""}</div></section>`;
}