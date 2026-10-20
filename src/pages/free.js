import { api } from "../services/index.js";
import { freeTask } from "../data/systemAnalyst.js";
import { CASE, getSimulation, rupiah } from "../data/catalog.js";
import { ico, pill, A, optionInput, feedbackList } from "../components/ui.js";
import { esc, fieldName } from "../utils/helpers.js";

export function FreePage() {
  const pre = api.getFree()?.answers || {};
  return `<section class="challenge-page"><div class="container challenge-container"><div class="breadcrumbs"><a href="#/detail/system-analyst">System Analyst</a>${ico("chevron")}<span>Latihan Pekerjaan Gratis</span></div><div class="challenge-head"><div>${pill("100% Gratis · Tanpa akun", "green")}<h1>Mulai dari tugas pekerjaan nyata.</h1><p>Bayangkan kamu adalah Junior System Analyst. Manajer Proyek meminta keputusan awal untuk masalah peminjaman ruang rapat.</p></div><div class="challenge-time">${ico("clock")} ± 5 menit</div></div><div class="challenge-layout"><div class="challenge-main"><div class="pm-card"><span class="avatar">DP</span><div><span class="pm-meta">PESAN DARI MANAJER PROYEK</span><b>${esc(CASE.pm)}</b><p>“Sebelum kita membuat sistem, bantu saya menentukan kebutuhan, prioritas, dan cara pengujiannya. Berikan keputusan terbaikmu!”</p></div></div><div class="content-panel challenge-form-card"><div class="eyebrow">LATIHAN PEKERJAAN #00</div><h2>${esc(freeTask.title)}</h2><div class="quoted-case">${esc(freeTask.prompt)}</div><form id="free-task-form" class="form-stack">${freeTask.fields.map((f) => optionInput(f, pre[f.id])).join("")}<div class="form-foot"><span>${ico("shield")} Penilaian hanya untuk tiga keputusan ini, bukan kesiapan kerja keseluruhan.</span><button class="btn btn-primary" type="submit">Kirim Keputusan ${ico("arrow")}</button></div></form></div></div><aside class="side-help"><div class="help-card"><div class="eyebrow">YANG AKAN KAMU DAPAT</div><h3>Umpan balik yang menjelaskan alasannya.</h3><ul class="check-list"><li>${ico("check-circle")} Skor berdasarkan jawabanmu</li><li>${ico("check-circle")} Penjelasan untuk setiap keputusan</li><li>${ico("check-circle")} Contoh tindak lanjut yang relevan</li></ul><p>Semua hasil tugas ini tetap gratis, termasuk apabila jawabannya belum tepat.</p></div><div class="hint-card">${ico("info")} <span>Jawaban tidak disimpan sebagai data penelitian. Dalam demo, riwayat hanya disimpan di browser yang kamu pakai.</span></div></aside></div></div></section>`;
}

export function FreeResultPage() {
  const freeResult = api.getFree();
  if (!freeResult)
    return `<section class="container page-pad empty-state">${ico("clipboard")}<h2>Belum ada hasil tugas gratis</h2>${A("free", "Coba tugas gratis")}</section>`;
  const assessment = freeResult.assessment,
    weak = assessment.breakdown.filter((item) => !item.correct);
  const owned = api.state().user
    ? api.getMySimulations().find((item) => item.simulationId === "system-analyst")
    : null;
  const nextRoute =
    owned?.status === "completed"
      ? `report/${encodeURIComponent(owned.attemptId)}`
      : owned?.status === "in-progress"
        ? `workspace/${owned.nextTaskId}`
        : owned
          ? "welcome"
          : "checkout/system-analyst";
  const nextLabel =
    owned?.status === "completed"
      ? "Lihat Hasil Simulasi"
      : owned
        ? "Lanjutkan Simulasi"
        : `Lanjutkan ke Proyek Lengkap — ${rupiah(getSimulation("system-analyst").price)}`;
  return `<section class="container page-pad free-result-page"><div class="breadcrumbs"><a href="#/free">Tugas Gratis</a>${ico("chevron")}<span>Umpan Balik</span></div><header class="result-title"><div><div class="eyebrow">HASIL LATIHAN GRATIS</div><h1>Ini hasil keputusan pertamamu.</h1><p>Penilaian hanya mencakup tiga keputusan pada kasus kecil ini. Lihat alasan di tiap aspek sebelum menentukan langkah berikutnya.</p></div><div class="score-orb"><strong>${assessment.score}</strong><small>/ 100 poin tugas</small></div></header><div class="result-grid"><div><article class="content-panel"><h2>Yang sudah tepat dan perlu ditingkatkan</h2>${feedbackList(assessment)}</article><article class="content-panel"><h2>${weak.length ? "Ada aspek yang bisa kamu latih lagi." : "Keputusan awalmu sudah sesuai pada kasus ini."}</h2><p>${weak.length ? `${weak.length} dari 3 aspek belum sesuai kriteria kasus. Umpan balik ini tidak mengukur kesiapan magang secara keseluruhan.` : "Ketiga keputusan sudah sesuai. Proyek lengkap menambah latihan menyusun dokumen dan validasi kebutuhan."}</p><div class="mini-artifact"><b>${ico("file")} Catatan keputusanmu</b>${freeTask.fields.map((field) => `<div><small>${esc(field.label)}</small><span>${esc(fieldName(field, freeResult.answers[field.id]))}</span></div>`).join("")}</div></article></div><aside><div class="offer-card"><div class="offer-head">LANGKAH BERIKUTNYA · OPSIONAL</div><h2>Dari pratinjau ke proyek lengkap</h2><div class="preview-value-grid"><div><b>Pratinjau gratis</b><p>1 kasus kecil · 1 aktivitas · umpan balik dasar.</p></div><div><b>Proyek lengkap</b><p>3 tugas berkaitan · artefakmu · penilaian · laporan · portofolio · sertifikat jika memenuhi syarat.</p></div></div>${A(nextRoute, `${esc(nextLabel)} ${ico("arrow")}`, "primary btn-block")}<a class="offer-dismiss" href="#/detail/system-analyst">Kembali ke Rincian</a></div></aside></div></section>`;
}