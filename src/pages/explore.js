import { simulations, getCompany } from "../data/catalog.js";
import { productCard } from "./home.js";
import { ico } from "../components/ui.js";
import { esc } from "../utils/helpers.js";

const catalogCategory = (p) =>
  p.id === "uiux-designer"
    ? "Desain"
    : p.id === "digital-marketing"
      ? "Bisnis dan Pemasaran"
      : "Teknologi Informasi";

export function ExplorePage(filters) {
  return `<section class="container page-pad explore-page"><div class="eyebrow">KATALOG SIMULASI</div><h1 class="page-title">Jelajahi Simulasi</h1><p class="page-intro">Temukan bidang pekerjaan dan coba pengalaman kerja sesuai minatmu.</p><div class="filter-panel explore-filters"><label class="search-wrap">${ico("search")}<input id="catalog-search" type="search" placeholder="Cari posisi atau perusahaan..." value="${esc(filters.search)}" aria-label="Cari posisi atau perusahaan" /></label><label class="select-wrap">Bidang <select id="catalog-category"><option value="all">Semua</option>${["Teknologi Informasi", "Desain", "Bisnis dan Pemasaran"].map((category) => `<option value="${category}" ${filters.category === category ? "selected" : ""}>${category}</option>`).join("")}</select></label></div><div id="catalog-container" aria-live="polite"></div></section>`;
}

export function renderCatalogList(filters) {
  const c = document.getElementById("catalog-container");
  if (!c) return;
  const query = filters.search.toLowerCase().trim();
  const list = simulations.filter(
    (p) =>
      (filters.category === "all" || catalogCategory(p) === filters.category) &&
      [p.role, getCompany(p.company).name]
        .join(" ")
        .toLowerCase()
        .includes(query)
  );
  c.innerHTML = `<div class="list-meta">${list.length} simulasi ditemukan</div>${list.length ? `<div class="cards-grid">${list.map(productCard).join("")}</div>` : `<div class="empty-state">${ico("search")}<h3>Simulasi tidak ditemukan.</h3><p>Coba gunakan kata kunci atau kategori lainnya.</p><button class="btn btn-light" data-act="reset-filter">Hapus filter</button></div>`}`;
}