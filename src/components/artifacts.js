import { esc, fieldName } from "../utils/helpers.js";
import { getOptionLabel } from "../data/systemAnalyst.js";

export function artifact(config, answers = {}) {
  if (config.id === "requirements")
    return `<div class="artifact-doc"><div class="artifact-doc-title">REQUIREMENTS REGISTER <span>#SA-01</span></div><table><thead><tr><th>Kebutuhan stakeholder</th><th>Klasifikasi</th></tr></thead><tbody>${config.fields
      .filter((x) => x.id !== "priority" && x.type !== "textarea")
      .map(
        (f) =>
          `<tr><td>${esc(f.label.replaceAll('"', ""))}</td><td>${esc(fieldName(f, answers[f.id]))}</td></tr>`
      )
      .join("")}</tbody></table><p><b>Prioritas MVP:</b> ${esc(
      fieldName(
        config.fields.find((f) => f.id === "priority"),
        answers.priority
      )
    )}</p><div class="artifact-record"><b>Memo analis (ditulis peserta, tidak dinilai otomatis)</b><p>${esc(answers.analystNote || "Belum ditulis")}</p></div></div>`;

  if (config.id === "userstory") {
    const [actor, action, benefit, criteria] = config.fields;
    return `<div class="artifact-doc"><div class="artifact-doc-title">USER STORY SPECIFICATION <span>#SA-02</span></div><p class="artifact-highlight">Sebagai <b>${esc(fieldName(actor, answers.actor).toLowerCase())}</b>, saya ingin <b>${esc(fieldName(action, answers.action).toLowerCase())}</b>, agar <b>${esc(fieldName(benefit, answers.benefit).toLowerCase())}</b>.</p><b>Acceptance Criteria</b><ol>${(answers.criteria || []).length ? (answers.criteria || []).map((v) => `<li>${esc(getOptionLabel(criteria, v))}</li>`).join("") : "<li>Belum ditentukan</li>"}</ol><div class="artifact-record"><b>Catatan User Story yang ditulis peserta (tidak di-skor otomatis)</b><p>${esc(answers.draftStory || "Belum ditulis")}</p></div></div>`;
  }

  if (config.id === "validation")
    return `<div class="artifact-doc"><div class="artifact-doc-title">REQUIREMENT VALIDATION LOG <span>#SA-03</span></div>${config.fields.map((f) => `<div class="artifact-record"><b>${esc(f.label)}</b><p>${esc(fieldName(f, answers[f.id]))}</p></div>`).join("")}</div>`;

  if (config.fields?.length)
    return `<div class="artifact-doc"><div class="artifact-doc-title">${esc(config.deliverable || "Dokumen tugas")}</div>${config.fields.map((field) => `<div class="artifact-record"><b>${esc(field.label)}</b><p>${esc(fieldName(field, answers[field.id]))}</p></div>`).join("")}</div>`;
  return `<div class="artifact-doc">Belum ada artefak.</div>`;
}
