import test from "node:test";
import assert from "node:assert/strict";
import { mockApi as api } from "../src/services/mockAdapter.js";
import { simulations, getSimulationTasks, getSimulation, hydrateCatalog } from "../src/data/catalog.js";
import { HomePage, productCard } from "../src/pages/home.js";
import { DetailPage } from "../src/pages/detail.js";
import { WorkspacePage } from "../src/pages/workspace.js";
import { ProgressPage } from "../src/pages/progress.js";
import { ReportPage } from "../src/pages/report.js";

class LocalStorageStub {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

globalThis.localStorage = new LocalStorageStub();

const validAnswers = (task) => Object.fromEntries(task.fields.map((field) => {
  if (Object.hasOwn(task.expected || {}, field.id)) return [field.id, structuredClone(task.expected[field.id])];
  if (field.type === "textarea") return [field.id, "I would validate this recommendation against the stated business goal and user evidence."];
  if (field.type === "multi") return [field.id, field.options.slice(0, field.minSelections || 1).map(([value]) => value)];
  return [field.id, field.options.find(([value]) => value)?.[0] || "valid"];
}));

test("landing, catalog cards, and details render for every available role", () => {
  api.reset();
  assert.match(HomePage(), /Kenali pekerjaan/);
  for (const simulation of simulations) {
    const card = productCard(simulation);
    assert.match(card, new RegExp(simulation.role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(card, /Tersedia/);
    const detail = DetailPage(simulation.id);
    assert.match(detail, new RegExp(simulation.role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(detail, /Aktifkan Akses/);
    assert.equal((detail.match(/class="syllabus-item simulation-task-item"/g) || []).length, 3);
  }
  api.reset();
});

test("workspace, report, and progress use the same three task stages for every simulation", () => {
  api.reset();
  api.login("Peserta Uji", "peserta.uji@example.com");

  for (const simulation of simulations) {
    const taskList = getSimulationTasks(simulation);
    assert.equal(taskList.length, 3, `${simulation.id} should have three canonical tasks`);
    api.checkout(simulation.id, "qris");
    const attempt = api.startAttempt(simulation.id);
    const workspace = WorkspacePage(taskList[0].id);
    assert.match(workspace, /workspace-shell/);
    assert.match(workspace, /Tugas 1 dari 3/);

    for (const task of taskList) {
      api.saveDraft(task.id, validAnswers(task));
      api.submitTask(task.id);
    }

    const progress = ProgressPage();
    assert.match(progress, new RegExp(`${simulation.role}[\\s\\S]*?3 dari 3 tugas dikirim`));
    assert.match(progress, /100%/);
    assert.match(progress, /score-pill/);
    assert.doesNotMatch(progress, /NaN/);

    const report = ReportPage(attempt.id);
    assert.match(report, /3 dari 3 tugas dikirim/);
    assert.doesNotMatch(report, /0 dari 0|NaN/);
  }

  api.reset();
});

test("catalog access state changes from available to active after demo checkout", () => {
  api.reset();
  api.login("Peserta Uji", "peserta.uji@example.com");
  const simulation = simulations.find((item) => item.id === "uiux-designer");
  assert.match(productCard(simulation), /Tersedia/);
  api.checkout(simulation.id, "qris");
  assert.match(productCard(simulation), /Simulasi Aktif/);
  api.reset();
});

test("a newly created simulation opens its authored task after demo access is activated", () => {
  const task = { id: "new-simulation-task-1", number: 1, title: "Analisis kebutuhan", duration: "20 menit",
    question: "Pilih jawaban yang tepat", deliverable: "Catatan analisis", fields: [{ id: "answer", label: "Jawaban soal", type: "textarea", minlength: 1 }] };
  hydrateCatalog([], [{ id: "new-simulation", company_id: "missing", role_name: ".", title: "Analisis Produk", price_idr: 19000, status: "ready", definition: { projectTasks: [task] } }], []);
  const simulation = getSimulation("new-simulation");
  assert.match(productCard(simulation), /Analisis Produk/);
  api.reset();
  api.login("Peserta Baru", "peserta-baru@example.com");
  api.checkout(simulation.id, "qris");
  api.startAttempt(simulation.id);
  const workspace = WorkspacePage(task.id);
  assert.match(workspace, /Analisis kebutuhan/);
  assert.match(workspace, /Jawaban soal/);
  assert.match(workspace, /task-work-form/);
});
