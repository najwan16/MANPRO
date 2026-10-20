import { getSimulation, getSimulationTasks, getCompany, rupiah } from "../data/catalog.js";
import { A, ico, logo } from "../components/ui.js";
import { esc } from "../utils/helpers.js";

export function CheckoutPage(id) {
  const simulation = getSimulation(id || "system-analyst");
  if (!simulation || simulation.status !== "ready") {
    return `<section class="container page-pad empty-state"><h1>Simulasi belum tersedia</h1>${A("explore", "Kembali ke Eksplorasi")}</section>`;
  }
  const company = getCompany(simulation.company);
  const totalTasks = getSimulationTasks(simulation).length;
  return `<section class="container page-pad checkout-page"><div class="breadcrumbs"><a href="#/detail/${esc(simulation.id)}">${esc(simulation.role)}</a>${ico("chevron")}<span>Konfirmasi akses</span></div><div class="eyebrow">AKTIFKAN PROYEK LATIHAN</div><h1 class="page-title">Siapkan akses simulasi.</h1><p class="page-intro">Tinjau ringkasan proyek sebelum melanjutkan ke ruang kerja.</p><div class="checkout-grid"><section class="content-panel"><div class="detail-company">${logo(company)}<span><b>${esc(company.name)}</b><small>Perusahaan fiktif</small></span></div><h2>${esc(simulation.role)} · ${esc(simulation.title)}</h2><p>${esc(simulation.caseName || "Studi kasus simulasi")}: ${esc(simulation.caseProblem || simulation.description)}</p><ul class="check-list">${[`${simulation.skills.length} keterampilan praktis`, `${totalTasks} tugas · ${simulation.duration}`, simulation.deliverable].map((item) => `<li>${ico("check-circle")} ${esc(item)}</li>`).join("")}</ul><div class="checkout-demo-warning" role="note">${ico("info")}<span>Ini checkout demonstrasi. Tidak ada pembayaran nyata yang diproses.</span></div></section><aside class="content-panel checkout-summary"><div class="eyebrow">RINGKASAN AKSES</div><h2>${esc(simulation.role)}</h2><div class="checkout-line total"><span>Total demonstrasi</span><b>${rupiah(simulation.price)}</b></div><form id="checkout-form" data-simulation="${esc(simulation.id)}" class="form-stack"><label class="work-field"><span>Metode pembayaran ilustratif</span><select name="method" required><option value="qris">QRIS (demo)</option><option value="ewallet">E-Wallet (demo)</option><option value="va">Virtual Account (demo)</option></select></label><button class="btn btn-primary btn-block" type="submit">Aktifkan Akses Demo ${ico("arrow")}</button></form><a class="offer-dismiss" href="#/detail/${esc(simulation.id)}">Kembali ke detail simulasi</a></aside></div></section>`;
}
