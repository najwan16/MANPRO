import { esc } from "../utils/helpers.js";

export const iconPaths = {
  briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 12h18M10 12v2h4v-2"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  "check-circle": '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
  clipboard: '<rect x="5" y="5" width="14" height="16" rx="2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6m-6 4h6"/>',
  code: '<path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-13-2 18"/>',
  chart: '<rect x="3" y="13" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="13" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>',
  workflow: '<rect x="3" y="3" width="7" height="6" rx="1"/><rect x="14" y="15" width="7" height="6" rx="1"/><path d="M6.5 9v8h7.5m0-11h7M17.5 3v6"/>',
  pen: '<path d="m14 5 5 5M3 21l5-.9L20 8a2 2 0 00-3-3L5 17z"/>',
  megaphone: '<path d="M3 10v4l10 4V6L3 10Zm10-3 6-3v16l-6-3M5 14l2 7h4l-2-6"/>',
  award: '<circle cx="12" cy="8" r="5"/><path d="m8 12-2 9 6-3 6 3-2-9"/>',
  file: '<path d="M5 2h9l5 5v15H5zM14 2v6h5M8 13h8M8 17h8"/>',
  refresh: '<path d="M20 7a9 9 0 10 1 8M20 2v5h-5"/>',
  shield: '<path d="M12 2 20 6v6c0 5-4 8-8 10C8 20 4 17 4 12V6z"/><path d="m9 12 2 2 4-4"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 118 0v3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  bolt: '<path d="M13 2 5 13h6l-1 9 9-12h-6z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  spark: '<path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/>',
  play: '<path d="m8 5 11 7-11 7z"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  alert: '<path d="m12 2 10 19H2L12 2zM12 9v5m0 3v.2"/>',
  book: '<path d="M4 4h14a2 2 0 012 2v14H6a2 2 0 01-2-2zM4 6a2 2 0 012-2m1 5h9M7 13h7"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7zM2 12l10 5 10-5M2 17l10 5 10-5"/>',
  logout: '<path d="M9 4H4v16h5m5-12 4 4-4 4m-8-4h12"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.2"/>',
  filter: '<path d="M4 7h16M7 12h10m-7 5h4"/>',
  external: '<path d="M13 4h7v7m0-7-9 9M20 14v6H4V4h6"/>',
};

export const ico = (name, cls = "") =>
  `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.circle}</svg>`;

export const A = (route, label, variant = "primary", attrs = "") =>
  `<a href="#/${route}" class="btn btn-${variant}" ${attrs}>${label}</a>`;

export const pill = (label, type = "soft") =>
  `<span class="pill pill-${type}">${esc(label)}</span>`;

export const art = (type = "workflow") =>
  `<div class="product-art art-${esc(type)}"><div class="art-circle"></div><span class="art-lines"></span>${ico(type, "art-icon")}<span class="art-caption">SIMULASI PEKERJAAN</span></div>`;

export const logo = (company) =>
  `<div class="company-avatar" style="background:${company.color}">${esc(company.initials)}</div>`;

export const scoreTag = (score) =>
  `<span class="score-pill ${score >= 70 ? "score-good" : score >= 40 ? "score-mid" : "score-low"}">${score}/100</span>`;

export function toast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("toast-on");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove("toast-on"), 4200);
}

export function optionInput(f, current) {
  if (f.type === "file") {
    const existing = current && typeof current === "object" ? current : null;
    const maxSize = Number(f.maxFileSizeMB) || 10;
    return `<label class="work-field"><span>${esc(f.label)}</span><input type="file" data-answer="${f.id}" name="${f.id}" accept="${esc(f.accept || ".pdf,.doc,.docx,.zip")}" data-max-file-size-mb="${maxSize}" data-existing-file="${esc(existing ? JSON.stringify(existing) : "")}" ${existing ? "" : "required"}/><small>Format: ${esc(f.accept || ".pdf,.doc,.docx,.zip")} · Maksimal ${maxSize} MB.</small>${existing ? `<small>File sebelumnya: ${esc(existing.name)}. Pilih kembali jika ingin mengganti file.</small>` : ""}</label>`;
  }
  if (f.type === "text") return `<label class="work-field"><span>${esc(f.label)}</span><input type="text" data-answer="${f.id}" name="${f.id}" required minlength="${f.minlength || 1}" maxlength="${f.maxlength || 500}" value="${esc(current || "")}" placeholder="${esc(f.placeholder || "Tulis jawaban singkat...")}" /></label>`;
  if (f.type === "textarea") {
    const codeBlock = f.codeSnippet ? `<div class="answer-code-block"><span>${esc(f.codeLanguage || "Kode")}</span><pre><code>${esc(f.codeSnippet)}</code></pre></div>` : "";
    return `${codeBlock}<label class="work-field"><span>${esc(f.label)} <small style="color:#8b99ac;font-weight:500">· Dicatat pada portofolio, tidak dinilai otomatis</small></span><textarea data-answer="${f.id}" name="${f.id}" rows="4" minlength="${f.minlength || 1}" required placeholder="${esc(f.placeholder || "Tuliskan hasil analisismu...")}">${esc(current || "")}</textarea></label>`;
  }
  if (f.type === "multi") {
    const v = Array.isArray(current) ? current : [];
    return `<fieldset class="work-field" data-max-selections="${f.maxSelections || ""}"><legend>${esc(f.label)}</legend><div class="checkbox-grid">${f.options.map(([val, label]) => `<label class="check-option"><input type="checkbox" data-answer="${f.id}" data-max-selections="${f.maxSelections || ""}" name="${f.id}" value="${esc(val)}" ${v.includes(val) ? "checked" : ""}/><span>${esc(label)}</span></label>`).join("")}</div></fieldset>`;
  }
  return `<label class="work-field"><span>${esc(f.label)}</span><select data-answer="${f.id}" name="${f.id}" required>${f.options.map(([val, label]) => `<option value="${esc(val)}" ${val === (current || "") ? "selected" : ""} ${!val ? "disabled" : ""}>${esc(label)}</option>`).join("")}</select></label>`;
}
export function feedbackList(assessment, showMax = true) {
  return `<div class="feedback-items">${assessment.breakdown.map((b, i) => `<div class="feedback-item ${b.correct ? "feedback-ok" : "feedback-improve"}"><span class="feedback-status">${ico(b.correct ? "check-circle" : "alert")}</span><div><div class="feedback-top"><b>Aspek ${i + 1}</b><span>${b.earned}/${b.max}${showMax ? " poin" : ""}</span></div><p class="feedback-field-label">${esc(b.label)}</p><p>${esc(b.feedback)}</p></div></div>`).join("")}</div>`;
}


