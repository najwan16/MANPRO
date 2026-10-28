import test from "node:test";
import assert from "node:assert/strict";
import { adminSimulationPayload } from "../src/pages/admin.js";
import { getSimulation, getSimulationTasks, hydrateCatalog } from "../src/data/catalog.js";

function values(overrides = {}) {
  const data = {
    id: "demo-project", company_id: "fictional-co", role_name: "Product Analyst", title: "Discovery project",
    category: "Product", summary: "Ringkasan", description: "Deskripsi", deliverable: "Memo", duration: "90 menit",
    level: "Pemula", teaser: "Latihan produk", icon: "workflow", price_idr: "0", status: "draft", about: "Tentang simulasi", caseName: "Kasus produk", caseProblem: "Masalah pengguna", company_name: "Perusahaan Fiktif", company_desc: "Konteks perusahaan", skills: "Analisis, Riset", tools: "Spreadsheet — referensi",
    task_count: "1",
    pricing_tier: "standard",
    tasks: JSON.stringify([{ id: "task-1", sequence: 1, title: "Analisis awal", definition: { question: "Pilih", fields: [{ id: "answer", label: "Jawaban", type: "textarea" }], expected: { answer: "x" }, weights: { answer: 100 }, feedback: {} } }]),
    ...overrides,
  };
  return { get: (key) => data[key] };
}

test("admin builder produces task definitions compatible with the simulation catalog", () => {
  const result = adminSimulationPayload(null, values());
  assert.equal(result.simulation.status, "draft");
  assert.equal(result.simulation.definition.category, "Product");
  assert.equal(result.simulation.definition.skills.length, 2);
  assert.equal(result.tasks[0].id, "demo-project-task-1");
  assert.equal(result.tasks[0].definition.fields[0].type, "textarea");
  assert.deepEqual(result.tasks[0].definition.expected, { answer: "x" });
});

test("admin builder rejects malformed task JSON and missing required information", () => {
  assert.throws(() => adminSimulationPayload(null, values({ tasks: "{" })), /JSON yang valid/);
  assert.throws(() => adminSimulationPayload(null, values({ category: "" })), /Bidang wajib diisi/);
  assert.throws(() => adminSimulationPayload(null, values({ task_count: "2" })), /Jumlah task tidak sesuai/);
});

test("multiple choice and multiple select map to the student renderer field schema", () => {
  const task = { id: "task-1", sequence: 1, title: "Task 1", definition: {
    question: "Pahami konteks", deliverable: "Catatan", fields: [
      { id: "choice", label: "Pilih satu", type: "select", options: [["", "Pilih"], ["a", "A"], ["b", "B"]] },
      { id: "multi", label: "Pilih dua", type: "multi", options: [["a", "A"], ["b", "B"], ["c", "C"]], minSelections: 1, maxSelections: 2 },
    ], expected: { choice: "a", multi: ["a", "b"] }, weights: { choice: 50, multi: 50 }, feedback: {},
    questions: [{ prompt: "Pilih satu", type: "multiple_choice", options: "A\nB", correct: "A", weight: "50" }, { prompt: "Pilih dua", type: "multiple_select", options: "A\nB\nC", correct: "A, B", weight: "50" }],
  } };
  const result = adminSimulationPayload(null, values({ tasks: JSON.stringify([task]) }));
  assert.equal(result.tasks[0].definition.fields[0].type, "select");
  assert.equal(result.tasks[0].definition.fields[1].type, "multi");
  assert.deepEqual(result.tasks[0].definition.expected.multi, ["a", "b"]);
});

test("file upload questions require an admin rubric and mark the task for manual review", () => {
  const task = { id: "task-1", sequence: 1, title: "Analisis dokumen", definition: {
    question: "Unggah hasil analisis", fields: [{ id: "file", label: "Hasil kerja", type: "file", maxFileSizeMB: 10 }],
    manualReview: true, questions: [{ prompt: "Unggah hasil", type: "file", rubric: "Nilai kelengkapan dan ketepatan analisis.", maxFileSizeMB: 10 }],
  } };
  const result = adminSimulationPayload(null, values({ tasks: JSON.stringify([task]) }));
  assert.equal(result.tasks[0].definition.manualReview, true);
  assert.equal(result.tasks[0].definition.fields[0].type, "file");
  const invalidTask = { ...task, definition: { ...task.definition, questions: [{ prompt: "Unggah hasil", type: "file", rubric: "" }] } };
  assert.throws(() => adminSimulationPayload(null, values({ tasks: JSON.stringify([invalidTask]) })), /panduan pemeriksaan admin wajib diisi/);
});

test("published backend task definitions hydrate into the student question page schema", () => {
  hydrateCatalog(
    [{ id: "qa-company", definition: { name: "QA Company", initials: "QC" } }],
    [{ id: "qa-simulation", company_id: "qa-company", role_name: "QA", title: "QA Simulation", price_idr: 19000, status: "ready", definition: { category: "QA" } }],
    [{ id: "qa-simulation-task-1", simulation_id: "qa-simulation", sequence: 1, title: "Question 1", definition: {
      id: "qa-simulation-task-1", number: 1, title: "Question 1", duration: "20 menit", fields: [
        { id: "answer", label: "Pilih jawaban", type: "select", options: [["", "Pilih"], ["yes", "Ya"]] },
      ], expected: { answer: "yes" }, weights: { answer: 100 }, feedback: { answer: "Benar" },
    } }],
  );

  const tasks = getSimulationTasks(getSimulation("qa-simulation"));
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].fields[0].id, "answer");
  assert.deepEqual(tasks[0].expected, { answer: "yes" });
  assert.deepEqual(tasks[0].weights, { answer: 100 });
});
