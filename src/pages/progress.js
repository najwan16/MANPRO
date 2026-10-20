import { api } from "../services/index.js";
import { ico, A, scoreTag } from "../components/ui.js";
import { esc, dated } from "../utils/helpers.js";
import { weightedScore, submittedTask } from "../assessment/rubricEngine.js";
import { getSimulation, getSimulationTasks, getCompany, CASE } from "../data/catalog.js";

export function ProgressPage() {
  const allAttempts = api.getAttempts();
  const attempts = [...new Set(allAttempts.map((attempt) => attempt.simulationId))].map((simulationId) => {
    const history = allAttempts.filter((attempt) => attempt.simulationId === simulationId);
    const simulation = getSimulation(simulationId);
    const taskList = getSimulationTasks(simulation);
    const active = api.getActive(simulationId);
    return active
      || history.find((attempt) => taskList.some((task) => !submittedTask(attempt.tasks[task.id])))
      || history.find((attempt) => taskList.every((task) => submittedTask(attempt.tasks[task.id])))
      || history[0];
  }).filter(Boolean);

  return `<section class="container page-pad progress-page"><div class="eyebrow">PROGRES SAYA</div><h1 class="page-title">Riwayat & progres simulasi</h1><p class="page-intro">Tinjau kembali simulasi yang pernah kamu kerjakan dan lanjutkan tugas berikutnya.</p>
    ${attempts.length === 0 ? `<div class="content-panel empty-state">${ico("workflow")}<h2>Belum ada simulasi yang diikuti</h2><p>Pilih simulasi di katalog dan mulai kerjakan tugas pertama.</p>${A("explore", "Jelajahi Simulasi", "primary")}</div>` : `<div class="progress-list">${attempts.map((attempt) => {
      const simulation = getSimulation(attempt.simulationId);
      if (!simulation) return "";
      const taskList = getSimulationTasks(simulation);
      const finishedTasks = taskList.filter((task) => submittedTask(attempt.tasks[task.id])).length;
      const isComplete = taskList.length > 0 && finishedTasks === taskList.length;
      const score = weightedScore(taskList, attempt);
      const nextTask = taskList.find((task) => !submittedTask(attempt.tasks[task.id]));
      const company = getCompany(simulation.company);
      const title = simulation.caseName || CASE.name;
      const continueRoute = nextTask ? `workspace/${nextTask.id}` : `report/${encodeURIComponent(attempt.id)}`;

      const percent = taskList.length ? Math.round((finishedTasks / taskList.length) * 100) : 0;
      return `<article class="content-panel progress-card"><div class="progress-card-head"><div><span class="pill pill-${isComplete ? "green" : "blue"}">${isComplete ? "Selesai" : "Sedang Berjalan"}</span><h2>${esc(simulation.role)}</h2><p>${esc(title)} · ${esc(company.name)}</p></div>${score !== null ? scoreTag(score) : ""}</div>
      <div class="progress-card-body"><div class="dashboard-progress-meta"><span>${finishedTasks} dari ${taskList.length} tugas dikirim</span><span>${percent}%</span></div><div class="dashboard-progress-track" role="progressbar" aria-valuenow="${finishedTasks}" aria-valuemin="0" aria-valuemax="${taskList.length}"><span style="width:${percent}%"></span></div><small>Dimulai pada ${dated(attempt.createdAt)}</small></div>
      <div class="progress-card-foot">${A(continueRoute, isComplete ? `Lihat Hasil ${ico("arrow")}` : "Lanjutkan Ruang Kerja " + ico("arrow"), "primary")}</div></article>`;
    }).join("")}</div>`}</section>`;
}
