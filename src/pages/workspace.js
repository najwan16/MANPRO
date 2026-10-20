import { api } from "../services/index.js";
import { ico, A, optionInput, feedbackList } from "../components/ui.js";
import { esc } from "../utils/helpers.js";
import { tasks, taskById } from "../data/systemAnalyst.js";
import { submittedTask } from "../assessment/rubricEngine.js";
import { CASE } from "../data/catalog.js";
import { artifact } from "../components/artifacts.js";

function taskSidebar(active, attempt) {
  return `<aside class="work-sidebar"><div class="work-sidebar-intro"><div class="eyebrow">RUANG KERJA</div><h3>Meeting Room<br/>Booking System</h3><p>PT Nusa Digital Solusi · Fiktif</p></div><div class="work-tasks-nav">${tasks
    .map((t) => {
      const done = !!submittedTask(attempt.tasks[t.id]),
        allowed = t.number === 1 || Boolean(submittedTask(attempt?.tasks?.[tasks[t.number - 2].id]));
      return `<a href="${allowed ? "#/workspace/" + t.id : "#"}" ${!allowed ? 'aria-disabled="true" data-locked="true"' : ""} class="work-nav-item ${active === t.id ? "active" : ""} ${done ? "done" : ""} ${!allowed ? "locked" : ""}"><span class="work-num">${done ? ico("check") : t.number}</span><span><b>${esc(t.title)}</b><small>${done ? "Selesai" : allowed ? "Siap dikerjakan" : "Terkunci"}</small></span></a>`;
    })
    .join("")}</div><div class="work-help">${ico("info")} <span>Jawaban tersimpan otomatis di browser. Penilaian dilakukan saat kamu mengirim tugas.</span></div></aside>`;
}

function taskFeedback(config, snapshot) {
  return `<div class="task-feedback"><div class="task-feedback-header"><div><div class="eyebrow">RUBRIK EVALUASI · ${esc(snapshot.assessment.rubricVersion)}</div><h3>Hasil tugas: <span class="score-pill ${snapshot.assessment.score >= 70 ? "score-good" : snapshot.assessment.score >= 40 ? "score-mid" : "score-low"}">${snapshot.assessment.score}/100</span></h3><p>Penilaian dihitung dari jawaban yang kamu kirim. Baca masukan untuk memahami hasilnya.</p><button type="button" class="text-link workspace-artifact-link" data-act="scroll-artifact">Lihat hasil pekerjaan ${ico("arrow")}</button></div>${ico("clipboard")}</div>${feedbackList(snapshot.assessment)}</div>`;
}

export function WorkspacePage(id) {
  const config = taskById(id) || tasks[0];
  const attempt = api.getActive();

  if (!attempt) {
    return `<section class="container page-pad empty-state"><h2>Mulai simulasi terlebih dahulu</h2>${A("welcome", "Kembali ke briefing")}</section>`;
  }

  const canTask = config.number === 1 || Boolean(submittedTask(attempt?.tasks?.[tasks[config.number - 2].id]));
  if (!canTask) {
    return `<section class="container page-pad empty-state"><h2>Tugas belum terbuka</h2><p>Selesaikan tugas sebelumnya.</p>${A("workspace/" + tasks[0].id, "Kembali ke tugas awal")}</section>`;
  }

  const data = attempt.tasks[id] || { draft: {} };
  const submission = submittedTask(data);
  const draft = data.draft || {};
  const next = tasks[config.number];
  const finished = tasks.filter((task) => submittedTask(attempt.tasks[task.id])).length;

  const feedback = submission?.assessment?.breakdown || [];
  const correctCount = feedback.filter((item) => item.correct).length;

  return `<section class="workspace-shell container-wide">${taskSidebar(config.id, attempt)}<div class="work-main"><div class="breadcrumbs work-crumb"><a href="#/dashboard">Dashboard</a>${ico("chevron")}<a href="#/progress">Progres Saya</a>${ico("chevron")}<span>Tugas ${config.number} dari ${tasks.length}</span></div><div class="work-header"><div><div class="eyebrow">TUGAS ${String(config.number).padStart(2, "0")} · ${esc(config.kicker.toUpperCase())}</div><h1>${esc(config.title)}</h1><p>${esc(config.description)}</p></div><div class="work-duration">${ico("clock")} ${esc(config.readTime)}</div></div><div class="workspace-progress"><div><b>Progres proyek</b><span>${finished} dari ${tasks.length} tugas selesai</span></div><div class="dashboard-progress-track" role="progressbar" aria-label="Progres tugas proyek" aria-valuenow="${finished}" aria-valuemin="0" aria-valuemax="${tasks.length}"><span style="width:${(finished / tasks.length) * 100}%"></span></div></div><div class="workspace-context"><div class="pm-card compact-pm"><span class="avatar">DP</span><div><span class="pm-meta">PENGANTAR · ${esc(CASE.pm.toUpperCase())}</span><p>${esc(config.briefing)}</p></div></div><div class="workspace-support"><b>Data pendukung</b><p>${esc(CASE.problem)}</p><b>Instruksi pekerjaan</b><p>${esc(config.description)} Hasilkan ${esc(config.deliverable)} dari keputusanmu.</p></div></div>
  ${submission ? `<div class="workspace-finished-note">${ico("check-circle")} Tugas selesai · Hasil pengiriman tersimpan</div>${taskFeedback(config, submission)}<div class="workspace-feedback-summary"><span>${ico("check-circle")} ${correctCount} aspek sudah sesuai</span><span>${ico("target")} ${feedback.length - correctCount} aspek perlu ditingkatkan</span></div><section class="content-panel artifact-preview" id="submitted-artifact"><div class="eyebrow">DOKUMEN HASIL KERJA</div><h2>${esc(config.deliverable)}</h2>${artifact(config, submission.answers)}</section><div class="work-complete-actions">${next ? A("workspace/" + next.id, `Lanjut ke Tugas Berikutnya ${ico("arrow")}`, "primary btn-lg") : A("report/" + attempt.id, `Lihat Laporan Kinerja ${ico("arrow")}`, "primary btn-lg")}${A("progress", "Lihat Progres", "light")}</div>` : `<div class="content-panel work-editor"><div class="editor-head"><div><div class="eyebrow">RUANG KERJA · TUGAS ${config.number}</div><h2>Susun${esc(config.deliverable)}</h2><p>Lengkapi keputusan di bawah. Jawabanmu akan membentuk dokumen hasil kerja.</p></div><span class="autosave" id="autosave">${ico("check-circle")} Draf tersimpan otomatis</span></div><form id="task-work-form" data-task="${esc(config.id)}" class="form-stack">${config.fields.map((field) => optionInput(field, draft[field.id])).join("")}<div class="form-foot"><span>${ico("shield")} Tinjau jawaban sebelum dikirim. Tugas dinilai satu kali.</span><div class="workspace-form-actions"><button type="button" class="btn btn-light" data-act="save-work-draft">Simpan Draf</button><button type="submit" class="btn btn-primary">Kirim Tugas ${ico("arrow")}</button></div></div></form></div><section class="content-panel artifact-preview"><div class="eyebrow">PRATINJAU DOKUMEN</div><h2>${esc(config.deliverable)}</h2><p>Dokumen berikut dibentuk dari jawabanmu.</p><div id="live-artifact">${artifact(config, draft)}</div><div class="inline-actions"><button class="btn btn-outline" data-act="download-current" data-task="${esc(config.id)}">${ico("download")} Unduh Draf (.md)</button>${config.id === "userstory" ? `<a class="btn btn-light" href="https://app.diagrams.net/" target="_blank" rel="noopener noreferrer">${ico("external")} Coba diagrams.net (opsional)</a>` : ""}</div><p class="note-muted">Diagram dari alat kerja eksternal tidak dinilai secara otomatis.</p></section>`}</div></section>`;
}