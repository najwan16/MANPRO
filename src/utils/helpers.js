import { getOptionLabel } from "../data/systemAnalyst.js";

export const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );

export const dated = (str) =>
  new Date(str).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const initials = (name) =>
  String(name || "P")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

export const displayName = (user) => user?.nickname || user?.name || "Peserta";

export const avatarTone = (user) =>
  ["navy", "teal", "purple"].includes(user?.avatarColor)
    ? user.avatarColor
    : "navy";

export const fieldName = (f, v) =>
  f.type === "file"
    ? (typeof v === "string" ? v : v?.name || "Belum diunggah")
    : f.type === "textarea"
    ? String(v || "").trim() || "Belum diisi"
    : f.type === "multi"
      ? (v || []).map((x) => getOptionLabel(f, x)).join("; ") || "Belum diisi"
      : getOptionLabel(f, v);

export const sectionTitle = (eyebrow, title, subtitle = "") =>
  `<div class="section-heading"><div class="eyebrow">${eyebrow}</div><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ""}</div>`;

export function readForm(form, config) {
  const obj = {};
  for (const field of config.fields) {
    if (field.type === "multi") {
      obj[field.id] = [
        ...form.querySelectorAll(`input[name="${field.id}"]:checked`),
      ].map((i) => i.value);
    } else if (field.type === "file") {
      const input = form.elements[field.id];
      const file = input?.files?.[0];
      if (file) {
        const maxMB = Number(field.maxFileSizeMB) || 10;
        if (file.size > maxMB * 1024 * 1024) throw new Error(`Ukuran file maksimal ${maxMB} MB.`);
        obj[field.id] = { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified };
        input.dataset.existingFile = JSON.stringify(obj[field.id]);
      } else {
        try { obj[field.id] = JSON.parse(input?.dataset.existingFile || "null") || ""; } catch { obj[field.id] = ""; }
      }
    } else {
      obj[field.id] = form.elements[field.id]?.value || "";
    }
  }
  return obj;
}
