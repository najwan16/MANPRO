import { api } from "../services/index.js";
import { ico, A } from "../components/ui.js";
import { esc, dated } from "../utils/helpers.js";
import { tasks } from "../data/systemAnalyst.js";
import { weightedScore, certificateEligible, submittedTask } from "../assessment/rubricEngine.js";
import { downloadText } from "../utils/storage.js";

function getReport(attemptId) {
  const a = attemptId ? api.getAttempt(attemptId) : api.getActive();
  if (!a) return null;
  return {
    a,
    score: weightedScore(tasks, a),
    eligible: certificateEligible(tasks, a),
  };
}

export function downloadCertificate(attemptId) {
  const r = getReport(attemptId);
  if (!r?.eligible) return;
  const s = api.state();
  const safeSvg = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[x],
    );
  const id = "SIM-DEMO-" + r.a.id.split("_").pop().toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850"><rect width="1200" height="850" fill="#f8faff"/><rect x="38" y="38" width="1124" height="774" rx="18" fill="#fff" stroke="#17305C" stroke-width="4"/><rect x="56" y="56" width="1088" height="738" rx="11" fill="none" stroke="#c6d6ed" stroke-width="2"/><text x="600" y="141" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="700" fill="#17305C">SiMagang</text><text x="600" y="213" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" fill="#537099" letter-spacing="5">CERTIFICATE OF COMPLETION</text><text x="600" y="287" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" fill="#63738c">Diberikan kepada</text><text x="600" y="362" text-anchor="middle" font-family="Arial,sans-serif" font-size="48" font-weight="bold" fill="#17305C">${safeSvg(s.user?.name || "Peserta")}</text><path d="M360 387H840" stroke="#d6a448" stroke-width="3"/><text x="600" y="449" text-anchor="middle" font-family="Arial,sans-serif" font-size="21" fill="#63738c">Atas penyelesaian simulasi proyek pembelajaran</text><text x="600" y="504" text-anchor="middle" font-family="Arial,sans-serif" font-size="27" font-weight="bold" fill="#17305C">Junior System Analyst</text><text x="600" y="543" text-anchor="middle" font-family="Arial,sans-serif" font-size="21" fill="#537099">Requirement Analysis &amp; Validation</text><text x="600" y="618" text-anchor="middle" font-family="Arial,sans-serif" font-size="21" fill="#17305C">Skor akhir: ${r.score}/100  \vert{}${safeSvg(dated(submittedTask(r.a.tasks.validation).submittedAt))}</text><text x="600" y="669" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#63738c">ID Demo: ${safeSvg(id)}</text><text x="600" y="738" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" fill="#b05548">SERTIFIKAT LATIHAN — BUKAN SERTIFIKASI PROFESI ATAU MAGANG RESMI</text></svg>`;
  downloadText("SiMagang-Sertifikat-DEMO.svg", svg, "image/svg+xml;charset=utf-8");
}

export function CertificatePage(attemptId) {
  const r = getReport(attemptId),
    suffix = attemptId ? `/${encodeURIComponent(attemptId)}` : ``;
  
  if (!r) {
    return `<section class="container page-pad empty-state">${ico("lock")}<h1>Sertifikat belum tersedia</h1><p>Selesaikan semua tugas untuk melihat sertifikat.</p>${A("welcome", "Kembali ke Proyek")}</section>`;
  }

  if (!r.eligible) {
    return `<section class="container page-pad"><div class="empty-state">${ico("alert")}<h1>Sertifikat belum dapat diterbitkan</h1><p>Semua tugas selesai, tetapi rata-rata nilai ${r.score}/100 masih di bawah ambang 70/100. Kamu tetap bisa mengunduh portofolio dan laporan.</p><div class="inline-actions">${A("report" + suffix, "Lihat Hasil", "outline")}${A("portfolio" + suffix, "Unduh Portofolio", "light")}<button class="btn btn-primary" data-act="new-attempt">Coba Proyek Lagi ${ico("refresh")}</button></div></div></section>`;
  }

  const user = api.state().user,
    id = "SIM-DEMO-" + r.a.id.split("_").pop().toUpperCase();

  return `<section class="container page-pad certificate-page"><div class="breadcrumbs"><a href="#/report${suffix}">Laporan Kinerja</a>${ico("chevron")}<span>Sertifikat</span></div><div class="certificate-header"><div><div class="eyebrow">BUKTI PENYELESAIAN</div><h1>Sertifikat penyelesaian latihanmu.</h1><p>Diterbitkan setelah ketiga tugas selesai dengan skor akhir memenuhi ambang latihan.</p></div><div class="inline-actions"><button class="btn btn-primary" data-act="download-certificate">${ico("download")} Unduh Sertifikat (.svg)</button><button class="btn btn-outline" data-act="print">${ico("file")} Cetak</button></div></div><div class="certificate-paper" id="certificate-paper"><div class="cert-border"><div class="cert-brand">${ico("briefcase")} SiMagang</div><div class="cert-label">CERTIFICATE OF COMPLETION</div><p class="cert-given">Diberikan kepada</p><h2>${esc(user?.name || "Peserta")}</h2><div class="cert-line"></div><p class="cert-descr">Atas penyelesaian simulasi proyek pembelajaran</p><h3>Junior System Analyst · Requirement Analysis & Validation</h3><p class="cert-descr">Menyelesaikan tiga tugas dan evaluasi terstruktur pada proyek latihan Meeting Room Booking System.</p><div class="cert-metadata"><div><small>SKOR AKHIR</small><strong>${r.score}/100</strong></div><div><small>TANGGAL PENYELESAIAN</small><strong>${dated(submittedTask(r.a.tasks.validation).submittedAt)}</strong></div><div><small>ID SERTIFIKAT</small><strong>${esc(id)}</strong></div></div><p class="cert-foot">Sertifikat latihan · Bukan sertifikasi profesi atau bukti pengalaman magang resmi.</p></div></div></section>`;
}