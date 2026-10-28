import { api, authApi, isSupabase } from "./services/index.js";
import { completion, certificateEligible } from "./assessment/rubricEngine.js";
import { tasks, taskById } from "./data/systemAnalyst.js";
import { getFreeTrial } from "./data/freeTrials.js";
import { getSimulation, getSimulationTasks, getProjectTask, hydrateCatalog } from "./data/catalog.js";
import { downloadText } from "./utils/storage.js";
import { readForm, fieldName, esc } from "./utils/helpers.js";
import { Navbar } from "./components/navbar.js";
import { Footer } from "./components/footer.js";
import { toast, ico } from "./components/ui.js";
import { artifact } from "./components/artifacts.js";

// Halaman Modular
import { HomePage } from "./pages/home.js";
import { DashboardPage } from "./pages/dashboard.js";
import { WorkspacePage } from "./pages/workspace.js";
import { ProfilePage } from "./pages/profile.js";
import { PortfolioPage, formatPortfolio } from "./pages/portfolio.js";
import { ReportPage, formatReport } from "./pages/report.js";
import { CertificatePage, downloadCertificate } from "./pages/certificate.js";
import { InformationPage } from "./pages/information.js";
import { AuthPage } from "./pages/auth.js";
import { ExplorePage, renderCatalogList } from "./pages/explore.js";
import { DetailPage } from "./pages/detail.js";
import { ProgressPage } from "./pages/progress.js";
import { FreePage, FreeResultPage } from "./pages/free.js";
import { CheckoutPage } from "./pages/checkout.js";
import { AdminPage, AdminReviewsPage, adminSimulationPayload, taskEditorHtml, collectTaskEditor } from "./pages/admin.js";

const app = document.getElementById("app");
const catalogFilters = { search: "", category: "all" };
let entitlementRefresh = null;
let adminAccess = false;
let adminCatalog = null;
let adminCatalogLoading = false;
let adminReviews = null;
let adminReviewsLoading = false;
const resolveTaskConfig = (id) => {
  const projectTask = getProjectTask(id);
  if (projectTask) return {
    ...projectTask,
    fields: projectTask.fields || [{ id: "response", label: "Jawaban dan langkah yang kamu rekomendasikan", type: "textarea", minlength: 20 }],
  };
  return taskById(id);
};

const route = () => {
  const raw = location.hash.replace(/^#\/?/, "").split("?")[0];
  if (!raw) return "home";

  // Decode path segments independently so an encoded character in an ID cannot
  // break the router, and normalize links with a trailing slash consistently.
  return raw.split("/").filter(Boolean).map((part) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return part;
    }
  }).join("/");
};

const go = (target) => {
  location.hash = "#/" + target;
  if (route() === target) render(true);
};

const pendingKey = "simagang:v3:pending";
const setPending = (target) => sessionStorage.setItem(pendingKey, target);
const takePending = () => {
  const x = sessionStorage.getItem(pendingKey);
  sessionStorage.removeItem(pendingKey);
  return x || "dashboard";
};
const authErrorMessage = (error) => {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  if (code === "invalid_credentials" || /invalid login credentials|invalid_credentials|wrong password/.test(message)) {
    return "Email atau kata sandi tidak sesuai.";
  }
  if (/email not confirmed|email_not_confirmed/.test(`${code} ${message}`)) {
    return "Email belum diverifikasi. Periksa kotak masuk lalu konfirmasi emailmu.";
  }
  if (/user already registered|email already registered|user_already_exists/.test(`${code} ${message}`)) {
    return "Email ini sudah terdaftar. Silakan masuk.";
  }
  if (/password should be at least|weak_password|password is too weak/.test(`${code} ${message}`)) {
    return "Kata sandi belum memenuhi persyaratan. Gunakan kata sandi yang lebih kuat.";
  }
  if (/fetch failed|failed to fetch|networkerror|network request failed/.test(message)) {
    return "Tidak dapat terhubung ke layanan autentikasi. Periksa koneksi internetmu.";
  }
  return error?.message || "Autentikasi gagal. Periksa kembali data akunmu.";
};
const syncAdminTasks = (form) => {
  let tasks = [];
  try { tasks = JSON.parse(form.elements.tasks.value || "[]"); } catch { tasks = []; }
  const current = collectTaskEditor(form);
  current.forEach((task) => { if (task.sequence - 1 < tasks.length) tasks[task.sequence - 1] = task; });
  form.elements.tasks.value = JSON.stringify(tasks);
  return tasks;
};
const showAdminStage = (form, stage) => {
  form.querySelectorAll("[data-builder-stage]").forEach((panel) => { panel.hidden = panel.dataset.builderStage !== stage; });
  document.querySelectorAll("[data-progress-step]").forEach((step) => step.classList.toggle("is-active", step.dataset.progressStep === stage));
  form.dataset.stage = stage;
};
const renderAdminTask = (form, index, taskData = null) => {
  const tasks = taskData || syncAdminTasks(form);
  const current = Math.max(0, Math.min(index, tasks.length - 1));
  form.dataset.currentTask = String(current);
  document.getElementById("admin-task-editor").innerHTML = taskEditorHtml([tasks[current]], current);
  const deliverableInput = document.querySelector('#admin-task-editor [data-task-field="deliverable"]');
  if (deliverableInput?.type === "hidden") {
    const deliverable = deliverableInput.value || "Hasil pekerjaan";
    deliverableInput.outerHTML = `<label class="work-field"><span>Hasil yang harus dikumpulkan *</span><input data-task-field="deliverable" required maxlength="180" value="${esc(deliverable)}" placeholder="Contoh: Laporan analisis kebutuhan"/></label>`;
  }
  form.querySelectorAll('[data-question-field="maxFileSizeMB"]').forEach((input) => { input.max = "50"; });
  const questionCards = [...form.querySelectorAll("[data-question-card]")];
  questionCards.forEach((question) => {
    const type = question.querySelector('[data-question-field="type"]')?.value;
    const rubric = question.querySelector("[data-question-rubric]");
    const correct = question.querySelector("[data-question-correct]");
    const manualReview = question.querySelector('[data-question-field="manualReview"]');
    const showRubric = ["essay", "code", "file"].includes(type) || Boolean(manualReview?.checked);
    if (rubric) {
      rubric.hidden = !showRubric;
      const rubricInput = rubric.querySelector("textarea");
      if (rubricInput) rubricInput.required = showRubric;
    }
    if (correct) correct.hidden = type !== "short_answer";
  });
  if (questionCards.length) {
    const totalHundredths = 10000;
    const base = Math.floor(totalHundredths / questionCards.length);
    const remainder = totalHundredths % questionCards.length;
    questionCards.forEach((question, i) => {
      const weight = question.querySelector('[data-question-field="weight"]');
      const value = (base + (i < remainder ? 1 : 0)) / 100;
      if (weight) weight.value = Number.isInteger(value) ? String(value) : value.toFixed(2);
    });
    syncAdminTasks(form);
  }
  const progress = document.getElementById("admin-task-progress");
  if (progress) progress.innerHTML = tasks.map((task, i) => `<button type="button" class="admin-task-progress-item ${i === current ? "is-active" : i < current ? "is-done" : ""}" data-act="admin-jump-task" data-task-index="${i}"><span>${String(i + 1).padStart(2, "0")}</span><b>${task.title || `Task ${i + 1}`}</b></button>`).join("");
  const previous = form.querySelector('[data-act="admin-prev-task"]');
  const next = form.querySelector('[data-act="admin-next-task"]');
  const finish = form.querySelector('[data-act="admin-finish-tasks"]');
  previous.disabled = current === 0;
  next.hidden = current === tasks.length - 1;
  finish.hidden = current !== tasks.length - 1;
  next.textContent = `Lanjut ke Task ${current + 2}`;
};
const slugAdminValue = (value) => String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "simulasi-baru";
const ensureAdminMetadataFields = () => {
  const fields = document.querySelector('#admin-simulation-form [data-builder-stage="info"] .admin-fields');
  if (!fields || fields.dataset.completeMetadata === "true") return;
  fields.dataset.completeMetadata = "true";
  fields.insertAdjacentHTML("beforeend", `
    <label class="work-field"><span>Level *</span><select name="level" required><option value="Pemula">Pemula</option><option value="Menengah">Menengah</option><option value="Lanjutan">Lanjutan</option></select></label>
    <label class="work-field"><span>Estimasi durasi total *</span><input name="duration" required maxlength="80" placeholder="Contoh: 90–120 menit" /></label>
    <label class="work-field"><span>Kalimat singkat untuk kartu eksplorasi *</span><textarea name="teaser" rows="2" maxlength="220" required placeholder="Ringkas manfaat dan pekerjaan yang akan dilakukan peserta."></textarea></label>
    <label class="work-field"><span>Ikon kartu eksplorasi *</span><select name="icon" required>${["workflow", "chart", "pen", "megaphone", "file", "code", "target", "briefcase"].map((icon) => `<option value="${icon}">${icon}</option>`).join("")}</select></label>
    <label class="work-field"><span>Tentang simulasi *</span><textarea name="about" rows="3" required placeholder="Jelaskan tujuan, fokus, dan pengalaman belajar."></textarea></label>
    <label class="work-field"><span>Nama studi kasus *</span><input name="caseName" required maxlength="160" placeholder="Contoh: Platform Pemesanan Konsultasi" /></label>
    <label class="work-field"><span>Masalah / konteks kasus *</span><textarea name="caseProblem" rows="3" required placeholder="Jelaskan masalah yang harus diselesaikan peserta."></textarea></label>
    <label class="work-field"><span>Deliverable utama simulasi *</span><input name="deliverable" required maxlength="180" placeholder="Contoh: User journey dan rencana usability test" /></label>
    <label class="work-field"><span>Tools (satu per baris)</span><textarea name="tools" rows="2" placeholder="Contoh: Figma (opsional)"></textarea></label>
    <label class="work-field"><span>Status publikasi *</span><select name="status" required><option value="draft">Draft (tidak tampil ke peserta)</option><option value="soon">Segera hadir</option><option value="ready">Tersedia di eksplorasi</option></select></label>
    <label class="work-field admin-manual-review-toggle"><input type="checkbox" name="freeTrialEnabled"/> Sediakan uji coba gratis untuk simulasi ini</label>
    <label class="work-field"><span>Inisial perusahaan *</span><input name="company_initials" required maxlength="4" placeholder="Contoh: ND" /></label>
    <label class="work-field"><span>Warna perusahaan *</span><input name="company_color" type="color" value="#e7efff" required /></label>
    <label class="work-field"><span>Deskripsi perusahaan *</span><textarea name="company_desc" rows="2" required placeholder="Ringkasan perusahaan yang tampil di halaman detail."></textarea></label>
  `);
};
const ensureAdminCompany = async (form) => {
  const name = String(form.elements.company_name.value || "").trim();
  let company = (adminCatalog?.companies || []).find((item) => item.name.toLowerCase() === name.toLowerCase());
  const definition = {
    initials: String(form.elements.company_initials.value || name.split(/\s+/).map((word) => word[0]).join("").slice(0, 4)).trim().toUpperCase(),
    color: form.elements.company_color.value || "#e7efff",
    desc: String(form.elements.company_desc.value || "").trim(),
  };
  if (!company || JSON.stringify(company.definition) !== JSON.stringify(definition)) {
    const baseId = slugAdminValue(name);
    let id = baseId, suffix = 2;
    if (company) id = company.id;
    else while ((adminCatalog?.companies || []).some((item) => item.id === id)) id = `${baseId}-${suffix++}`;
    company = { id, name, definition };
    await authApi.saveAdminCompany(company);
    adminCatalog = await authApi.getAdminCatalog();
  }
  form.elements.company_id.value = company.id;
};

function frame(content, active = "home", options = {}) {
  const s = { ...api.state(), isAdmin: adminAccess };
  return `<a class="skip-link" href="#page-content">Lewati ke konten utama</a>${Navbar(active, s)}<main id="page-content" class="${options.full ? "main-full" : "main-content"}">${content}</main>${Footer(s)}<div id="toast" role="status" aria-live="polite"></div>`;
}

function render(scroll = false) {
  const value = route();
  const [name, id, subId] = value.split("/");
  if (["free", "free-result"].includes(name)) {
    const trialSimulationId = name === "free" && id === "start" ? subId || "system-analyst" : id || "system-analyst";
    const trialSimulation = getSimulation(trialSimulationId);
    if (!trialSimulation || trialSimulation.freeTrialEnabled === false || !getFreeTrial(trialSimulationId)) {
      toast("Uji coba gratis tidak diaktifkan atau belum memiliki soal yang dapat dinilai otomatis.");
      go(`detail/${trialSimulationId}`);
      return;
    }
  }
  if (isSupabase && ["detail", "explore", "dashboard", "progress"].includes(name) && api.state().user && !entitlementRefresh) {
    entitlementRefresh = api.refreshEntitlements()
      .then((changed) => { if (changed && route() === value) render(); })
      .catch((error) => window.dispatchEvent(new CustomEvent("supabase-sync-error", { detail: error })))
      .finally(() => { entitlementRefresh = null; });
  }
  const s = api.state();
  const signedDashboard = name === "dashboard" && !!s.user;
  const protectedRoutes = ["checkout", "welcome", "workspace", "report", "portfolio", "certificate", "profile", "restart", "admin", "admin-reviews"];

  if (name === "free" && id === "start") {
    const simulationId = subId || "system-analyst";
    api.restartFree(simulationId);
    go(`free/${simulationId}`);
    return;
  }

  if (protectedRoutes.includes(name) && !s.user) {
    setPending(value);
    go("auth");
    return;
  }
  if (["admin", "admin-reviews"].includes(name) && s.user && !adminAccess) {
    go("dashboard");
    toast(isSupabase ? "Akun ini belum memiliki akses admin." : "Ruang admin hanya tersedia melalui autentikasi Supabase.");
    return;
  }
  if (name === "checkout" && s.user && api.hasAccess(id || "system-analyst")) {
    const simulation = getSimulation(id || "system-analyst");
    const active = api.getActive(simulation?.id) || api.startAttempt(simulation?.id || "system-analyst");
    const taskList = getSimulationTasks(simulation);
    const nextTask = taskList.find((task) => !active.tasks?.[task.id]?.final);
    go(nextTask ? `workspace/${nextTask.id}` : simulation?.id === "system-analyst" ? `report/${active.id}` : "progress");
    return;
  }
  if (name === "welcome") {
    if (!s.user) {
      setPending(value);
      go("auth");
      return;
    }
    if (api.hasAccess("system-analyst")) {
      const attempt = api.getActive() || api.startAttempt();
      const nextTask = tasks.find((task) => !attempt.tasks?.[task.id]?.final);
      go(nextTask ? `workspace/${nextTask.id}` : `report/${attempt.id}`);
    } else {
      go("detail/system-analyst");
    }
    return;
  }
  if (name === "restart") {
    if (!window.confirm("Mengulangi simulasi akan menghapus progress dan submission simulasi ini. Apakah kamu yakin?")) {
      go(`detail/${id}`);
      return;
    }
    try {
      const attempt = api.restartAttempt(id);
      const simulation = getSimulation(id);
      const firstTask = getSimulationTasks(simulation)[0] || null;
      if (!firstTask) throw new Error("Tugas pertama simulasi tidak ditemukan.");
      go(`workspace/${firstTask.id}`);
    } catch (error) {
      toast(error.message || "Simulasi tidak dapat dimulai ulang.");
      go(`detail/${id}`);
    }
    return;
  }

  let view;
  switch (name) {
    case "home":
      view = HomePage();
      break;
    case "dashboard":
      view = signedDashboard ? DashboardPage() : HomePage();
      break;
    case "explore":
      view = ExplorePage(catalogFilters);
      break;
    case "detail":
      view = DetailPage(id);
      break;
    case "checkout":
      view = CheckoutPage(id);
      break;
    case "progress":
      view = ProgressPage();
      break;
    case "free":
      view = FreePage(id || "system-analyst");
      break;
    case "free-result":
      view = FreeResultPage(id || "system-analyst");
      break;
    case "workspace":
      view = WorkspacePage(id);
      break;
    case "profile":
      view = ProfilePage();
      break;
    case "auth":
      view = AuthPage("login");
      break;
    case "register":
      view = AuthPage("register");
      break;
    case "report":
      view = ReportPage(id);
      break;
    case "portfolio":
      view = PortfolioPage(id);
      break;
    case "certificate":
      view = CertificatePage(id);
      break;
    case "admin":
      view = AdminPage(adminCatalog ? { ...adminCatalog, demo: !isSupabase } : null);
      if (!adminCatalog && !adminCatalogLoading) {
        adminCatalogLoading = true;
        authApi.getAdminCatalog().then((data) => {
          adminCatalog = data;
          if (route().split("/")[0] === "admin") render();
        }).catch((error) => {
          console.error("Admin catalog load failed:", error);
          toast(error.message || "Katalog admin gagal dimuat.");
        }).finally(() => { adminCatalogLoading = false; });
      }
      break;
    case "admin-reviews":
      view = AdminReviewsPage(adminReviews);
      if (!adminReviews && !adminReviewsLoading) {
        adminReviewsLoading = true;
        authApi.getAdminSubmissionReviews().then((data) => {
          adminReviews = data;
          if (route().split("/")[0] === "admin-reviews") render();
        }).catch((error) => {
          console.error("Manual review queue failed:", error);
          adminReviews = [];
          if (route().split("/")[0] === "admin-reviews") render();
          toast(error.message || "Daftar pengumpulan file gagal dimuat.");
        }).finally(() => { adminReviewsLoading = false; });
      }
      break;
    case "about":
    case "help":
    case "privacy":
      view = InformationPage(name);
      break;
    default:
      view = `<section class="container page-pad empty-state"><h1>Halaman tidak ditemukan</h1></section>`;
  }

  app.innerHTML = frame(view, ["explore", "detail"].includes(name) ? "explore" : name, {
    full: !signedDashboard && ["home", "dashboard", "auth", "register", "free", "workspace"].includes(name),
  });

  if (name === "admin") ensureAdminMetadataFields();

  if (name === "explore") renderCatalogList(catalogFilters);

  if (scroll) window.scrollTo({ top: 0, behavior: "instant" });
}

let currentHashRoute = route();
window.addEventListener("hashchange", () => {
  const nextRoute = route();
  const [currentPage] = currentHashRoute.split("/");
  if (currentPage === "workspace" && nextRoute !== currentHashRoute) {
    const clock = document.getElementById("task-countdown");
    if (clock) {
      const shouldLeave = window.confirm("Yakin ingin keluar dari tugas ini? Timer akan dijeda dan dilanjutkan lagi saat kamu membuka tugas ini kembali.");
      if (!shouldLeave) {
        location.hash = `#/${currentHashRoute}`;
        return;
      }
      api.pauseTaskTimer(clock.dataset.attempt, clock.dataset.task);
    }
  }
  currentHashRoute = nextRoute;
  render(true);
});

// Realtime Input & Draf
document.addEventListener("input", (e) => {
  if (e.target.matches('#admin-simulation-form [name="title"]')) {
    const form = e.target.form;
    if (form.dataset.isNew === "true") {
      const baseId = slugAdminValue(e.target.value);
      let id = baseId, suffix = 2;
      while ((adminCatalog?.simulations || []).some((item) => item.id === id)) id = `${baseId}-${suffix++}`;
      form.elements.id.value = id;
    }
  }
  if (e.target.closest("#admin-task-editor")) {
    const card = e.target.closest("[data-task-card]");
    if (card && (e.target.matches("[data-duration-range]") || e.target.matches("[data-duration-manual]"))) {
      const range = card.querySelector("[data-duration-range]");
      const manual = card.querySelector("[data-duration-manual]");
      if (e.target.matches("[data-duration-range]")) manual.value = range.value;
      else if (manual.value) range.value = String(Math.max(Number(range.min), Math.min(Number(range.max), Number(manual.value))));
      const display = card.querySelector("[data-duration-display]");
      if (display) display.textContent = `${manual.value || 0} menit`;
    }
    const form = document.getElementById("admin-simulation-form");
    if (form) syncAdminTasks(form);
  }
  if (e.target.id === "catalog-search") {
    catalogFilters.search = e.target.value;
    renderCatalogList(catalogFilters);
  }
  if (e.target.matches("[data-answer]") && e.target.closest("#task-work-form")) {
    const taskId = e.target.closest("form").dataset.task;
    const config = resolveTaskConfig(taskId);
    const form = e.target.closest("form");
    const answers = readForm(form, config);
    try {
      api.saveDraft(taskId, answers);
      const liveElem = document.getElementById("live-artifact");
      if (liveElem) liveElem.innerHTML = artifact(config, answers);
      const status = document.getElementById("autosave");
      if (status) status.innerHTML = `Draf disimpan`;
    } catch (err) {
      toast(err.message);
    }
  }
  if (e.target.matches("[data-answer]") && e.target.closest("#free-task-form")) {
    try {
      const form = e.target.closest("form");
      const simulationId = form.dataset.simulation || "system-analyst";
      api.saveFreeDraft(simulationId, readForm(form, getFreeTrial(simulationId).task));
    } catch (error) {
      toast(error.message);
    }
  }
});

document.addEventListener("change", (e) => {
  if (e.target.matches('[data-question-field="type"]')) {
    const form = document.getElementById("admin-simulation-form");
    if (form) {
      const card = e.target.closest("[data-question-card]");
      const tasks = syncAdminTasks(form);
      const taskIndex = Number(card.dataset.taskIndex);
      const questionIndex = Number(card.dataset.questionIndex);
      const question = tasks[taskIndex].definition.questions[questionIndex];
      question.type = e.target.value;
      if (["essay", "code", "file"].includes(question.type)) question.manualReview = true;
      if (["multiple_choice", "multiple_select"].includes(question.type) && !question.options) {
        const template = question.type === "multiple_select" ? "multiple_select" : "multiple_choice";
        Object.assign(question, { options: "Pilihan A\nPilihan B\nPilihan C", correct: template === "multiple_select" ? "Pilihan A, Pilihan B" : "Pilihan A" });
      }
      form.elements.tasks.value = JSON.stringify(tasks);
      renderAdminTask(form, taskIndex, tasks);
    }
  }
  if (e.target.matches('[data-question-field="manualReview"]')) {
    const form = document.getElementById("admin-simulation-form");
    if (form) {
      const card = e.target.closest("[data-question-card]");
      const taskIndex = Number(card.dataset.taskIndex);
      const tasks = syncAdminTasks(form);
      form.elements.tasks.value = JSON.stringify(tasks);
      renderAdminTask(form, taskIndex, tasks);
    }
  }
  if (e.target.matches('[data-act="admin-task-count"]')) {
    const form = document.getElementById("admin-simulation-form");
    if (form) {
      const tasks = syncAdminTasks(form);
      const count = Number(e.target.value);
      while (tasks.length < count) tasks.push({ id: `task-${tasks.length + 1}`, sequence: tasks.length + 1, title: `Task ${tasks.length + 1}`, definition: { duration: "30 menit", question: "", deliverable: "Hasil pekerjaan", questions: [] } });
      tasks.length = count;
      tasks.forEach((task, index) => { task.id = `task-${index + 1}`; task.sequence = index + 1; });
      form.elements.tasks.value = JSON.stringify(tasks);
      document.querySelectorAll('[data-act="admin-task-count-choice"]').forEach((button) => button.classList.toggle("is-selected", Number(button.dataset.count) === count));
      renderAdminTask(form, Math.min(Number(form.dataset.currentTask || 0), count - 1), tasks);
    }
  }
  if (e.target.id === "catalog-category") {
    catalogFilters.category = e.target.value;
    renderCatalogList(catalogFilters);
  }
  if (e.target.matches('input[type="checkbox"][data-max-selections]') && e.target.checked) {
    const maximum = Number(e.target.dataset.maxSelections);
    const group = e.target.closest("fieldset");
    if (maximum && group.querySelectorAll('input[type="checkbox"]:checked').length > maximum) {
      e.target.checked = false;
      toast(`Pilih maksimal ${maximum} jawaban.`);
    }
  }
});

// Submit Form Handler
document.addEventListener("submit", async (e) => {
  if (e.target.id === "checkout-form") {
    e.preventDefault();
    try {
      const form = e.target;
      const simulation = getSimulation(form.dataset.simulation);
      const firstTask = getSimulationTasks(simulation)[0];
      if (!firstTask) throw new Error("Soal simulasi belum tersedia. Admin perlu memeriksa dan menyimpan task terlebih dahulu.");
      api.checkout(form.dataset.simulation, String(new FormData(form).get("method")));
      api.startAttempt(simulation.id);
      await api.flushState();
      location.hash = `#/workspace/${encodeURIComponent(firstTask.id)}`;
    } catch (error) {
      toast(error.message || "Akses simulasi gagal diaktifkan.");
    }
    return;
  }

  if (e.target.id === "free-task-form") {
    e.preventDefault();
    try {
      const simulationId = e.target.dataset.simulation || "system-analyst";
      const answers = readForm(e.target, getFreeTrial(simulationId).task);
      api.saveFreeDraft(simulationId, answers);
      api.submitFree(simulationId, answers);
      await api.flushState();
      location.hash = `#/free-result/${simulationId}`;
    } catch (error) {
      toast(error.message || "Tugas gratis gagal dikirim.");
    }
    return;
  }

  if (["auth-form", "register-form"].includes(e.target.id)) {
    e.preventDefault();
    const form = e.target;
    const values = new FormData(form);
    try {
      if (!isSupabase) throw new Error("Autentikasi belum terhubung. Atur konfigurasi Supabase lalu mulai ulang server aplikasi.");
      if (form.id === "register-form") {
        const name = String(values.get("name") || "");
        const email = String(values.get("email") || "");
        const { user, session } = await authApi.signUp({ name, email, password: String(values.get("password") || "") });
        if (!session) {
          toast("Akun berhasil dibuat. Verifikasi emailmu, lalu masuk.");
          location.hash = "#/auth";
          return;
        }
        await api.connectUser(user);
        adminAccess = await authApi.isCurrentUserAdmin();
      } else {
        const email = String(values.get("email") || "");
        const { user } = await authApi.signIn({ email, password: String(values.get("password") || "") });
        await api.connectUser(user);
        adminAccess = await authApi.isCurrentUserAdmin();
      }
      location.hash = "#/" + takePending();
    } catch (error) {
      toast(authErrorMessage(error));
    }
    return;
  }

  if (e.target.id === "profile-form") {
    e.preventDefault();
    const values = new FormData(e.target);
    try {
      api.updateProfile({
        name: values.get("name"),
        email: values.get("email"),
        nickname: values.get("nickname"),
        city: values.get("city"),
        institution: values.get("institution"),
        major: values.get("major"),
        educationLevel: values.get("educationLevel"),
        interest: values.get("interest"),
        bio: values.get("bio"),
        avatarColor: values.get("avatarColor"),
      });
      await api.flushState();
      render(false);
      toast("Profil berhasil diperbarui.");
    } catch (error) {
      toast(error.message);
    }
    return;
  }

  if (e.target.id === "task-work-form") {
    e.preventDefault();
    const form = e.target;
    try {
      const id = form.dataset.task;
      const cfg = resolveTaskConfig(id);
      const answers = readForm(form, cfg);

      const fileFields = (cfg.fields || []).filter((field) => field.type === "file");
      if (fileFields.length) {
        if (!isSupabase) throw new Error("Pengumpulan file memerlukan koneksi Supabase.");
        const attempt = api.getActive(cfg.simulationId || "system-analyst");
        if (!attempt) throw new Error("Percobaan simulasi tidak ditemukan. Muat ulang halaman lalu coba lagi.");
        for (const field of fileFields) {
          const file = form.elements[field.id]?.files?.[0];
          if (file) {
            const maxMB = Number(field.maxFileSizeMB) || 10;
            if (file.size > maxMB * 1024 * 1024) throw new Error(`Ukuran file maksimal ${maxMB} MB.`);
            answers[field.id] = await authApi.uploadSubmissionFile(file, attempt.id, id, field.id);
          } else if (!answers[field.id]?.storagePath) {
            throw new Error(`Pilih file untuk bagian "${field.label}" sebelum mengirim.`);
          }
        }
      }

      api.saveDraft(id, answers);
      const data = api.submitTask(id);

      await api.flushState();
      const attempt = api.getActive(cfg.simulationId || "system-analyst");
      const taskList = getSimulationTasks(getSimulation(attempt?.simulationId || cfg.simulationId || "system-analyst"));
      if (attempt && completion(taskList, attempt)) {
        location.hash = `#/report/${encodeURIComponent(attempt.id)}`;
        toast(certificateEligible(taskList, attempt)
          ? "Simulasi selesai! Portofolio dan sertifikatmu sudah tersedia."
          : "Simulasi selesai! Portofolio dan laporanmu sudah tersedia.");
      } else {
        render(false);
        toast(isSupabase ? "Tugas dinilai dan tersimpan di Supabase." : "Tugas dinilai dan tersimpan di perangkat ini.");
      }
    } catch (err) {
      toast(err.message);
    }
  }
});

// Click Action Handler
document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-act]");
  if (!t) return;
  const action = t.dataset.act;

  switch (action) {
    case "reset-filter":
      catalogFilters.search = "";
      catalogFilters.category = "all";
      render(false);
      break;
    case "logout":
      try {
        if (isSupabase) await authApi.signOut();
      } catch (error) {
        toast(error.message || "Gagal keluar dari akun.");
        break;
      }
      await api.disconnectUser();
      adminAccess = false;
      adminCatalog = null;
      go("dashboard");
      break;
    case "toggle-menu": {
      const el = document.getElementById("mobile-nav");
      if (el) el.hidden = !el.hidden;
      break;
    }
    case "download-current": {
      const config = taskById(t.dataset.task);
      const a = api.getActive();
      const answers = a?.tasks?.[config.id]?.draft || {};
      const content =
        `# ${config.deliverable} — DRAF SIMAGANG\n\n` +
        config.fields
          .map((f) => `- ${f.label}\n  ${fieldName(f, answers[f.id])}`)
          .join("\n") +
        "\n\nDokumen latihan dari Simulasi System Analyst.\n";
      downloadText(`SiMagang-${config.id}-Draft.md`, content, "text/markdown;charset=utf-8");
      toast("Draf artefak diunduh.");
      break;
    }
    case "download-report":
      downloadText("SiMagang-Report.md", formatReport(route().split("/")[1]), "text/markdown;charset=utf-8");
      toast("Laporan diunduh.");
      break;
    case "download-portfolio":
      downloadText("SiMagang-Portfolio.md", formatPortfolio(route().split("/")[1]), "text/markdown;charset=utf-8");
      toast("Portofolio diunduh.");
      break;
    case "download-certificate":
      downloadCertificate(route().split("/")[1]);
      toast("Sertifikat SVG diunduh.");
      break;
    case "print":
      window.print();
      break;
    case "admin-save-company": {
      const form = document.getElementById("admin-company-form");
      if (!form?.reportValidity()) break;
      try {
        const values = new FormData(form);
        await authApi.saveAdminCompany({ id: String(values.get("id")).trim(), name: String(values.get("name")).trim(), definition: {
          initials: String(values.get("initials")).trim().toUpperCase(), color: values.get("color"), desc: String(values.get("desc")).trim(),
        } });
        adminCatalog = await authApi.getAdminCatalog();
        render();
        toast(isSupabase ? "Perusahaan berhasil disimpan." : "Perusahaan tersimpan di browser demo.");
      } catch (error) { toast(error.message || "Perusahaan gagal disimpan."); }
      break;
    }
    case "admin-save-simulation": {
      const form = document.getElementById("admin-simulation-form");
      const selectedPricingTier = form?.querySelector('input[name="pricing_tier"]:checked');
      if (!form || !selectedPricingTier) {
        toast("Pilih paket Standar atau Advanced.");
        break;
      }
      try {
        syncAdminTasks(form);
        await ensureAdminCompany(form);
        const payload = adminSimulationPayload(form, new FormData(form));
        await authApi.saveAdminSimulation(payload.simulation, payload.tasks);
        adminCatalog = await authApi.getAdminCatalog();
        render();
        toast(isSupabase ? "Simulasi dan task berhasil disimpan." : "Simulasi tersimpan lokal; katalog mahasiswa demo tidak berubah.");
      } catch (error) { toast(error.message || "Simulasi gagal disimpan."); }
      break;
    }
    case "admin-new-simulation": {
      const form = document.getElementById("admin-simulation-form");
      if (!form) break;
      form.reset();
      form.querySelectorAll("[data-price-preview]").forEach((preview) => {
        const value = Number(form.elements[preview.dataset.pricePreview].value) || 0;
        preview.textContent = value ? `Rp${new Intl.NumberFormat("id-ID").format(value)}` : "Gratis";
      });
      form.dataset.isNew = "true";
      form.elements.id.readOnly = true;
      form.elements.task_count.value = "";
      const tasks = [{ id: "task-1", sequence: 1, title: "Task 1", definition: { duration: "30 menit", question: "", deliverable: "Hasil pekerjaan", questions: [] } }];
      form.elements.tasks.value = JSON.stringify(tasks);
      form.dataset.currentTask = "0";
      document.querySelectorAll('[data-act="admin-task-count-choice"]').forEach((button) => button.classList.remove("is-selected"));
      renderAdminTask(form, 0);
      showAdminStage(form, "info");
      document.getElementById("admin-editor").hidden = false;
      document.getElementById("admin-editor-title").textContent = "Buat soal baru";
      document.getElementById("admin-editor")?.scrollIntoView({ behavior: "smooth" });
      break;
    }
    case "admin-edit-simulation": {
      const form = document.getElementById("admin-simulation-form");
      if (!form) break;
      try {
        const payload = JSON.parse(t.dataset.payload);
        form.dataset.isNew = "false";
        for (const key of ["id", "role_name", "title"]) form.elements[key].value = payload.simulation[key] ?? "";
        form.elements.company_id.value = payload.simulation.company_id || "";
        form.elements.company_name.value = (adminCatalog?.companies || []).find((company) => company.id === payload.simulation.company_id)?.name || payload.simulation.company_id || "";
        form.elements.id.readOnly = true;
        const definition = payload.simulation.definition || {};
        const company = (adminCatalog?.companies || []).find((item) => item.id === payload.simulation.company_id);
        for (const [key, value] of Object.entries({ category: definition.category, level: definition.level, duration: definition.duration, teaser: definition.teaser, icon: definition.icon, summary: definition.summary, description: definition.description, about: definition.about, caseName: definition.caseName, caseProblem: definition.caseProblem, deliverable: definition.deliverable, status: payload.simulation.status, skills: (definition.skills || []).join(", "), tools: (definition.tools || []).join("\n"), company_initials: company?.definition?.initials, company_color: company?.definition?.color, company_desc: company?.definition?.desc })) {
          if (form.elements[key]) form.elements[key].value = value || "";
        }
        form.elements.freeTrialEnabled.checked = Boolean(definition.freeTrialEnabled);
        form.elements.task_count.value = String(payload.tasks.length);
        const selectedPricingTier = definition.selected_pricing_tier || (Number(payload.simulation.price_idr) === 29000 ? "advanced" : "standard");
        const pricingRadio = form.querySelector(`input[name="pricing_tier"][value="${selectedPricingTier}"]`);
        if (pricingRadio) pricingRadio.checked = true;
        form.elements.tasks.value = JSON.stringify(payload.tasks);
        form.dataset.currentTask = "0";
        document.querySelectorAll('[data-act="admin-task-count-choice"]').forEach((button) => button.classList.toggle("is-selected", Number(button.dataset.count) === payload.tasks.length));
        renderAdminTask(form, 0);
        showAdminStage(form, "info");
        document.getElementById("admin-editor").hidden = false;
        document.getElementById("admin-editor-title").textContent = `Edit ${payload.simulation.role_name}`;
        document.getElementById("admin-editor")?.scrollIntoView({ behavior: "smooth" });
      } catch (error) { toast("Data simulasi gagal dibuka."); }
      break;
    }
    case "admin-add-question":
    case "admin-remove-question": {
      const form = document.getElementById("admin-simulation-form");
      if (!form) break;
      const tasks = syncAdminTasks(form);
      const taskIndex = Number(t.dataset.taskIndex ?? t.closest("[data-task-card]")?.dataset.taskIndex);
      const questions = tasks[taskIndex]?.definition?.questions || [];
      if (action === "admin-add-question") {
        const question = { prompt: "", type: t.dataset.questionType || "multiple_choice", options: "Pilihan A\nPilihan B\nPilihan C", correct: "", weight: "100", feedback: "", rubric: "Dinilai dari kelengkapan, ketepatan, dan alasan jawaban.", codeLanguage: "javascript", codeSnippet: "function contoh() {\n  // Tulis atau perbaiki kode di sini\n}", acceptedFiles: ".pdf,.doc,.docx,.zip,.png,.jpg", maxFileSizeMB: 10 };
        if (question.type === "multiple_choice") question.correct = "Pilihan A";
        if (question.type === "multiple_select") question.correct = "Pilihan A, Pilihan B";
        questions.push(question);
      }
      else if (questions.length) questions.splice(Number(t.dataset.questionIndex), 1);
      tasks[taskIndex].definition.questions = questions;
      form.elements.tasks.value = JSON.stringify(tasks);
      renderAdminTask(form, taskIndex, tasks);
      break;
    }
    case "admin-toggle-question-picker": {
      const picker = t.closest("[data-task-card]")?.querySelector("[data-question-picker]");
      if (picker) picker.hidden = !picker.hidden;
      break;
    }
    case "admin-add-option":
    case "admin-remove-option": {
      const form = document.getElementById("admin-simulation-form");
      const card = t.closest("[data-task-card]");
      const taskIndex = Number(card.dataset.taskIndex);
      const tasks = syncAdminTasks(form);
      const questionIndex = Number(t.closest("[data-question-card]").dataset.questionIndex);
      const question = tasks[taskIndex].definition.questions[questionIndex];
      const options = String(question.options || "").split("\n");
      if (action === "admin-add-option") options.push("");
      else if (options.length > 2) {
        const removed = options.splice(Number(t.dataset.optionIndex), 1)[0];
        question.correct = String(question.correct || "").split(",").map((answer) => answer.trim()).filter((answer) => answer !== removed).join(", ");
      }
      question.options = options.join("\n");
      form.elements.tasks.value = JSON.stringify(tasks);
      renderAdminTask(form, taskIndex, tasks);
      break;
    }
    case "admin-close-editor":
      document.getElementById("admin-editor").hidden = true;
      document.getElementById("admin-simulations")?.scrollIntoView({ behavior: "smooth" });
      break;
    case "admin-task-count-choice": {
      const form = document.getElementById("admin-simulation-form");
      form.elements.task_count.value = t.dataset.count;
      form.elements.task_count.dispatchEvent(new Event("change", { bubbles: true }));
      document.querySelectorAll('[data-act="admin-task-count-choice"]').forEach((button) => button.classList.toggle("is-selected", button === t));
      break;
    }
    case "admin-next-count": {
      const form = document.getElementById("admin-simulation-form");
      const invalidField = form.querySelector('[data-builder-stage="info"] :invalid');
      if (invalidField) { invalidField.reportValidity(); break; }
      showAdminStage(form, "count");
      form.querySelector('[data-builder-stage="count"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
      break;
    }
    case "admin-prev-info": {
      const form = document.getElementById("admin-simulation-form");
      showAdminStage(form, "info");
      break;
    }
    case "admin-start-tasks": {
      const form = document.getElementById("admin-simulation-form");
      if (!form.elements.task_count.value) { toast("Pilih jumlah task terlebih dahulu."); break; }
      showAdminStage(form, "tasks"); renderAdminTask(form, 0);
      form.querySelector('[data-builder-stage="tasks"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
      break;
    }
    case "admin-next-task": {
      const form = document.getElementById("admin-simulation-form");
      syncAdminTasks(form);
      const card = form.querySelector("[data-task-card]");
      if (!card?.querySelector("[data-question-card]")) {
        const picker = card?.querySelector("[data-question-picker]");
        if (picker) picker.hidden = false;
        toast("Tambahkan minimal satu soal sebelum lanjut.");
        break;
      }
      const invalidField = card?.querySelector(":invalid");
      if (invalidField) { invalidField.reportValidity(); break; }
      renderAdminTask(form, Number(form.dataset.currentTask || 0) + 1);
      form.querySelector('[data-builder-stage="tasks"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
      break;
    }
    case "admin-finish-tasks": {
      const form = document.getElementById("admin-simulation-form");
      syncAdminTasks(form);
      const card = form.querySelector("[data-task-card]");
      if (!card?.querySelector("[data-question-card]")) {
        const picker = card?.querySelector("[data-question-picker]");
        if (picker) picker.hidden = false;
        toast("Tambahkan minimal satu soal sebelum menentukan harga.");
        break;
      }
      const invalidField = form.querySelector("[data-task-card] :invalid");
      if (invalidField) { invalidField.reportValidity(); break; }
      showAdminStage(form, "price");
      form.querySelector('[data-builder-stage="price"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
      break;
    }
    case "admin-back-to-tasks": {
      const form = document.getElementById("admin-simulation-form");
      renderAdminTask(form, Number(form.dataset.currentTask || 0));
      showAdminStage(form, "tasks");
      form.querySelector('[data-builder-stage="tasks"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
      break;
    }
    case "admin-prev-task": {
      const form = document.getElementById("admin-simulation-form");
      renderAdminTask(form, Number(form.dataset.currentTask || 0) - 1);
      break;
    }
    case "admin-jump-task": {
      const form = document.getElementById("admin-simulation-form");
      renderAdminTask(form, Number(t.dataset.taskIndex));
      break;
    }
    case "admin-preview": {
      const form = document.getElementById("admin-simulation-form");
      const preview = document.querySelector("#admin-preview");
      if (!form || !preview) break;
      const values = new FormData(form);
      preview.hidden = false;
      preview.innerHTML = `<strong>${String(values.get("role_name") || "Posisi").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]))}</strong><p>${String(values.get("summary") || "Ringkasan simulasi akan tampil di sini.").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]))}</p><small>Preview ringkasan statis — renderer mahasiswa belum mendukung preview interaktif Admin.</small>`;
      break;
    }
    case "admin-reset-form":
      document.querySelector('[data-act="admin-new-simulation"]')?.click();
      break;
  }
});

document.addEventListener("submit", async (e) => {
  if (e.target.matches(".admin-review-form")) {
    e.preventDefault();
    const form = e.target;
    if (!form.reportValidity()) return;
    try {
      const values = new FormData(form);
      await authApi.saveManualReview(form.dataset.submissionId, values.get("score"), values.get("feedback"));
      adminReviews = await authApi.getAdminSubmissionReviews();
      render();
      toast("Penilaian manual berhasil disimpan.");
    } catch (error) {
      toast(error.message || "Penilaian gagal disimpan.");
    }
    return;
  }
  if (e.target.id === "admin-company-form") {
    e.preventDefault();
    try {
      const values = new FormData(e.target);
      await authApi.saveAdminCompany({ id: String(values.get("id")).trim(), name: String(values.get("name")).trim(), definition: {
        initials: String(values.get("initials")).trim().toUpperCase(), color: values.get("color"), desc: String(values.get("desc")).trim(),
      } });
      adminCatalog = await authApi.getAdminCatalog();
      render();
      toast(isSupabase ? "Perusahaan disimpan ke Supabase." : "Perusahaan disimpan di penyimpanan demo browser ini.");
    } catch (error) { toast(error.message || "Perusahaan gagal disimpan."); }
    return;
  }
  if (e.target.id === "admin-simulation-form") {
    e.preventDefault();
    try {
      syncAdminTasks(e.target);
      await ensureAdminCompany(e.target);
      const payload = adminSimulationPayload(e.target, new FormData(e.target));
      await authApi.saveAdminSimulation(payload.simulation, payload.tasks);
      adminCatalog = await authApi.getAdminCatalog();
      render();
      toast(isSupabase ? "Simulasi dan tugas disimpan ke Supabase." : "Simulasi disimpan di penyimpanan demo browser ini; katalog mahasiswa tidak berubah.");
    } catch (error) { toast(error.message || "Simulasi gagal disimpan."); }
  }
});

async function bootApp() {
  if (isSupabase) {
    try {
      const catalog = await authApi.getCatalog();
      if (!hydrateCatalog(catalog.companies, catalog.simulations, catalog.tasks)) {
        throw new Error("Katalog Supabase belum berisi simulasi. Jalankan seed katalog terlebih dahulu.");
      }
      const session = await authApi.getSession();
      if (session?.user?.email) {
        await api.connectUser(session.user);
        try { adminAccess = await authApi.isCurrentUserAdmin(); }
        catch (error) { adminAccess = false; console.warn("Admin role lookup failed:", error.message); }
      } else await api.disconnectUser();
    } catch (error) {
      await api.disconnectUser();
      console.error("Supabase bootstrap failed:", error.message);
      toast(`Data Supabase belum termuat: ${error.message}`);
    }
  }
  if (!isSupabase) adminAccess = false;
  render();
}

bootApp();

window.addEventListener("supabase-sync-error", (event) => {
  console.error("Supabase state sync failed:", event.detail?.message || event.detail);
  toast("Perubahan belum tersimpan ke Supabase. Periksa koneksi lalu coba lagi.");
});

window.setInterval(() => {
  document.querySelectorAll(".dynamic-countdown").forEach((clock) => {
    const seconds = Math.max(0, Math.ceil((Number(clock.dataset.expires) - Date.now()) / 1000));
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    const label = seconds === 0 && clock.id === "task-countdown" ? "00:00 · Waktu habis" : `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;

    clock.innerHTML = `${ico("clock")} ${label}`;
    clock.classList.toggle("is-urgent", seconds <= 60);

    if (clock.id === "free-countdown" && seconds === 0 && !clock.dataset.submitted) {
      clock.dataset.submitted = "true";
      const simulationId = clock.dataset.simulation || "system-analyst";
      api.expireFreeTask(simulationId);
      location.hash = `#/free-result/${simulationId}`;
      toast("Waktu habis. Jawaban tersimpan dikirim otomatis untuk dinilai.");
    }
  });
}, 250);
