import { freeTask as systemAnalystTask } from "./systemAnalyst.js";
import { getCompany, getSimulation, getSimulationTasks } from "./catalog.js";

const trials = {
  "system-analyst": {
    role: "System Analyst",
    company: "PT Nusa Digital Solusi",
    contact: "Dina · Manajer Proyek",
    intro: "Manajer proyek meminta keputusan awal untuk memperjelas kebutuhan sistem peminjaman ruang rapat.",
    task: systemAnalystTask,
  },
  "data-analyst": {
    role: "Data Analyst",
    company: "PT Data Cakrawala",
    contact: "Raka · Lead Data Analyst",
    intro: "Tim komersial melihat penjualan menurun dan membutuhkan analisis awal yang dapat diuji.",
    task: {
      title: "Menemukan penyebab perubahan penjualan",
      prompt: "Penjualan kuartal ini turun. Tim ingin mengetahui apakah penurunan terkonsentrasi pada kategori atau wilayah tertentu sebelum mengubah strategi.",
      fields: [
        { id: "segment", label: "Dimensi pertama yang paling relevan untuk diperiksa", type: "select", options: [["", "Pilih dimensi"], ["category", "Kategori produk"], ["font", "Jenis huruf pada situs"], ["employee", "Nama analis yang membuat laporan"]] },
        { id: "compare", label: "Pilih tepat 2 dimensi untuk membandingkan tren", type: "multi", minSelections: 2, maxSelections: 2, options: [["category", "Kategori produk"], ["region", "Wilayah penjualan"], ["color", "Warna kemasan"], ["font", "Jenis huruf pada situs"]] },
        { id: "validation", label: "Langkah sebelum merekomendasikan perubahan strategi", type: "select", options: [["", "Pilih langkah"], ["validate", "Periksa definisi metrik dan bandingkan data per segmen"], ["assume", "Menganggap penurunan terjadi merata"], ["delete", "Menghapus transaksi yang tidak sesuai dugaan"]] },
      ],
      expected: { segment: "category", compare: ["category", "region"], validation: "validate" },
      weights: { segment: 25, compare: 45, validation: 30 },
      feedback: { segment: "Kategori produk dapat menunjukkan kelompok penjualan yang berkontribusi pada perubahan.", compare: "Bandingkan kategori dan wilayah untuk mengisolasi segmen yang terdampak.", validation: "Pastikan definisi metrik lalu bandingkan data per segmen sebelum menyimpulkan penyebab." },
    },
  },
  "digital-marketing": {
    role: "Digital Marketing",
    company: "PT Aksara Media Kreatif",
    contact: "Maya · Campaign Lead",
    intro: "Campaign Lead meminta rencana awal untuk meningkatkan kunjungan berkualitas ke halaman produk.",
    task: {
      title: "Menyusun arah kampanye digital",
      prompt: "Sebuah brand meluncurkan produk baru. Iklan mendapat banyak impresi, tetapi kunjungan ke halaman produk dan pembelian masih rendah.",
      fields: [
        { id: "objective", label: "Tujuan kampanye yang paling tepat", type: "select", options: [["", "Pilih tujuan"], ["traffic", "Meningkatkan kunjungan berkualitas ke halaman produk"], ["impressions", "Menambah impresi tanpa melihat relevansi audiens"], ["followers", "Menambah pengikut tanpa kaitan dengan produk"]] },
        { id: "metrics", label: "Pilih tepat 2 metrik untuk mengevaluasi alur iklan ke pembelian", type: "multi", minSelections: 2, maxSelections: 2, options: [["ctr", "Click-through rate"], ["conversion", "Conversion rate pembelian"], ["colors", "Jumlah warna pada materi"], ["likes", "Jumlah suka tanpa konteks tujuan"]] },
        { id: "nextStep", label: "Langkah optimasi awal", type: "select", options: [["", "Pilih langkah"], ["test", "Uji variasi pesan pada segmen audiens yang terukur"], ["budget", "Menghabiskan seluruh anggaran pada satu iklan"], ["stop", "Menghentikan kampanye tanpa membaca data"]] },
      ],
      expected: { objective: "traffic", metrics: ["ctr", "conversion"], nextStep: "test" },
      weights: { objective: 25, metrics: 45, nextStep: 30 },
      feedback: { objective: "Pilih tujuan yang menghubungkan audiens relevan dengan halaman produk.", metrics: "CTR mengukur klik dari iklan; conversion rate mengukur pembelian setelah kunjungan.", nextStep: "Uji variasi secara terukur agar dampak perubahan pesan bisa dibandingkan." },
    },
  },
  "uiux-designer": {
    role: "UI/UX Designer",
    company: "PT Kreasi Visual Nusantara",
    contact: "Nadia · Product Designer",
    intro: "Product Designer meminta evaluasi cepat terhadap alur pencarian dan pemesanan ruang di aplikasi.",
    task: {
      title: "Memahami hambatan dalam alur pengguna",
      prompt: "Pengguna sering berhenti saat mencari ruang yang tersedia. Tim belum tahu apakah masalahnya berasal dari label, urutan langkah, atau informasi ketersediaan.",
      fields: [
        { id: "research", label: "Cara paling tepat memahami hambatan pengguna", type: "select", options: [["", "Pilih metode"], ["interview", "Wawancarai pengguna dan amati mereka menyelesaikan tugas"], ["assume", "Menebak masalah dari preferensi tim desain"], ["colors", "Mengubah warna sebelum mencari bukti masalah"]] },
        { id: "priority", label: "Pilih tepat 2 hal yang perlu diperiksa pada alur", type: "multi", minSelections: 2, maxSelections: 2, options: [["availability", "Apakah ketersediaan ruang mudah ditemukan"], ["steps", "Apakah urutan pemesanan dapat dipahami"], ["decoration", "Apakah ilustrasi dekoratif cukup banyak"], ["trend", "Apakah desain mengikuti tren visual terbaru"]] },
        { id: "prototype", label: "Cara memvalidasi perbaikan sebelum implementasi", type: "select", options: [["", "Pilih cara"], ["usability", "Uji prototipe dengan skenario pemesanan yang nyata"], ["approval", "Meminta persetujuan internal tanpa melibatkan pengguna"], ["launch", "Langsung meluncurkan perubahan ke semua pengguna"]] },
      ],
      expected: { research: "interview", priority: ["availability", "steps"], prototype: "usability" },
      weights: { research: 25, priority: 45, prototype: 30 },
      feedback: { research: "Observasi dan wawancara membantu menemukan hambatan dari pengalaman pengguna.", priority: "Fokus pada informasi ketersediaan dan kejelasan urutan alur inti.", prototype: "Uji prototipe melalui skenario nyata sebelum perubahan dibangun." },
    },
  },
};

export function getFreeTrial(simulationId = "system-analyst") {
  if (trials[simulationId]) return trials[simulationId];
  const simulation = getSimulation(simulationId);
  if (!simulation) return null;
  const sourceTask = getSimulationTasks(simulation).find((task) => {
    const expected = task.expected || {};
    return !task.manualReview && Object.keys(expected).length > 0 && (task.fields || []).some((field) => field.type !== "file" && Object.hasOwn(expected, field.id));
  });
  if (!sourceTask) return null;
  const expected = sourceTask.expected || {};
  const fields = (sourceTask.fields || []).filter((field) => field.type !== "file" && Object.hasOwn(expected, field.id));
  const fieldIds = new Set(fields.map((field) => field.id));
  const company = getCompany(simulation.company);
  return {
    role: simulation.role || simulation.role_name || "Simulasi",
    company: company?.name || "Perusahaan simulasi",
    contact: "Tim Studi Kasus",
    intro: simulation.teaser || simulation.summary || simulation.description || "Coba satu bagian dari simulasi ini dan lihat umpan balik awal.",
    task: {
      title: sourceTask.title || "Tantangan awal",
      prompt: sourceTask.question || sourceTask.briefing || sourceTask.description || simulation.caseProblem || "Selesaikan tantangan awal berikut.",
      fields,
      expected: Object.fromEntries(Object.entries(expected).filter(([fieldId]) => fieldIds.has(fieldId))),
      weights: Object.fromEntries(Object.entries(sourceTask.weights || {}).filter(([fieldId]) => fieldIds.has(fieldId))),
      feedback: Object.fromEntries(Object.entries(sourceTask.feedback || {}).filter(([fieldId]) => fieldIds.has(fieldId))),
    },
  };
}

