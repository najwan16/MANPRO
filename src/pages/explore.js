import { ico, A } from "../components/ui.js";
import { esc } from "../utils/helpers.js";
import { simulations } from "../data/catalog.js";
import { productCard } from "./home.js";

export function ExplorePage() {
  return `<section class="container page-pad explore-page">
    <div class="eyebrow">KATALOG SIMULASI</div>
    <h1 class="page-title">Jelajahi simulasi posisi pekerjaan</h1>
    <p class="page-intro">Pilih bidang pekerjaan yang ingin kamu pelajari, coba tugas pengantar gratis, dan mulai simulasi berbasis kasus nyata.</p>
    
    <div class="cards-grid">
      ${simulations.map(productCard).join("")}
    </div>
  </section>`;
}