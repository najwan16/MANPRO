import { api } from "../services/index.js";
import { getFreeTrial } from "../data/freeTrials.js";
import { getSimulation, getCompany, rupiah } from "../data/catalog.js";
import { ico, pill, A, optionInput, feedbackList } from "../components/ui.js";
import { esc, fieldName } from "../utils/helpers.js";

const defaultSimulationId = "system-analyst";

export function FreePage(simulationId = defaultSimulationId) {
  const trial = getFreeTrial(simulationId);
  const simulation = getSimulation(simulationId);
  const company = simulation ? getCompany(simulation.company) : null;
  const result = api.getFree(simulationId);
  if (result) return `<section class="container page-pad empty-state"><h1>Uji coba gratis ${esc(trial.role)} sudah selesai</h1><p>Hasil uji coba untuk simulasi ini sudah tersimpan.</p>${A(`free-result/${simulationId}`, "Lihat Hasil", "primary")}${A(`free/start/${simulationId}`, "Ulangi Uji Coba", "light")}</section>`;

  const timer = api.startFreeTimer(simulationId);
  const remaining = api.getFreeRemainingSeconds(simulationId) ?? 0;
  const timeLabel = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const pre = api.getFreeDraft(simulationId);
  const task = trial.task;
  return `<section class="challenge-page"><div class="container challenge-container"><div class="breadcrumbs"><a href="#/detail/${simulationId}">${esc(trial.role)}</a>${ico("chevron")}<span>Uji Coba Gratis</span></div><div class="challenge-head"><div>${pill("UJI COBA GRATIS", "green")}<h1>Rasakan simulasi ${esc(trial.role)}.</h1><p>${esc(trial.intro)}</p></div><div class="challenge-time dynamic-countdown" id="free-countdown" data-simulation="${simulationId}" data-expires="${timer?.expiresAt || Date.now()}" role="timer" aria-live="polite">${ico("clock")} ${timeLabel}</div></div><div class="challenge-layout"><div class="challenge-main"><div class="pm-card"><span class="avatar">${esc(company?.initials || "SM")}</span><div><span class="pm-meta">PESAN DARI ${esc(trial.contact.toUpperCase())} · ${esc(trial.company.toUpperCase())}</span><b>${esc(task.title)}</b><p>${esc(trial.intro)}</p></div></div><div class="content-panel challenge-form-card"><div class="eyebrow">UJI COBA ${esc(trial.role.toUpperCase())} · 5 MENIT</div><h2>${esc(task.title)}</h2><div class="quoted-case">${esc(task.prompt)}</div><form id="free-task-form" data-simulation="${simulationId}" class="form-stack">${task.fields.map((field) => optionInput(field, pre[field.id])).join("")}<div class="form-foot"><span>${ico("shield")} Timer berjalan selama uji coba.</span><button class="btn btn-primary" type="submit">Kirim Jawaban ${ico("arrow")}</button></div></form></div></div><aside class="side-help"><div class="help-card"><div class="eyebrow">YANG AKAN KAMU DAPAT</div><h3>Umpan balik dari kasus ${esc(trial.role)}.</h3><ul class="check-list"><li>${ico("check-circle")} Skor kasar berdasarkan jawaban</li><li>${ico("check-circle")} Penjelasan tiap keputusan</li><li>${ico("check-circle")} Gambaran alur kerja ${esc(trial.company)}</li></ul><p>Uji coba ini terpisah dari progres simulasi berbayar.</p></div><div class="hint-card">${ico("info")} <span>Jawaban tersimpan sebagai draf untuk uji coba ${esc(trial.role)} ini.</span></div></aside></div></div></section>`;
}

export function FreeResultPage(simulationId = defaultSimulationId) {
  const trial = getFreeTrial(simulationId);
  const simulation = getSimulation(simulationId);
  const company = simulation ? getCompany(simulation.company) : null;
  const freeResult = api.getFree(simulationId);
  if (!freeResult)
    return `<section class="container page-pad empty-state">${ico("clipboard")}<h2>Belum ada hasil uji coba ${esc(trial.role)}</h2>${A(`free/${simulationId}`, "Mulai Uji Coba Gratis")}</section>`;

  const task = trial.task;
  const assessment = freeResult.assessment;
  const weak = assessment.breakdown.filter((item) => !item.correct);
  const owned = api.state().user && api.hasAccess(simulationId)
    ? api.getMySimulations().find((item) => item.simulationId === simulationId)
    : null;
  const nextRoute = owned?.status === "completed"
    ? `report/${encodeURIComponent(owned.attemptId)}`
    : owned?.status === "in-progress"
      ? `workspace/${owned.nextTaskId}`
      : `checkout/${simulationId}`;
  const nextLabel = owned?.status === "completed"
    ? "Lihat Hasil Simulasi"
      : owned?.status === "in-progress"
      ? "Lanjutkan Simulasi"
      : `Lanjutkan ke Simulasi Lengkap — ${rupiah(simulation?.price || 0)}`;

  return `<section class="container page-pad free-result-page"><div class="breadcrumbs"><a href="#/detail/${simulationId}">${esc(trial.role)}</a>${ico("chevron")}<span>Hasil Uji Coba Gratis</span></div><header class="result-title"><div><div class="eyebrow">HASIL UJI COBA · ${esc(trial.role.toUpperCase())}</div><h1>Ini hasil keputusan pertamamu.</h1><p>Penilaian ini hanya mencakup tugas uji coba ${esc(trial.role)}. Lihat alasan di tiap aspek sebelum menentukan langkah berikutnya.</p></div><div class="score-orb"><strong>${assessment.score}</strong><small>/ 100 poin tugas</small></div></header><div class="result-grid"><div><article class="content-panel"><h2>Yang sudah tepat dan perlu ditingkatkan</h2>${feedbackList(assessment)}</article><article class="content-panel"><h2>${weak.length ? "Ada aspek yang bisa kamu latih lagi." : "Keputusan awalmu sudah sesuai pada kasus ini."}</h2><p>${weak.length ? `${weak.length} dari ${assessment.breakdown.length} aspek belum sesuai kriteria kasus.` : `Semua aspek uji coba ${esc(trial.role)} sudah sesuai dengan kriteria kasus.`}</p><div class="mini-artifact"><b>${ico("file")} Catatan keputusanmu</b>${task.fields.map((field) => `<div><small>${esc(field.label)}</small><span>${esc(fieldName(field, freeResult.answers[field.id]))}</span></div>`).join("")}</div></article></div><aside><div class="offer-card"><div class="offer-head">LANGKAH BERIKUTNYA · OPSIONAL</div><h2>Dari uji coba ke simulasi lengkap</h2><div class="preview-value-grid"><div><b>Uji coba gratis</b><p>Kasus singkat · 1 aktivitas · umpan balik dasar.</p></div><div><b>Simulasi lengkap</b><p>${simulation?.projectTasks?.length || 3} tugas bertahap · artefak · laporan hasil kerja.</p></div></div>${A(nextRoute, `${esc(nextLabel)} ${ico("arrow")}`, "primary btn-block")}<a class="offer-dismiss" href="#/detail/${simulationId}">Kembali ke Rincian ${esc(company?.name || "Simulasi")}</a>${A(`free/start/${simulationId}`, "Ulangi Uji Coba Gratis", "light btn-block")}</div></aside></div></section>`;
}
