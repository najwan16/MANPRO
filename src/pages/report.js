import { api } from "../services/index.js";
import { ico, A, scoreTag } from "../components/ui.js";
import { esc } from "../utils/helpers.js";
import { weightedScore, submittedTask, RUBRIC_VERSION } from "../assessment/rubricEngine.js";
import { getSimulation, getSimulationTasks, getCompany } from "../data/catalog.js";

function getReport(attemptId) {
  const attempt = attemptId ? api.getAttempt(attemptId) : api.getActive();
  if (!attempt) return null;
  const simulation = getSimulation(attempt.simulationId || "system-analyst");
  if (!simulation) return null;
  const taskList = getSimulationTasks(simulation);
  const submissions = taskList.map((task) => submittedTask(attempt.tasks?.[task.id])).filter(Boolean);
  const score = weightedScore(taskList, attempt);
  return { attempt, simulation, taskList, submissions, score };
}

export function formatReport(attemptId) {
  const result = getReport(attemptId);
  if (!result) return "";
  const { attempt, simulation, taskList, score } = result;
  const user = api.state().user;
  let out = `# LAPORAN KINERJA SIMAGANG\n\nNama: ${user?.name || "-"}\nPosisi: ${simulation.role}\nProyek: ${simulation.caseName || simulation.title}\nRubrik: ${RUBRIC_VERSION}\nSkor rata-rata: ${score}/100\n\n`;
  for (const task of taskList) {
    const submission = submittedTask(attempt.tasks?.[task.id]);
    if (!submission) continue;
    out += `## ${task.title}\nBobot: ${task.weight || 0}%\nSkor: ${submission.assessment?.score ?? "Belum dinilai"}/100\n`;
    for (const item of submission.assessment?.breakdown || []) out += `- ${item.label}: ${item.earned}/${item.max} — ${item.feedback}\n`;
    out += "\n";
  }
  return out;
}

export function ReportPage(attemptId) {
  const result = getReport(attemptId);
  const suffix = attemptId ? `/${encodeURIComponent(attemptId)}` : "";
  if (!result) return `<section class="container page-pad empty-state">${ico("lock")}<h1>Laporan belum tersedia</h1><p>Selesaikan tugas simulasi untuk melihat hasilnya.</p>${A("progress", "Kembali ke Progres", "primary")}</section>`;

  const { attempt, simulation, taskList, submissions, score } = result;
  const company = getCompany(simulation.company);
  const completed = submissions.length;
  const assessed = submissions.filter((submission) => submission.assessment);
  const isSystemAnalyst = simulation.id === "system-analyst";
  return `<section class="container page-pad report-page"><div class="breadcrumbs"><a href="#/dashboard">Dashboard</a>${ico("chevron")}<span>Laporan Kinerja</span></div><div class="report-hero"><div><div class="eyebrow">LAPORAN KINERJA SIMAGANG</div><h1>Hasil kerja <span>proyekmu.</span></h1><p>${esc(simulation.caseName || simulation.title)} · ${esc(company?.name || "Perusahaan simulasi")} · Perusahaan fiktif</p><span class="report-complete-status">${ico("check-circle")} ${completed === taskList.length ? "Selesai" : "Dalam Progres"} · ${completed} dari ${taskList.length} tugas dikirim</span></div><div class="report-icon">${ico("chart")}</div></div><div class="report-summary"><div><span>RATA-RATA SKOR</span><strong>${assessed.length ? score : "—"}<small>${assessed.length ? "/100" : ""}</small></strong></div><div><span>TUGAS SELESAI</span><strong>${completed}<small>/${taskList.length}</small></strong></div></div><div class="report-actions">${isSystemAnalyst ? A("portfolio" + suffix, `Buka Portofolio ${ico("file")}`, "primary") : A(`detail/${simulation.id}`, `Detail Simulasi ${ico("arrow")}`, "primary")}${A(`restart/${simulation.id}`, `Ulang Simulasi ${ico("refresh")}`, "outline")}<button class="btn btn-light" data-act="download-report">${ico("download")} Unduh Laporan (.md)</button></div><div class="report-card-list">${taskList.map((task) => {
    const submission = submittedTask(attempt.tasks?.[task.id]);
    if (!submission) return `<article class="content-panel report-task"><div class="report-task-head"><div><div class="eyebrow">TUGAS ${task.number || ""}</div><h2>${esc(task.title)}</h2></div><span class="pill pill-soft">Belum dikirim</span></div></article>`;
    const assessment = submission.assessment;
    return `<article class="content-panel report-task"><div class="report-task-head"><div><div class="eyebrow">TUGAS ${task.number || ""} · ${esc((task.deliverable || "Hasil tugas").toUpperCase())}</div><h2>${esc(task.title)}</h2></div>${assessment ? scoreTag(assessment.score) : `<span class="pill pill-green">Selesai</span>`}</div>${assessment ? `<p class="report-task-intro">Penilaian per aspek</p><ul class="report-rubric-list">${assessment.breakdown.map((item) => `<li><b>${esc(item.label)}</b><span>${item.earned}/${item.max}</span><p>${esc(item.feedback)}</p></li>`).join("")}</ul>` : `<p>Tugas telah dikirim dan tersimpan pada attempt ini.</p>`}</article>`;
  }).join("")}</div><div class="report-bottom-note">${ico("shield")} <span>Skor berasal dari jawaban yang dikirim dan rubrik ${esc(RUBRIC_VERSION)}. Hasil ini menggambarkan performa pada simulasi, bukan jaminan kesiapan kerja.</span></div></section>`;
}
