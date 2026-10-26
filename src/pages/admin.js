import { esc } from "../utils/helpers.js";
import { ico } from "../components/ui.js";

const pretty = (value) => JSON.stringify(value ?? {}, null, 2);

export function AdminPage(data = null) {
  if (!data) return `<section class="container page-pad admin-page"><div class="admin-loading">Memuat ruang admin…</div></section>`;
  const { companies = [], simulations = [], tasks = [] } = data;
  const companyOptions = companies.map((company) => `<option value="${esc(company.id)}">${esc(company.name)}</option>`).join("");
  const simulationRows = simulations.map((simulation) => {
    const simTasks = tasks.filter((task) => task.simulation_id === simulation.id).sort((a, b) => a.sequence - b.sequence);
    const definition = { ...(simulation.definition || {}) };
    delete definition.projectTasks;
    const payload = {
      simulation: { id: simulation.id, company_id: simulation.company_id, role_name: simulation.role_name,
        title: simulation.title, price_idr: simulation.price_idr, status: simulation.status, definition },
      tasks: simTasks.map((task) => ({ id: task.id, sequence: task.sequence, title: task.title, definition: task.definition || {} })),
    };
    return `<article class="admin-row"><div><b>${esc(simulation.role_name)}</b><span>${esc(simulation.title)} · ${simTasks.length} tugas · Rp${Number(simulation.price_idr).toLocaleString("id-ID")}</span></div><span class="admin-status">${esc(simulation.status)}</span><button class="btn btn-light btn-sm" type="button" data-act="admin-edit-simulation" data-payload="${esc(JSON.stringify(payload))}">Edit</button></article>`;
  }).join("");

  return `<section class="container page-pad admin-page">
    <header class="admin-header"><div><div class="eyebrow">PENGELOLAAN SIMAGANG</div><h1>Ruang Admin</h1><p>Kelola perusahaan, katalog simulasi, status publikasi, dan rangkaian tugas.</p></div><button class="btn btn-primary" type="button" data-act="admin-new-simulation">${ico("bolt")} Simulasi baru</button></header>
    <div class="admin-metrics"><article><span>Perusahaan</span><b>${companies.length}</b></article><article><span>Simulasi</span><b>${simulations.length}</b></article><article><span>Tugas</span><b>${tasks.length}</b></article><article><span>Dipublikasikan</span><b>${simulations.filter((item) => item.status === "ready").length}</b></article></div>
    <section class="content-panel admin-panel"><div class="admin-panel-heading"><div><div class="eyebrow">KATALOG</div><h2>Simulasi dan tugas</h2></div><span>${simulations.length} simulasi</span></div>${simulationRows || `<p class="admin-empty">Belum ada simulasi dalam katalog.</p>`}</section>
    <section class="content-panel admin-panel admin-editor" id="admin-editor">
      <div class="eyebrow">EDITOR KATALOG</div><h2 id="admin-editor-title">Buat simulasi baru</h2><p class="admin-help">Definisi simulasi dan tugas disimpan ke Supabase. Status <b>ready</b> akan terlihat oleh pelamar.</p>
      <form id="admin-simulation-form" class="admin-form">
        <div class="admin-fields"><label class="work-field"><span>ID simulasi</span><input name="id" required pattern="[a-z0-9-]+" placeholder="contoh: product-manager" /></label><label class="work-field"><span>Nama role</span><input name="role_name" required maxlength="100" placeholder="Product Manager" /></label><label class="work-field"><span>Nama proyek</span><input name="title" required maxlength="160" placeholder="Validasi strategi produk" /></label><label class="work-field"><span>Perusahaan</span><select name="company_id" required><option value="">Pilih perusahaan</option>${companyOptions}</select></label><label class="work-field"><span>Harga (rupiah)</span><input name="price_idr" type="number" min="0" step="1000" value="0" required /></label><label class="work-field"><span>Status</span><select name="status"><option value="draft">Draft</option><option value="ready">Tersedia</option><option value="soon">Segera hadir</option><option value="archived">Arsip</option></select></label></div>
        <label class="work-field"><span>Definisi simulasi (JSON)</span><textarea name="definition" rows="12" required spellcheck="false">{\n  "category": "Teknologi Informasi",\n  "level": "Pemula",\n  "duration": "90 menit",\n  "skills": [],\n  "tools": [],\n  "summary": "",\n  "description": "",\n  "about": "",\n  "caseName": "",\n  "caseProblem": "",\n  "deliverable": ""\n}</textarea><small>Properti katalog seperti category, summary, about, skills, dan deliverable disimpan di sini.</small></label>
        <label class="work-field"><span>Daftar tugas (JSON array)</span><textarea name="tasks" rows="18" required spellcheck="false">[\n  {\n    "id": "task-one",\n    "sequence": 1,\n    "title": "Nama tugas",\n    "definition": {\n      "duration": "30 menit",\n      "question": "Instruksi tugas",\n      "deliverable": "Hasil pekerjaan",\n      "fields": [],\n      "expected": {},\n      "weights": {},\n      "feedback": {}\n    }\n  }\n]</textarea><small>Setiap tugas harus memiliki ID unik dan sequence berurutan mulai dari 1. Bentuk fields mengikuti schema form simulasi.</small></label>
        <div class="admin-form-actions"><button class="btn btn-primary" type="submit">Simpan ke Supabase</button><button class="btn btn-light" type="button" data-act="admin-reset-form">Kosongkan</button></div>
      </form>
    </section>
    <section class="content-panel admin-panel admin-company-panel"><div class="eyebrow">PERUSAHAAN</div><h2>Tambah atau perbarui perusahaan</h2><form id="admin-company-form" class="admin-form"><div class="admin-fields"><label class="work-field"><span>ID perusahaan</span><input name="id" required pattern="[a-z0-9-]+" placeholder="contoh: cakrawala" /></label><label class="work-field"><span>Nama perusahaan</span><input name="name" required maxlength="140" /></label><label class="work-field"><span>Inisial</span><input name="initials" required maxlength="4" /></label><label class="work-field"><span>Warna identitas</span><input name="color" type="color" value="#e7efff" /></label></div><label class="work-field"><span>Deskripsi</span><textarea name="desc" rows="2" required></textarea></label><button class="btn btn-primary" type="submit">Simpan perusahaan</button></form></section>
  </section>`;
}

export function adminSimulationPayload(form, formData) {
  const parseJson = (value, label) => {
    try { return JSON.parse(value); } catch { throw new Error(`${label} harus berupa JSON yang valid.`); }
  };
  const id = String(formData.get("id") || "").trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error("ID hanya boleh berisi huruf kecil, angka, dan tanda hubung.");
  const definition = parseJson(String(formData.get("definition") || ""), "Definisi simulasi");
  const tasks = parseJson(String(formData.get("tasks") || ""), "Daftar tugas");
  if (!definition || Array.isArray(definition) || typeof definition !== "object") throw new Error("Definisi simulasi harus berupa object JSON.");
  if (!Array.isArray(tasks) || tasks.length === 0) throw new Error("Simulasi harus memiliki setidaknya satu tugas.");
  const taskIds = new Set();
  tasks.forEach((task, index) => {
    if (!task || typeof task !== "object" || Array.isArray(task)) throw new Error(`Tugas ${index + 1} harus berupa object.`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(task.id || "") || taskIds.has(task.id)) throw new Error(`ID tugas ke-${index + 1} tidak valid atau duplikat.`);
    taskIds.add(task.id);
    if (Number(task.sequence) !== index + 1) throw new Error("Sequence tugas harus berurutan mulai dari 1.");
    if (!task.title?.trim() || !task.definition || typeof task.definition !== "object" || Array.isArray(task.definition)) throw new Error(`Judul atau definisi tugas ke-${index + 1} tidak valid.`);
  });
  const price = Number(formData.get("price_idr"));
  if (!Number.isSafeInteger(price) || price < 0) throw new Error("Harga harus berupa bilangan rupiah bulat dan tidak negatif.");
  return {
    simulation: { id, company_id: formData.get("company_id"), role_name: String(formData.get("role_name") || "").trim(),
      title: String(formData.get("title") || "").trim(), price_idr: price, status: formData.get("status"), definition },
    tasks: tasks.map((task) => ({ id: task.id, sequence: Number(task.sequence), title: task.title.trim(), definition: task.definition })),
  };
}
