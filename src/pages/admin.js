import { esc } from "../utils/helpers.js";
import { ico } from "../components/ui.js";

const statusLabel = (status) => ({ draft: "Draft", ready: "Tersedia", soon: "Segera hadir", archived: "Diarsipkan" }[status] || status);
const newQuestion = (type = "multiple_choice") => ({ prompt: "", type, options: "Pilihan A\nPilihan B\nPilihan C", correct: type === "multiple_select" ? "Pilihan A, Pilihan B" : type === "multiple_choice" ? "Pilihan A" : "", weight: "100", feedback: "", rubric: "Dinilai dari kelengkapan, ketepatan, dan alasan jawaban.", codeLanguage: "javascript", codeSnippet: "function contoh() {\n  // Tulis atau perbaiki kode di sini\n}" , acceptedFiles: ".pdf,.doc,.docx,.zip,.png,.jpg", maxFileSizeMB: 10 });
const builderTask = (index) => ({ id: "task-one", sequence: index + 1, title: `Task ${index + 1}`, definition: { duration: "30 menit", question: "", deliverable: "Hasil pekerjaan", questions: [] } });

export function taskEditorHtml(tasks = [builderTask(0)], startIndex = 0) {
  const renderQuestion = (question, ti, qi) => {
    const choiceType = ["multiple_choice", "multiple_select"].includes(question.type);
    const isCode = question.type === "code", isFile = question.type === "file";
    const options = String(question.options || "Pilihan A\nPilihan B\nPilihan C").split("\n");
    const correct = String(question.correct || "").split(",").map((item) => item.trim());
    const optionRows = options.map((option, oi) => `<div class="admin-option-row" data-option-row><input type="${question.type === "multiple_select" ? "checkbox" : "radio"}" name="correct-${ti}-${qi}" data-option-correct ${correct.includes(option.trim()) ? "checked" : ""} aria-label="Tandai ${question.type === "multiple_select" ? "jawaban benar" : "sebagai jawaban benar"}"/><input data-option-text value="${esc(option)}" aria-label="Opsi jawaban ${oi + 1}" placeholder="Tulis opsi jawaban"/><button class="admin-text-button" type="button" data-act="admin-remove-option" data-option-index="${oi}" aria-label="Hapus opsi ${oi + 1}">×</button></div>`).join("");
    return `<article class="admin-question-card" data-question-card data-task-index="${ti}" data-question-index="${qi}"><header><b>Soal ${qi + 1}</b><button class="admin-text-button" type="button" data-act="admin-remove-question" data-task-index="${ti}" data-question-index="${qi}">Hapus soal</button></header><label class="work-field"><span>Pertanyaan / instruksi *</span><textarea rows="3" data-question-field="prompt" required placeholder="Tulis pertanyaan untuk peserta">${esc(question.prompt || "")}</textarea></label><div class="admin-fields"><label class="work-field"><span>Jenis soal</span><select data-question-field="type"><option value="multiple_choice" ${question.type === "multiple_choice" ? "selected" : ""}>Pilihan ganda</option><option value="multiple_select" ${question.type === "multiple_select" ? "selected" : ""}>Pilih beberapa jawaban</option><option value="short_answer" ${question.type === "short_answer" ? "selected" : ""}>Isian singkat</option><option value="essay" ${question.type === "essay" ? "selected" : ""}>Jawaban panjang</option><option value="file" ${question.type === "file" ? "selected" : ""}>Upload file tugas proyek</option><option value="code" ${question.type === "code" ? "selected" : ""}>Analisis potongan kode</option></select></label></div><section class="admin-choice-editor" data-question-options ${choiceType ? "" : "hidden"}><div class="admin-choice-title"><b>Opsi jawaban</b><span>Pilih lingkaran atau kotak di samping jawaban yang benar.</span></div><div class="admin-option-list">${choiceType ? optionRows : ""}</div><button type="button" class="admin-add-option" data-act="admin-add-option">+ Tambah opsi jawaban</button><input type="hidden" data-question-field="options" value="${esc(question.options || "")}"/><input type="hidden" data-question-field="correct" value="${esc(question.correct || "")}"/></section><section class="admin-code-editor" data-question-code ${isCode ? "" : "hidden"}><label class="work-field"><span>Bahasa pemrograman</span><select data-question-field="codeLanguage"><option value="javascript" ${question.codeLanguage === "javascript" ? "selected" : ""}>JavaScript</option><option value="python" ${question.codeLanguage === "python" ? "selected" : ""}>Python</option><option value="java" ${question.codeLanguage === "java" ? "selected" : ""}>Java</option><option value="typescript" ${question.codeLanguage === "typescript" ? "selected" : ""}>TypeScript</option><option value="sql" ${question.codeLanguage === "sql" ? "selected" : ""}>SQL</option><option value="other" ${question.codeLanguage === "other" ? "selected" : ""}>Lainnya</option></select></label><label class="work-field"><span>Potongan kode untuk dianalisis</span><textarea rows="7" data-question-field="codeSnippet" placeholder="Tempel atau tulis kode di sini">${esc(question.codeSnippet || "")}</textarea></label></section><section class="admin-file-editor" data-question-file ${isFile ? "" : "hidden"}><b>Pengaturan file proyek</b><label class="work-field"><span>Jenis file yang diterima</span><input data-question-field="acceptedFiles" value="${esc(question.acceptedFiles || ".pdf,.doc,.docx,.zip")}" placeholder=".pdf,.docx,.zip"/></label><label class="work-field"><span>Batas ukuran file (MB)</span><input type="number" min="1" max="100" data-question-field="maxFileSizeMB" value="${esc(question.maxFileSizeMB || 10)}"/></label><small>Peserta akan diminta melampirkan hasil pekerjaan proyek.</small></section><label class="work-field" data-question-correct ${question.type === "essay" || choiceType ? "hidden" : ""}><span>Jawaban yang diterima</span><input data-question-field="correct" value="${esc(question.correct || "")}" placeholder="Tulis jawaban yang dinilai benar"/></label><label class="work-field" data-question-rubric ${question.type === "essay" ? "" : "hidden"}><span>Panduan penilaian</span><textarea rows="3" data-question-field="rubric">${esc(question.rubric || "Dinilai dari kelengkapan, ketepatan, dan alasan jawaban.")}</textarea></label><div class="admin-fields"><div class="admin-weight-card" data-question-score><span class="admin-weight-label">Bobot nilai soal</span><div class="admin-weight-number"><input type="number" min="0" max="100" step="0.01" readonly data-question-field="weight" value="${esc(question.weight ?? 100)}"/><b>%</b></div><small>Dibagi rata otomatis dari total bobot task.</small></div><label class="work-field" data-question-feedback><span>Feedback untuk peserta</span><textarea rows="2" data-question-field="feedback" placeholder="Tulis feedback setelah jawaban diperiksa">${esc(question.feedback || "")}</textarea></label></div></article>`;
  };
  return tasks.map((task, localIndex) => {
    const ti = startIndex + localIndex;
    const definition = task.definition || {};
    const questions = definition.questions || (definition.fields || []).map((field) => ({ prompt: field.label || "Pertanyaan", type: field.type === "multi" ? "multiple_select" : field.type === "select" ? "multiple_choice" : field.type === "textarea" ? "essay" : "short_answer", options: (field.options || []).slice(1).map((option) => option[1]).join("\n"), correct: (Array.isArray(definition.expected?.[field.id]) ? definition.expected[field.id] : [definition.expected?.[field.id] || ""]).map((answer) => field.options?.find((option) => option[0] === answer)?.[1] || answer).join(", "), weight: definition.weights?.[field.id] ?? 0, feedback: definition.feedback?.[field.id] || "" }));
    const taskId = task.id === "task-one" && definition.questions ? `task-${ti + 1}` : (task.id || `task-${ti + 1}`);
    const duration = Number(String(definition.duration || "").match(/\d+/)?.[0]) || 30;
    const picker = `<div class="admin-question-picker" data-question-picker hidden><div class="admin-question-picker-heading"><b>Pilih jenis soal</b><span>Template bisa disesuaikan setelah dipilih.</span></div><div class="admin-question-type-grid"><button type="button" data-act="admin-add-question" data-task-index="${ti}" data-question-type="multiple_choice"><b>Pilihan ganda</b><span>Satu jawaban benar</span></button><button type="button" data-act="admin-add-question" data-task-index="${ti}" data-question-type="multiple_select"><b>Pilih beberapa</b><span>Lebih dari satu jawaban benar</span></button><button type="button" data-act="admin-add-question" data-task-index="${ti}" data-question-type="short_answer"><b>Isian singkat</b><span>Jawaban berupa teks pendek</span></button><button type="button" data-act="admin-add-question" data-task-index="${ti}" data-question-type="essay"><b>Jawaban panjang</b><span>Dinilai dengan panduan</span></button><button type="button" data-act="admin-add-question" data-task-index="${ti}" data-question-type="file"><b>Upload file proyek</b><span>Peserta mengumpulkan hasil kerja</span></button><button type="button" data-act="admin-add-question" data-task-index="${ti}" data-question-type="code"><b>Potongan kode</b><span>Peserta menganalisis atau memperbaiki kode</span></button></div></div>`;
    return `<article class="admin-task-card" data-task-card data-task-index="${ti}" data-task-id="${esc(taskId)}"><div class="admin-task-number">TASK ${ti + 1}</div><div class="admin-fields"><label class="work-field"><span>Nama task *</span><input data-task-field="title" value="${esc(task.title || `Task ${ti + 1}`)}" required /></label><div class="work-field admin-duration-field"><div class="admin-duration-heading"><span>Durasi task</span><output data-duration-display>${duration} menit</output></div><div class="admin-duration-control"><input type="range" min="5" max="240" step="5" value="${duration}" data-duration-range aria-label="Atur durasi dengan slider"/><label><input type="number" min="1" max="1440" value="${duration}" data-duration-manual aria-label="Durasi task dalam menit"/><span>menit</span></label></div><small>Geser untuk mengatur durasi atau masukkan jumlah menit.</small></div><label class="work-field admin-wide"><span>Brief / konteks task</span><textarea rows="3" data-task-field="briefing" placeholder="Jelaskan situasi dan konteks yang perlu diketahui peserta">${esc(definition.briefing || definition.question || "")}</textarea></label><input type="hidden" data-task-field="duration" value="${duration} menit"/></div><div class="admin-questions-heading"><div><h4>Soal dalam task ini</h4><span>Tambahkan soal lalu pilih jenis jawabannya.</span></div></div><div class="admin-question-list">${questions.map((question, qi) => renderQuestion(question, ti, qi)).join("")}</div><button class="btn btn-light admin-add-question-button" type="button" data-act="admin-toggle-question-picker">+ Tambah soal</button>${picker}<input type="hidden" data-task-field="deliverable" value="${esc(definition.deliverable || "Hasil pekerjaan")}"/></article>`;
  }).join("");
}

export function collectTaskEditor(form) {
  const slug = (value) => String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "option";
  return [...form.querySelectorAll("[data-task-card]")].map((card) => {
    const ti = Number(card.dataset.taskIndex || 0);
    const get = (selector) => card.querySelector(selector)?.value?.trim() || "";
    const fields = [], expected = {}, weights = {}, feedback = {}, savedQuestions = [];
    const questions = [...card.querySelectorAll("[data-question-card]")];
    questions.forEach((q, qi) => {
      const value = (name) => q.querySelector(`[data-question-field="${name}"]:not([type="hidden"])`)?.value?.trim() || "";
      const type = value("type"), prompt = value("prompt"), fieldId = `q${qi + 1}-${slug(prompt).slice(0, 24)}`;
      const optionRows = [...q.querySelectorAll("[data-option-row]")];
      const optionLabels = optionRows.map((row) => row.querySelector("[data-option-text]")?.value?.trim() || "");
      const correctLabels = optionRows.filter((row) => row.querySelector("[data-option-correct]")?.checked).map((row) => row.querySelector("[data-option-text]")?.value?.trim() || "").filter(Boolean);
      const optionsText = optionLabels.join("\n");
      const correctText = ["multiple_choice", "multiple_select"].includes(type) ? correctLabels.join(", ") : value("correct");
      savedQuestions.push({ prompt, type, options: optionsText || value("options"), correct: correctText, weight: value("weight"), feedback: value("feedback"), rubric: value("rubric"), manualReview: type === "file", codeLanguage: value("codeLanguage") || "javascript", codeSnippet: value("codeSnippet"), acceptedFiles: value("acceptedFiles") || ".pdf,.doc,.docx,.zip", maxFileSizeMB: Number(value("maxFileSizeMB")) || 10 });
      const field = { id: fieldId, label: prompt, required: true };
      if (type === "multiple_choice" || type === "multiple_select") {
        const labels = optionLabels.map((item) => item.trim()).filter(Boolean);
        field.type = type === "multiple_choice" ? "select" : "multi";
        field.options = [["", type === "multiple_choice" ? "Pilih jawaban" : "Pilih jawaban"] , ...labels.map((label) => [slug(label), label])];
        if (type === "multiple_select") { field.minSelections = 1; field.maxSelections = correctLabels.length || undefined; }
        const correct = correctLabels.map((item) => labels.find((label) => label.toLowerCase() === item.toLowerCase()) || item).map(slug);
        expected[fieldId] = type === "multiple_select" ? correct : correct[0] || "";
        weights[fieldId] = Number(value("weight")) || 0;
        feedback[fieldId] = value("feedback");
      } else if (type === "short_answer") {
        field.type = "text";
        expected[fieldId] = value("correct");
        weights[fieldId] = Number(value("weight")) || 0;
        feedback[fieldId] = value("feedback");
      } else if (type === "code") {
        field.type = "textarea";
        field.placeholder = "Tulis analisis atau perbaikan kode di sini...";
        field.codeLanguage = value("codeLanguage") || "javascript";
        field.codeSnippet = value("codeSnippet");
        field.minlength = 1;
      } else if (type === "file") {
        field.type = "file";
        field.accept = value("acceptedFiles") || ".pdf,.doc,.docx,.zip";
        field.maxFileSizeMB = Number(value("maxFileSizeMB")) || 10;
      } else {
        field.type = "textarea";
        field.minlength = 1;
      }
      weights[fieldId] = Number(value("weight")) || 0;
      fields.push(field);
    });
    const manualDuration = card.querySelector("[data-duration-manual]")?.value || "30";
    const definition = { id: card.dataset.taskId, number: ti + 1, title: get('[data-task-field="title"]'), duration: `${manualDuration} menit`, question: get('[data-task-field="briefing"]'), briefing: get('[data-task-field="briefing"]'), deliverable: get('[data-task-field="deliverable"]') || "Hasil pekerjaan", manualReview: fields.some((field) => field.type === "file"), fields, expected: Object.keys(expected).length ? expected : undefined, weights, feedback, questions: savedQuestions };
    return { id: card.dataset.taskId, sequence: ti + 1, title: definition.title, definition };
  });
}

function simulationPayload(simulation, companies, tasks) {
  const definition = { ...(simulation.definition || {}) };
  delete definition.projectTasks;
  return { simulation: { id: simulation.id, company_id: simulation.company_id, role_name: simulation.role_name, title: simulation.title,
    price_idr: simulation.price_idr, status: simulation.status, definition },
  tasks: tasks.filter((task) => task.simulation_id === simulation.id).sort((a, b) => a.sequence - b.sequence)
    .map((task) => ({ id: task.id, sequence: task.sequence, title: task.title, definition: task.definition || {} })) };
}

export function AdminPage(data = null) {
  if (!data) return `<section class="container page-pad admin-page"><div class="admin-loading">Memuat Admin Studio…</div></section>`;
  const { companies = [], simulations = [], tasks = [] } = data;
  const companiesById = new Map(companies.map((company) => [company.id, company]));
  const rows = simulations.map((simulation) => {
    const payload = esc(JSON.stringify(simulationPayload(simulation, companies, tasks)));
    const count = tasks.filter((task) => task.simulation_id === simulation.id).length;
    return `<article class="admin-history-item"><div class="admin-history-icon">${ico("bolt")}</div><div class="admin-history-main"><strong>${esc(simulation.title)}</strong><span>${esc(companiesById.get(simulation.company_id)?.name || "Perusahaan belum dipilih")} · ${esc(simulation.definition?.category || "Bidang belum diisi")}</span></div><span class="admin-history-meta">${count} task · ${esc(statusLabel(simulation.status))}</span><button class="btn btn-light btn-sm" type="button" data-act="admin-edit-simulation" data-payload="${payload}">Buka</button></article>`;
  }).join("");
  const companyOptions = companies.map((company) => `<option value="${esc(company.name)}">`).join("");
  const roleOptions = [...new Set(simulations.map((simulation) => simulation.role_name).filter(Boolean))].map((role) => `<option value="${esc(role)}">`).join("");
  const initialTasks = [builderTask(0)];
  return `<section class="container page-pad admin-page">
    <header class="admin-header"><div><div class="eyebrow">ADMIN STUDIO ${data.demo ? "· DEMO" : ""}</div><h1>Simulasi</h1><p>Kelola simulasi dan susun soal langkah demi langkah.</p></div><button class="btn btn-primary admin-create-button" type="button" data-act="admin-new-simulation">${ico("bolt")} Buat soal baru</button></header>
    <section class="content-panel admin-panel" id="admin-simulations"><div class="admin-panel-heading"><div><div class="eyebrow">RIWAYAT</div><h2>Soal yang sudah dibuat</h2></div><span>${simulations.length} simulasi</span></div><div class="admin-history-list">${rows || `<div class="admin-history-empty"><b>Belum ada soal</b><span>Mulai dengan membuat simulasi pertama.</span><button class="btn btn-primary" type="button" data-act="admin-new-simulation">Buat soal pertama</button></div>`}</div></section>
    <section class="content-panel admin-panel admin-editor" id="admin-editor" hidden><div class="eyebrow">PEMBUAT SOAL</div><h2 id="admin-editor-title">Buat soal baru</h2><div class="admin-wizard-progress"><span data-progress-step="info">01 <b>Informasi</b></span><i></i><span data-progress-step="count">02 <b>Jumlah task</b></span><i></i><span data-progress-step="tasks">03 <b>Isi task</b></span><i></i><span data-progress-step="price">04 <b>Harga</b></span></div><p class="admin-help">Ikuti satu tahap setiap kali. Isiannya tersimpan saat berpindah langkah.</p>
      <form id="admin-simulation-form" class="admin-form">
        <section class="admin-step-panel" data-builder-stage="info"><h3>Informasi simulasi</h3><div class="admin-fields"><label class="work-field"><span>Nama soal / judul simulasi *</span><input name="title" required maxlength="160" placeholder="Contoh: Analisis kebutuhan pemesanan" /></label><label class="work-field"><span>Bidang *</span><input name="category" required maxlength="80" placeholder="Pilih atau ketik bidang" list="admin-categories"/><datalist id="admin-categories">${[...new Set(simulations.map((s) => s.definition?.category).filter(Boolean))].map((c) => `<option value="${esc(c)}">`).join("")}</datalist></label><label class="work-field"><span>Perusahaan *</span><input name="company_name" required maxlength="140" placeholder="Pilih atau ketik nama perusahaan" list="admin-companies-list"/><datalist id="admin-companies-list">${companyOptions}</datalist><input type="hidden" name="company_id" /></label><label class="work-field"><span>Posisi *</span><input name="role_name" required maxlength="100" placeholder="Pilih atau ketik posisi" list="admin-roles"/><datalist id="admin-roles">${roleOptions}</datalist></label><input type="hidden" name="id" /><label class="work-field"><span>Ringkasan *</span><textarea name="summary" rows="2" required></textarea></label><label class="work-field"><span>Deskripsi simulasi *</span><textarea name="description" rows="2" required></textarea></label><label class="work-field"><span>Skill atau alat yang diperlukan / digunakan</span><input name="skills" placeholder="Contoh: SQL, Figma, komunikasi" /></label></div><div class="admin-form-actions"><button class="btn btn-light" type="button" data-act="admin-close-editor">Batal</button><button class="btn btn-primary" type="button" data-act="admin-next-count">Lanjut pilih jumlah task</button></div></section>
        <section class="admin-step-panel" data-builder-stage="count" hidden><h3>Simulasi ini terdiri dari berapa task?</h3><p class="admin-help">Pilih jumlah tahap kerja yang ingin dikerjakan peserta.</p><div class="admin-task-count-grid">${[1,2,3,4,5,6].map((count) => `<button type="button" class="admin-task-count-option" data-act="admin-task-count-choice" data-count="${count}"><span class="admin-count-number">0${count}</span><span><b>${count} task</b><small>${count === 1 ? "Alur ringkas" : `Alur kerja ${count} tahap`}</small></span><span class="admin-count-check">✓</span></button>`).join("")}</div><select name="task_count" data-act="admin-task-count" hidden><option value="" selected></option>${[1,2,3,4,5,6].map((count) => `<option value="${count}">${count}</option>`).join("")}</select><div class="admin-form-actions"><button class="btn btn-light" type="button" data-act="admin-prev-info">Kembali</button><button class="btn btn-primary" type="button" data-act="admin-start-tasks">Lanjut ke Task 1</button></div></section>
        <section class="admin-step-panel" data-builder-stage="tasks" hidden><div id="admin-task-progress" class="admin-task-progress"></div><p class="admin-help">Tulis konteks task, lalu susun pertanyaan dan tentukan jenis jawabannya.</p><div id="admin-task-editor">${taskEditorHtml(initialTasks)}</div><input type="hidden" name="tasks" value="${esc(JSON.stringify(initialTasks))}" /><div class="admin-form-actions"><button class="btn btn-light" type="button" data-act="admin-prev-task">Kembali</button><button class="btn btn-primary" type="button" data-act="admin-next-task">Lanjut ke task berikutnya</button><button class="btn btn-primary" type="button" data-act="admin-finish-tasks" hidden>Lanjut ke pengaturan harga</button></div></section>
        <section class="admin-step-panel admin-pricing-stage" data-builder-stage="price" hidden><div class="admin-pricing-intro"><span class="admin-pricing-icon">Rp</span><div><h3>Tentukan harga simulasi</h3><p>Pilih harga yang sesuai dengan nilai latihan, tingkat kesulitan, dan waktu pengerjaan.</p></div></div><div class="admin-price-tier-grid"><label class="admin-price-tier"><input class="admin-price-tier-radio" type="radio" name="pricing_tier" value="standard" checked/><span class="admin-price-tier-tag">STANDAR</span><b>Akses simulasi</b><small>Seluruh task dan soal simulasi</small><strong class="admin-price-fixed">Rp19.000</strong></label><label class="admin-price-tier admin-price-tier-featured"><input class="admin-price-tier-radio" type="radio" name="pricing_tier" value="advanced"/><span class="admin-price-tier-tag">ADVANCED</span><b>Akses simulasi Advanced</b><small>Untuk simulasi dengan tingkat lanjutan</small><strong class="admin-price-fixed">Rp29.000</strong></label></div><div class="admin-pricing-note"><b>Dua pilihan harga</b><span>Tetapkan harga Standar dan Advanced untuk simulasi ini.</span></div><div class="admin-form-actions"><button class="btn btn-light" type="button" data-act="admin-back-to-tasks">Kembali ke task</button><button class="btn btn-primary" type="button" data-act="admin-save-simulation">Simpan dan publikasikan</button></div></section>
      </form>
    </section>
  </section>`;
}

export function adminSimulationPayload(form, formData) {
  const title = String(formData.get("title") || "").trim();
  const generatedId = title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "simulasi-baru";
  const id = String(formData.get("id") || generatedId).trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error("ID hanya boleh berisi huruf kecil, angka, dan tanda hubung.");
  for (const [field, label] of [["company_id", "Perusahaan"], ["role_name", "Posisi"], ["title", "Judul proyek"], ["category", "Bidang"], ["level", "Level"], ["duration", "Durasi total"], ["teaser", "Ringkasan kartu eksplorasi"], ["icon", "Ikon eksplorasi"], ["summary", "Ringkasan"], ["description", "Deskripsi pekerjaan"], ["about", "Tentang simulasi"], ["caseName", "Nama studi kasus"], ["caseProblem", "Masalah studi kasus"], ["deliverable", "Deliverable simulasi"], ["company_name", "Nama perusahaan"], ["company_desc", "Deskripsi perusahaan"]]) {
    if (!String(formData.get(field) || "").trim()) throw new Error(`${label} wajib diisi.`);
  }
  const tasksText = String(formData.get("tasks") || "");
  let tasks;
  try { tasks = JSON.parse(tasksText); } catch { throw new Error("Daftar tugas harus berupa JSON yang valid."); }
  if (!Array.isArray(tasks) || tasks.length === 0) throw new Error("Tambahkan setidaknya satu tugas.");
  if (Number(formData.get("task_count")) && Number(formData.get("task_count")) !== tasks.length) throw new Error("Jumlah task tidak sesuai dengan task yang diisi.");
  const ids = new Set();
  tasks.forEach((task, index) => {
    if (!task || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(task.id || "") || ids.has(task.id)) throw new Error(`ID tugas ${index + 1} tidak valid atau duplikat.`);
    ids.add(task.id);
    if (Number(task.sequence) !== index + 1) throw new Error("Urutan tugas harus berurutan mulai dari 1.");
    if (!task.title?.trim() || !task.definition || !Array.isArray(task.definition.fields) || !task.definition.fields.length) throw new Error(`Task ${index + 1} harus memiliki judul dan minimal satu soal.`);
    for (const [qIndex, question] of (task.definition.questions || []).entries()) {
      if (!question.prompt?.trim()) throw new Error(`Task ${index + 1}, soal ${qIndex + 1}: instruksi wajib diisi.`);
      if (["essay", "code", "file"].includes(question.type) && !question.rubric?.trim()) throw new Error(`Task ${index + 1}, soal ${qIndex + 1}: panduan pemeriksaan admin wajib diisi.`);
      if (question.type === "file" && (!Number.isFinite(Number(question.maxFileSizeMB)) || Number(question.maxFileSizeMB) < 1 || Number(question.maxFileSizeMB) > 50)) throw new Error(`Task ${index + 1}, soal ${qIndex + 1}: batas file harus 1–50 MB.`);
      if (["multiple_choice", "multiple_select"].includes(question.type)) {
        const options = String(question.options || "").split("\n").map((item) => item.trim()).filter(Boolean);
        if (options.length < 2) throw new Error(`Task ${index + 1}, soal ${qIndex + 1}: isi minimal dua opsi.`);
        if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) throw new Error(`Task ${index + 1}, soal ${qIndex + 1}: opsi tidak boleh duplikat.`);
        const correct = String(question.correct || "").split(",").map((item) => item.trim()).filter(Boolean);
        if (!correct.length || correct.some((answer) => !options.some((option) => option.toLowerCase() === answer.toLowerCase()))) throw new Error(`Task ${index + 1}, soal ${qIndex + 1}: jawaban benar harus sama dengan teks opsi.`);
      } else if (question.type === "short_answer" && !question.correct?.trim()) throw new Error(`Task ${index + 1}, soal ${qIndex + 1}: jawaban yang diterima wajib diisi.`);
      else if (!(["short_answer", "essay", "code", "file"].includes(question.type))) throw new Error(`Task ${index + 1}, soal ${qIndex + 1}: jenis jawaban tidak dikenal.`);
    }
    if (/^task-\d+$/.test(task.id)) task.id = `${id}-${task.id}`;
    task.definition.id = task.id;
    task.definition.number = index + 1;
  });
  const selectedTier = String(formData.get("pricing_tier") || "");
  if (!["standard", "advanced"].includes(selectedTier)) throw new Error("Pilih paket Standar atau Advanced.");
  const price = selectedTier === "advanced" ? 29000 : 19000;
  const advancedPrice = 29000;
  const definition = {
    category: String(formData.get("category") || "").trim(), level: String(formData.get("level") || "Pemula").trim(), duration: String(formData.get("duration") || "").trim(),
    teaser: String(formData.get("teaser") || "").trim(), icon: String(formData.get("icon") || "workflow").trim(),
    summary: String(formData.get("summary") || "").trim(), description: String(formData.get("description") || "").trim(), about: String(formData.get("about") || "").trim(),
    caseName: String(formData.get("caseName") || "").trim(), caseProblem: String(formData.get("caseProblem") || "").trim(), deliverable: String(formData.get("deliverable") || "").trim(),
    skills: String(formData.get("skills") || "").split(",").map((item) => item.trim()).filter(Boolean),
    tools: String(formData.get("tools") || "").split("\n").map((item) => item.trim()).filter(Boolean), selected_pricing_tier: selectedTier,
    pricing: [{ id: "standard", name: "Standar", price_idr: 19000 }, { id: "advanced", name: "Advanced", price_idr: advancedPrice }],
    projectTasks: tasks.map((task) => ({ ...task.definition, id: task.id, title: task.title })),
  };
  const status = String(formData.get("status") || "ready");
  if (!["draft", "ready", "soon"].includes(status)) throw new Error("Pilih status publikasi yang valid.");
  return { simulation: { id, company_id: String(formData.get("company_id") || ""), role_name: String(formData.get("role_name") || "").trim(), title: String(formData.get("title") || "").trim(), price_idr: price, status, definition },
    tasks: tasks.map((task) => ({ id: task.id, sequence: Number(task.sequence), title: task.title.trim(), definition: task.definition })) };
}

export function AdminReviewsPage(reviews = null) {
  if (!reviews) return `<section class="container page-pad admin-page"><div class="admin-loading">Memuat pengumpulan file…</div></section>`;
  const rows = reviews.map((review) => {
    const rubric = (review.rubric || []).filter((question) => question.manualReview || question.type === "file" || question.type === "essay" || question.type === "code");
    const files = (review.files || []).map((file) => file.url
      ? `<a class="btn btn-light btn-sm" href="${esc(file.url)}" target="_blank" rel="noopener">Buka ${esc(file.name)}</a>`
      : `<span class="admin-empty">File tidak dapat dibuka.</span>`).join("");
    const answers = Object.entries(review.answers || {}).filter(([, value]) => !value?.storagePath)
      .map(([key, value]) => `<li><b>${esc(key)}</b>: ${esc(Array.isArray(value) ? value.join(", ") : value)}</li>`).join("");
    const reviewed = review.review_status === "reviewed";
    return `<article class="content-panel admin-review-card"><header class="admin-review-head"><div><div class="eyebrow">${esc(review.simulation_title)} · ${esc(review.task_title)}</div><h2>${esc(review.user_email || review.user_id)}</h2><p>Dikirim ${esc(new Date(review.submitted_at).toLocaleString("id-ID"))}</p></div><span class="pill ${reviewed ? "pill-green" : "pill-blue"}">${reviewed ? "Sudah dinilai" : "Menunggu penilaian"}</span></header>${rubric.length ? `<section class="admin-review-rubric"><b>Panduan pemeriksaan</b>${rubric.map((question) => `<div><strong>${esc(question.prompt || "Kriteria")}</strong><p>${esc(question.rubric || question.feedback || "Periksa kesesuaian, kelengkapan, dan kualitas deliverable.")}</p></div>`).join("")}</section>` : ""}<div class="admin-review-files">${files || `<span class="admin-empty">Tidak ada file terlampir.</span>`}</div>${answers ? `<ul class="admin-review-answers">${answers}</ul>` : ""}<form class="admin-review-form" data-submission-id="${esc(review.submission_id)}"><label class="work-field"><span>Nilai (0–100) *</span><input name="score" type="number" min="0" max="100" step="1" required value="${reviewed ? esc(review.manual_score) : ""}" placeholder="Masukkan nilai"/></label><label class="work-field"><span>Feedback untuk peserta *</span><textarea name="feedback" rows="3" minlength="5" required placeholder="Jelaskan kekuatan hasil dan hal yang perlu diperbaiki.">${reviewed ? esc(review.manual_feedback) : ""}</textarea></label><button class="btn btn-primary" type="submit">${reviewed ? "Perbarui penilaian" : "Simpan penilaian"}</button></form></article>`;
  }).join("");
  const pending = reviews.filter((review) => review.review_status === "pending").length;
  return `<section class="container page-pad admin-page"><div class="breadcrumbs"><a href="#/admin">Admin Studio</a>${ico("chevron")}<span>Pemeriksaan file</span></div><header class="admin-header"><div><div class="eyebrow">PENILAIAN MANUAL</div><h1>Pengumpulan file</h1><p>${pending} menunggu pemeriksaan · ${reviews.length} total pengumpulan</p></div><a class="btn btn-light" href="#/admin">Kembali ke Admin Studio</a></header><div class="admin-review-list">${rows || `<section class="content-panel admin-history-empty"><b>Belum ada pengumpulan file</b><span>Pengumpulan file peserta akan muncul di sini.</span></section>`}</div></section>`;
}


