import { api } from "../services/index.js";
import { ico, A, optionInput, feedbackList } from "../components/ui.js";
import { esc, fieldName } from "../utils/helpers.js";
import { tasks, taskById } from "../data/systemAnalyst.js";
import { submittedTask } from "../assessment/rubricEngine.js";
import { CASE, getSimulation, getSimulationTasks, getProjectTask } from "../data/catalog.js";
import { artifact } from "../components/artifacts.js";

function taskSidebar(active, attempt, taskList, simulation) {
  return `<aside class="work-sidebar"><div class="work-sidebar-intro"><div class="eyebrow">RUANG KERJA</div><h3>${esc(simulation.caseName || simulation.title)}</h3><p>${esc(simulation.companyName || "Simulasi pekerjaan")}</p></div><div class="work-tasks-nav">${taskList.map((task, index) => {
    const done = Boolean(submittedTask(attempt.tasks[task.id]));
    const allowed = index === 0 || Boolean(submittedTask(attempt.tasks[taskList[index - 1].id]));
    const content = `<span class="work-num">${done ? ico("check") : index + 1}</span><span><b>${esc(task.title)}</b><small>${done ? "Selesai" : allowed ? "Siap dikerjakan" : "Terkunci"}</small></span>`;
    const classes = `work-nav-item ${active === task.id ? "active" : ""} ${done ? "done" : ""} ${!allowed ? "locked" : ""}`;
    return allowed ? `<a href="#/workspace/${task.id}" class="${classes}">${content}</a>` : `<div class="${classes}" aria-disabled="true">${content}</div>`;
  }).join("")}</div><div class="work-help">${ico("info")} <span>Jawaban tersimpan otomatis. Kirim setiap tugas untuk melanjutkan ke tahap berikutnya.</span></div></aside>`;
}

function taskFeedback(config, snapshot) {
  return `<div class="task-feedback"><div class="task-feedback-header"><div><div class="eyebrow">RUBRIK EVALUASI · ${esc(snapshot.assessment.rubricVersion)}</div><h3>Hasil tugas: <span class="score-pill ${snapshot.assessment.score >= 70 ? "score-good" : snapshot.assessment.score >= 40 ? "score-mid" : "score-low"}">${snapshot.assessment.score}/100</span></h3><p>Penilaian dihitung dari jawaban yang kamu kirim. Baca masukan untuk memahami hasilnya.</p></div>${ico("clipboard")}</div>${feedbackList(snapshot.assessment)}</div>`;
}

function genericArtifact(config, answers) {
  return `<div class="artifact-doc"><div class="artifact-doc-title">${esc(config.deliverable)}</div>${config.fields.map((field) => `<div class="artifact-record"><b>${esc(field.label)}</b><p>${esc(fieldName(field, answers[field.id]))}</p></div>`).join("")}</div>`;
}

export function WorkspacePage(id) {
  const projectTask = getProjectTask(id);
  const systemTask = projectTask ? null : taskById(id);
  const simulationId = projectTask?.simulationId || "system-analyst";
  const simulation = getSimulation(simulationId);
  const taskList = getSimulationTasks(simulation);
  const taskIndex = taskList.findIndex((task) => task.id === id);
  const rawConfig = projectTask || systemTask || tasks[0];
  const config = systemTask ? rawConfig : {
    ...rawConfig,
    number: taskIndex + 1,
    kicker: simulation.role,
    description: rawConfig.question || rawConfig.description,
    briefing: rawConfig.question || rawConfig.briefing,
    readTime: rawConfig.duration || rawConfig.readTime,
    fields: rawConfig.fields || [{ id: "response", label: "Jawaban dan langkah yang kamu rekomendasikan", type: "textarea", minlength: 20, placeholder: "Tuliskan analisismu, alasan, dan hasil yang diminta pada tugas ini..." }],
    expected: rawConfig.expected,
    weights: rawConfig.weights,
    feedback: rawConfig.feedback,
  };
  const attempt = api.getActive(simulationId) || (api.hasAccess(simulationId) ? api.startAttempt(simulationId) : null);

  if (!attempt) return `<section class="container page-pad empty-state"><h2>Mulai simulasi terlebih dahulu</h2>${A(`detail/${simulationId}`, "Kembali ke detail simulasi")}</section>`;
  const previous = taskList[config.number - 2];
  if (previous && !submittedTask(attempt.tasks[previous.id])) return `<section class="container page-pad empty-state"><h2>Tugas belum terbuka</h2><p>Selesaikan tugas sebelumnya.</p>${A(`workspace/${taskList[0].id}`, "Kembali ke tugas awal")}</section>`;

  const data = attempt.tasks[id] || { draft: {} };
  const submission = submittedTask(data);
  const durationMinutes = Number(String(config.readTime).match(/\d+/)?.[0]) || 20;
  const timer = submission ? null : api.startTaskTimer(attempt.id, config.id, durationMinutes);
  const remaining = timer ? Math.max(0, Math.ceil((timer.expiresAt - Date.now()) / 1000)) : 0;
  const timeLabel = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const draft = data.draft || {};
  const next = taskList[config.number];
  const finished = taskList.filter((task) => submittedTask(attempt.tasks[task.id])).length;
  const company = simulationId === "system-analyst" ? "PT Nusa Digital Solusi" : simulationId === "data-analyst" ? "PT Data Cakrawala" : simulationId === "uiux-designer" ? "PT Kreasi Visual Nusantara" : "PT Aksara Media Kreatif";
  const companyCase = simulation?.caseName || CASE.name;
  const caseProblem = simulation?.caseProblem || CASE.problem;
  const artifactView = systemTask ? artifact(config, submission?.answers || draft) : genericArtifact(config, submission?.answers || draft);

  return `<section class="workspace-shell container-wide">${taskSidebar(config.id, attempt, taskList, { ...simulation, companyName: company })}<div class="work-main"><div class="breadcrumbs work-crumb"><a href="#/dashboard">Dashboard</a>${ico("chevron")}<a href="#/progress">Progres Saya</a>${ico("chevron")}<span>Tugas ${config.number} dari ${taskList.length}</span></div><div class="work-header"><div><div class="eyebrow">TUGAS ${String(config.number).padStart(2, "0")} · ${esc(config.kicker.toUpperCase())}</div><h1>${esc(config.title)}</h1><p>${esc(config.description)}</p></div>${submission ? `<div class="work-duration">${ico("check-circle")} Selesai</div>` : `<div class="challenge-time dynamic-countdown work-countdown" id="task-countdown" data-attempt="${esc(attempt.id)}" data-task="${esc(config.id)}" data-expires="${timer.expiresAt}" role="timer" aria-live="polite">${ico("clock")} ${timeLabel}</div>`}</div><div class="workspace-progress"><div><b>Progres proyek</b><span>${finished} dari ${taskList.length} tugas selesai</span></div><div class="dashboard-progress-track" role="progressbar" aria-label="Progres tugas proyek" aria-valuenow="${finished}" aria-valuemin="0" aria-valuemax="${taskList.length}"><span style="width:${(finished / taskList.length) * 100}%"></span></div></div><div class="workspace-context"><div class="pm-card compact-pm"><span class="avatar">${esc(simulation?.id === "system-analyst" ? "ND" : simulation?.id === "data-analyst" ? "DC" : simulation?.id === "uiux-designer" ? "KV" : "AM")}</span><div><span class="pm-meta">PENGANTAR · ${esc(company.toUpperCase())}</span><p>${esc(config.briefing)}</p></div></div><div class="workspace-support"><b>Studi kasus</b><p>${esc(companyCase)}: ${esc(caseProblem)}</p><b>Hasil tugas</b><p>${esc(config.deliverable)}</p></div></div>
  ${submission ? `<div class="workspace-finished-note">${ico("check-circle")} Tugas selesai · Hasil pengiriman tersimpan</div>${submission.assessment ? taskFeedback(config, submission) : `<div class="hint-card">${ico("info")}<span>${submission.reviewStatus === "pending" ? "File berhasil dikirim dan sedang menunggu pemeriksaan admin. Nilai serta feedback akan muncul setelah penilaian selesai." : "Jawaban tersimpan. Tinjau hasil tugas dan deliverable sebelum melanjutkan."}</span></div>`}<section class="content-panel artifact-preview" id="submitted-artifact"><div class="eyebrow">DOKUMEN HASIL KERJA</div><h2>${esc(config.deliverable)}</h2>${artifactView}</section><div class="work-complete-actions">${next ? A(`workspace/${next.id}`, `Lanjut ke Tugas Berikutnya ${ico("arrow")}`, "primary btn-lg") : A(`detail/${simulationId}`, "Kembali ke Detail Simulasi", "primary btn-lg")}${A("progress", "Lihat Progres", "light")}</div>` : `<div class="content-panel work-editor"><div class="editor-head"><div><div class="eyebrow">RUANG KERJA · TUGAS ${config.number}</div><h2>${esc(config.deliverable)}</h2><p>Jawab soal, simpan draf otomatis, lalu kirim untuk membuka tugas berikutnya.</p></div><span class="autosave" id="autosave">${ico("check-circle")} Draf tersimpan otomatis</span></div><form id="task-work-form" data-task="${esc(config.id)}" class="form-stack">${config.fields.map((field) => optionInput(field, draft[field.id])).join("")}<div class="form-foot"><span>${ico("shield")} Timer berjalan selama tugas dibuka dan tetap tersimpan setelah refresh.</span><div class="workspace-form-actions"><button type="button" class="btn btn-light" data-act="save-work-draft" data-task="${esc(config.id)}">Simpan Draf</button><button type="submit" class="btn btn-primary">Kirim Tugas ${ico("arrow")}</button></div></div></form></div><section class="content-panel artifact-preview"><div class="eyebrow">PRATINJAU DOKUMEN</div><h2>${esc(config.deliverable)}</h2><p>Dokumen berikut dibentuk dari jawabanmu.</p><div id="live-artifact">${artifactView}</div></section>`}</div></section>`;
}
