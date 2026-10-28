import { tasks as systemAnalystTasks } from "./systemAnalyst.js";

const defaultCompanies = [
  { id: "nusa", name: "PT Nusa Digital Solusi", initials: "ND", desc: "Perusahaan teknologi ilustratif untuk studi kasus System Analyst.", color: "#e7efff" },
  { id: "data", name: "PT Data Cakrawala", initials: "DC", desc: "Perusahaan ritel digital ilustratif yang menggunakan data untuk mengambil keputusan bisnis.", color: "#e8f5f3" },
  { id: "kreasi", name: "PT Kreasi Visual Nusantara", initials: "KV", desc: "Studio produk digital ilustratif yang merancang pengalaman untuk pengguna Indonesia.", color: "#f6ecff" },
  { id: "aksara", name: "PT Aksara Media Kreatif", initials: "AM", desc: "Agensi pemasaran ilustratif yang membantu brand menjangkau audiens digital.", color: "#fff2e5" },
];

const defaultSimulations = [
  {
    id: "system-analyst", company: "nusa", category: "Teknologi Informasi", role: "System Analyst",
    title: "Requirement Analysis & Validation", level: "Pemula", duration: "90–120 menit", price: 19000, status: "ready",
    skills: ["Analisis Kebutuhan", "User Story", "Kriteria Penerimaan", "Validasi Kebutuhan"],
    tools: ["Ruang kerja kebutuhan terstruktur", "diagrams.net (opsional)"],
    teaser: "Ubah kebutuhan stakeholder menjadi spesifikasi yang bisa diuji.", icon: "workflow", tag: "Tersedia",
    summary: "Berperan sebagai Junior System Analyst: ubah keluhan pemesanan ruang rapat menjadi requirement, user story, dan validasi yang dapat ditindaklanjuti tim produk.",
    description: "Berperan sebagai Junior System Analyst untuk proyek sistem peminjaman ruang rapat. Identifikasi requirement, tulis user story, lalu validasi kebutuhan stakeholder.",
    about: "Kamu membantu tim produk memahami masalah operasional sebelum solusi dikembangkan. Fokus latihan adalah membuat kebutuhan yang jelas, punya prioritas, dan dapat diuji.",
    caseName: "Meeting Room Booking System",
    caseProblem: "Dua tim dapat memesan ruang rapat yang sama pada waktu bersamaan. Pencatatan melalui spreadsheet bersama membingungkan staf dan tidak konsisten.",
    deliverable: "Requirements Register, User Story & Acceptance Criteria, Validation Log",
  },
  {
    id: "data-analyst", company: "data", category: "Data dan Analitik", role: "Data Analyst",
    title: "Analisis Performa Penjualan", level: "Pemula", duration: "90 menit", price: 29000, status: "ready",
    skills: ["Pembersihan Data", "SQL", "Analisis Tren", "Pelaporan Temuan"], tools: ["Dataset latihan", "SQL", "Lembar kerja"],
    teaser: "Telusuri data penjualan dan komunikasikan temuan bisnis.", icon: "chart", tag: "Tersedia",
    summary: "Analisis data transaksi untuk menemukan penyebab perubahan penjualan dan menyampaikan rekomendasi yang bisa diuji oleh tim bisnis.",
    description: "Kamu menjadi Data Analyst di PT Data Cakrawala. Tim komersial meminta analisis atas penurunan penjualan pada beberapa kategori dan wilayah.",
    about: "Simulasi memperkenalkan alur kerja analisis data dari pemeriksaan kualitas data sampai rekomendasi. Kamu akan membedakan temuan berbasis data dari dugaan, lalu menjelaskan batasan analisis kepada stakeholder.",
    caseName: "Evaluasi Penjualan Kuartal Terakhir",
    caseProblem: "Penjualan keseluruhan tampak menurun, tetapi tim belum tahu apakah penyebabnya berasal dari kategori produk, wilayah, atau perubahan jumlah transaksi.",
    deliverable: "Catatan kualitas data, ringkasan analisis, dan rekomendasi bisnis",
    projectTasks: [
      { id: "data-cleaning", title: "Pemeriksaan dan pembersihan data", duration: "20 menit", question: "Pilih penanganan yang paling aman untuk tiap masalah kualitas data: tanggal kosong, transaksi duplikat, dan nilai penjualan yang tidak wajar.", deliverable: "Log pemeriksaan kualitas data",
        fields: [
          { id: "missing", label: "Tanggal transaksi kosong", type: "select", options: [["", "Pilih penanganan"], ["flag", "Tandai untuk ditelusuri; jangan menebak tanggal"], ["today", "Isi dengan tanggal hari ini"], ["delete", "Hapus semua baris tersebut"]] },
          { id: "duplicate", label: "Transaksi dengan ID duplikat", type: "select", options: [["", "Pilih penanganan"], ["validate", "Validasi ID dan pertahankan satu transaksi yang sah"], ["sum", "Jumlahkan semua baris duplikat"], ["keep", "Biarkan semua baris tanpa pemeriksaan"]] },
          { id: "outlier", label: "Nilai penjualan jauh di atas pola umum", type: "select", options: [["", "Pilih penanganan"], ["inspect", "Periksa sumber dan konteks sebelum memutuskan"], ["delete", "Hapus otomatis sebagai kesalahan"], ["replace", "Ganti dengan nilai rata-rata"]] },
        ], expected: { missing: "flag", duplicate: "validate", outlier: "inspect" }, weights: { missing: 34, duplicate: 33, outlier: 33 }, feedback: { missing: "Nilai yang hilang perlu ditandai dan diselidiki tanpa membuat data baru.", duplicate: "Validasi kunci transaksi sebelum menghapus duplikat agar transaksi sah tidak hilang.", outlier: "Nilai ekstrem perlu diperiksa ke sumber data sebelum dikoreksi atau dikecualikan." } },
      { id: "sales-analysis", title: "Analisis tren penjualan", duration: "35 menit", question: "Pilih dua dimensi yang paling membantu menemukan segmen penyumbang penurunan penjualan. Setelah memilih, jelaskan pola yang akan kamu bandingkan.", deliverable: "Ringkasan temuan analisis",
        fields: [{ id: "drivers", label: "Pilih tepat 2 dimensi analisis", type: "multi", minSelections: 2, maxSelections: 2, options: [["category", "Kategori produk"], ["region", "Wilayah penjualan"], ["font", "Jenis huruf pada situs"], ["color", "Warna kemasan"]] }, { id: "analysisNote", label: "Apa yang akan kamu bandingkan? (minimal 20 karakter)", type: "textarea", minlength: 20 }], expected: { drivers: ["category", "region"] }, weights: { drivers: 100 }, feedback: { drivers: "Kategori dan wilayah membantu mengisolasi segmen bisnis yang terkait dengan perubahan penjualan." } },
      { id: "business-recommendation", title: "Rekomendasi untuk stakeholder", duration: "35 menit", question: "Pilih langkah awal yang paling tepat untuk menguji rekomendasi bisnis, lalu tulis rekomendasi dan metrik keberhasilannya.", deliverable: "Memo rekomendasi bisnis",
        fields: [{ id: "validation", label: "Langkah awal yang disarankan", type: "select", options: [["", "Pilih langkah"], ["pilot", "Uji coba terukur pada segmen yang teridentifikasi"], ["rollout", "Terapkan langsung ke semua wilayah"], ["ignore", "Abaikan temuan karena hanya data historis"]] }, { id: "memo", label: "Rekomendasi dan metrik keberhasilan (minimal 20 karakter)", type: "textarea", minlength: 20 }], expected: { validation: "pilot" }, weights: { validation: 100 }, feedback: { validation: "Pilot terukur menguji dampak rekomendasi sebelum penerapan lebih luas." } },
    ],
  },
  {
    id: "uiux-designer", company: "kreasi", category: "Desain", role: "UI/UX Designer",
    title: "User Journey dan Wireframe", level: "Pemula", duration: "100 menit", price: 19000, status: "ready",
    skills: ["Riset Pengguna", "User Journey", "Arsitektur Informasi", "Wireframing", "Usability"], tools: ["Lembar kerja", "Figma (opsional)"],
    teaser: "Terjemahkan masalah pengguna menjadi alur dan wireframe.", icon: "pen", tag: "Tersedia",
    summary: "Rancang alur pemesanan konsultasi yang mudah dipahami dengan menghubungkan kebutuhan pengguna, struktur layar, dan rencana pengujian.",
    description: "Kamu menjadi UI/UX Designer di PT Kreasi Visual Nusantara. Tim ingin menyederhanakan pengalaman pengguna saat mencari dan memesan layanan konsultasi.",
    about: "Simulasi berfokus pada proses desain yang berangkat dari masalah pengguna, bukan sekadar tampilan visual. Kamu akan merumuskan kebutuhan, menyusun alur, membuat wireframe awal, dan menetapkan cara memvalidasinya.",
    caseName: "Platform Pemesanan Konsultasi",
    caseProblem: "Pengguna kesulitan menemukan layanan yang sesuai dan sering berhenti sebelum menyelesaikan pemesanan karena informasi jadwal serta biaya tersebar di beberapa halaman.",
    deliverable: "Ringkasan kebutuhan pengguna, user journey, wireframe, dan rencana usability test",
    projectTasks: [
      { id: "user-needs", title: "Sintesis kebutuhan pengguna", duration: "25 menit", question: "Pilih kebutuhan yang sebaiknya diprioritaskan dari masalah pencarian layanan dan pemesanan. Jelaskan alasan berdasarkan dampaknya pada pengguna.", deliverable: "Ringkasan kebutuhan dan prioritas",
        fields: [{ id: "priority", label: "Kebutuhan prioritas", type: "select", options: [["", "Pilih kebutuhan"], ["compare", "Membandingkan layanan, jadwal, dan biaya sebelum memesan"], ["animation", "Menambahkan animasi dekoratif"], ["profile", "Mengubah warna foto profil"]] }, { id: "reason", label: "Alasan prioritas (minimal 20 karakter)", type: "textarea", minlength: 20 }], expected: { priority: "compare" }, weights: { priority: 100 }, feedback: { priority: "Informasi layanan, jadwal, dan biaya menjawab hambatan utama sebelum pemesanan." } },
      { id: "user-journey", title: "User journey dan struktur alur", duration: "30 menit", question: "Pilih tepat dua informasi yang harus terlihat sebelum pengguna mengonfirmasi pemesanan konsultasi.", deliverable: "User journey dan alur pemesanan",
        fields: [{ id: "information", label: "Pilih tepat 2 informasi", type: "multi", minSelections: 2, maxSelections: 2, options: [["schedule", "Jadwal konsultasi yang tersedia"], ["price", "Biaya layanan"], ["animation", "Animasi halaman pembuka"], ["admin", "Nama administrator situs"]] }, { id: "flow", label: "Sebutkan satu titik rawan kebingungan dan cara menguranginya (minimal 20 karakter)", type: "textarea", minlength: 20 }], expected: { information: ["schedule", "price"] }, weights: { information: 100 }, feedback: { information: "Jadwal dan biaya merupakan informasi penting untuk keputusan pemesanan." } },
      { id: "wireframe-validation", title: "Wireframe dan validasi desain", duration: "45 menit", question: "Pilih metode validasi yang paling tepat untuk memeriksa apakah pengguna dapat menyelesaikan pemesanan melalui rancanganmu. Tambahkan contoh skenario uji.", deliverable: "Wireframe low-fidelity dan rencana usability test",
        fields: [{ id: "test", label: "Metode validasi", type: "select", options: [["", "Pilih metode"], ["usability", "Usability test berbasis tugas pemesanan"], ["colors", "Meminta tim memilih warna favorit"], ["impressions", "Mengukur jumlah animasi di layar"]] }, { id: "scenario", label: "Contoh skenario pengujian (minimal 20 karakter)", type: "textarea", minlength: 20 }], expected: { test: "usability" }, weights: { test: 100 }, feedback: { test: "Usability test mengamati keberhasilan pengguna menyelesaikan tugas nyata." } },
    ],
  },
  {
    id: "digital-marketing", company: "aksara", category: "Pemasaran", role: "Digital Marketing",
    title: "Strategi Kampanye Digital", level: "Pemula", duration: "90 menit", price: 19000, status: "ready",
    skills: ["Strategi Kampanye", "Segmentasi Audiens", "Copywriting", "Metrik Digital"], tools: ["Lembar kerja kampanye", "Contoh data kanal"],
    teaser: "Susun kampanye digital berdasarkan tujuan bisnis.", icon: "megaphone", tag: "Tersedia",
    summary: "Buat rancangan kampanye peluncuran produk yang menghubungkan tujuan bisnis, audiens, pesan, kanal, dan metrik keberhasilan.",
    description: "Kamu menjadi Digital Marketer di PT Aksara Media Kreatif. Sebuah brand lokal akan meluncurkan produk baru dan membutuhkan kampanye digital yang terukur.",
    about: "Simulasi mengajakmu merancang kampanye dari brief hingga evaluasi. Setiap pilihan kanal dan pesan harus sesuai dengan audiens serta tujuan, dan keberhasilan kampanye diukur menggunakan metrik yang tepat.",
    caseName: "Kampanye Peluncuran Produk Lokal",
    caseProblem: "Brand memiliki anggaran terbatas dan ingin meningkatkan kunjungan ke halaman produk sekaligus memperoleh pembelian pertama dari audiens usia 18–30 tahun.",
    deliverable: "Brief kampanye, contoh copy, rencana kanal, dan dashboard metrik",
    projectTasks: [
      { id: "campaign-audience", title: "Tujuan dan segmentasi audiens", duration: "20 menit", question: "Pilih tujuan kampanye yang paling sesuai dengan brief peluncuran: meningkatkan kunjungan sekaligus mendorong pembelian pertama dari audiens usia 18–30 tahun.", deliverable: "Tujuan kampanye dan profil audiens",
        fields: [{ id: "objective", label: "Tujuan kampanye", type: "select", options: [["", "Pilih tujuan"], ["conversion", "Mendorong kunjungan berkualitas dan pembelian pertama"], ["followers", "Menambah pengikut tanpa target lanjutan"], ["awareness", "Meningkatkan impresi saja tanpa mengukur kunjungan"]] }, { id: "audience", label: "Insight kebutuhan audiens (minimal 20 karakter)", type: "textarea", minlength: 20 }], expected: { objective: "conversion" }, weights: { objective: 100 }, feedback: { objective: "Tujuan ini mencakup kunjungan dan pembelian pertama yang diminta di brief." } },
      { id: "campaign-channels", title: "Pesan dan rencana kanal", duration: "35 menit", question: "Pilih tepat dua kanal yang paling masuk akal untuk menjangkau audiens dewasa muda dan mengarahkan mereka ke halaman produk.", deliverable: "Matriks kanal dan contoh copy",
        fields: [{ id: "channels", label: "Pilih tepat 2 kanal", type: "multi", minSelections: 2, maxSelections: 2, options: [["social", "Konten dan iklan media sosial"], ["creator", "Kolaborasi kreator yang relevan"], ["fax", "Pengiriman faks massal"], ["billboard", "Papan informasi internal kantor"]] }, { id: "copy", label: "Contoh pesan dan ajakan bertindak (minimal 20 karakter)", type: "textarea", minlength: 20 }], expected: { channels: ["social", "creator"] }, weights: { channels: 100 }, feedback: { channels: "Media sosial dan kreator relevan dapat menjangkau audiens digital serta mengarahkan trafik." } },
      { id: "campaign-metrics", title: "Metrik dan evaluasi kampanye", duration: "35 menit", question: "Pilih dua metrik yang paling berguna untuk memantau kunjungan ke halaman produk dan hasil pembelian.", deliverable: "Rencana pengukuran dan optimasi",
        fields: [{ id: "metrics", label: "Pilih tepat 2 metrik", type: "multi", minSelections: 2, maxSelections: 2, options: [["ctr", "Click-through rate ke halaman produk"], ["conversion", "Conversion rate pembelian"], ["color", "Jumlah warna pada materi kampanye"], ["likes", "Jumlah suka tanpa konteks tujuan"]] }, { id: "action", label: "Tindakan optimasi jika hasil di bawah target (minimal 20 karakter)", type: "textarea", minlength: 20 }], expected: { metrics: ["ctr", "conversion"] }, weights: { metrics: 100 }, feedback: { metrics: "CTR mengukur kunjungan dari iklan, sedangkan conversion rate mengukur pembelian." } },
    ],
  },
];

export let companies = defaultCompanies;
export let simulations = defaultSimulations;

// In Supabase mode the database becomes the runtime catalog. Local definitions
// remain as a demo fallback and as the initial data source for the seed script.
export function hydrateCatalog(companyRows, simulationRows, taskRows) {
  if (!Array.isArray(simulationRows) || simulationRows.length === 0) return false;
  const mappedCompanies = (companyRows || []).map((row) => ({ ...row.definition, id: row.id, name: row.name }));
  const mappedSimulations = simulationRows.map((row) => {
    const definition = row.definition || {};
    const rowsForSimulation = (taskRows || []).filter((task) => task.simulation_id === row.id)
      .sort((a, b) => a.sequence - b.sequence)
      .map((task) => ({ ...task.definition, id: task.id }));
    // The admin editor also persists a task snapshot in definition. Prefer
    // normalized task rows, but use that snapshot if a deployment is missing
    // task rows (or its read policy hasn't been applied yet).
    const embeddedTasks = Array.isArray(definition.projectTasks) ? definition.projectTasks : [];
    const projectTasks = rowsForSimulation.length ? rowsForSimulation : embeddedTasks;
    const clean = (value) => String(value || "").trim();
    const roleName = [row.role_name, definition.role_name, definition.role, row.title, definition.title]
      .map(clean).find((value) => /[\p{L}\p{N}]/u.test(value)) || "Simulasi pekerjaan";
    const title = clean(row.title) || clean(definition.title) || roleName;
    return { ...definition, id: row.id, company: row.company_id, role_name: roleName, role: roleName, title, status: row.status, price: row.price_idr, projectTasks };
  });
  companies = mappedCompanies;
  simulations = mappedSimulations;
  return true;
}

export const getSimulation = (id) => simulations.find((simulation) => simulation.id === id);
export const getSimulationTasks = (simulation) => {
  if (!simulation) return [];
  const configured = Array.isArray(simulation.projectTasks) ? simulation.projectTasks : [];
  if (simulation.id === "system-analyst") {
    // System Analyst's three canonical stages predate the normalized catalog.
    // Use them when the remote catalog is missing or only partially seeded.
    const expectedIds = systemAnalystTasks.map((task) => task.id);
    const completeCatalog = expectedIds.every((id) => configured.some((task) => task.id === id));
    return completeCatalog ? expectedIds.map((id) => configured.find((task) => task.id === id)) : systemAnalystTasks;
  }
  return configured;
};
export const getProjectTask = (id) => {
  for (const simulation of simulations) {
    const task = getSimulationTasks(simulation).find((item) => item.id === id);
    if (task) return { ...task, simulationId: simulation.id };
  }
  return null;
};
export const getCompany = (id) => companies.find((company) => company.id === id);
export const rupiah = (amount) => "Rp" + Number(amount).toLocaleString("id-ID");
export const CASE = {
  name: "Meeting Room Booking System",
  pm: "Dina Prameswari",
  stakeholder: "Rani — Office Operations Lead",
  problem: "Saat ini dua tim dapat memesan ruang rapat yang sama pada jam yang sama. Proses pencatatan menggunakan spreadsheet bersama dan sering membingungkan staf.",
  mission: "Buat spesifikasi awal agar tim developer memahami kebutuhan yang terukur, dapat diuji, dan sesuai tujuan bisnis.",
};

