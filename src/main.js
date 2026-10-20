import { api, authApi, isSupabase } from "./services/index.js";
import { tasks, taskById } from "./data/systemAnalyst.js";
import { getFreeTrial } from "./data/freeTrials.js";
import { getSimulation, getSimulationTasks, getProjectTask, hydrateCatalog } from "./data/catalog.js";
import { downloadText } from "./utils/storage.js";
import { readForm, fieldName } from "./utils/helpers.js";
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

const app = document.getElementById("app");
const catalogFilters = { search: "", category: "all" };
let entitlementRefresh = null;
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

function frame(content, active = "home", options = {}) {
  const s = api.state();
  return `<a class="skip-link" href="#page-content">Lewati ke konten utama</a>${Navbar(active, s)}<main id="page-content" class="${options.full ? "main-full" : "main-content"}">${content}</main>${Footer(s)}<div id="toast" role="status" aria-live="polite"></div>`;
}

function render(scroll = false) {
  const value = route();
  const [name, id, subId] = value.split("/");
  if (isSupabase && ["detail", "explore", "dashboard", "progress"].includes(name) && api.state().user && !entitlementRefresh) {
    entitlementRefresh = api.refreshEntitlements()
      .then((changed) => { if (changed && route() === value) render(); })
      .catch((error) => window.dispatchEvent(new CustomEvent("supabase-sync-error", { detail: error })))
      .finally(() => { entitlementRefresh = null; });
  }
  const s = api.state();
  const signedDashboard = name === "dashboard" && !!s.user;
  const protectedRoutes = ["checkout", "welcome", "workspace", "report", "portfolio", "certificate", "profile", "restart"];

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
      api.checkout(form.dataset.simulation, String(new FormData(form).get("method")));
      const simulation = getSimulation(form.dataset.simulation);
      api.startAttempt(simulation.id);
      await api.flushState();
      location.hash = `#/workspace/${getSimulationTasks(simulation)[0]?.id || "requirements"}`;
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

  if (["demo-auth-form", "demo-register-form"].includes(e.target.id)) {
    e.preventDefault();
    const form = e.target;
    const values = new FormData(form);
    try {
      if (form.id === "demo-register-form") {
        const name = String(values.get("name") || "");
        const email = String(values.get("email") || "");
        if (isSupabase) {
          const { user, session } = await authApi.signUp({ name, email, password: String(values.get("password") || "") });
          if (!session) {
            toast("Akun berhasil dibuat. Verifikasi emailmu, lalu masuk.");
            location.hash = "#/auth";
            return;
          }
          await api.connectUser(user);
        } else api.registerDemo(name, email);
      } else {
        const email = String(values.get("email") || "");
        if (isSupabase) {
          const { user } = await authApi.signIn({ email, password: String(values.get("password") || "") });
          await api.connectUser(user);
        } else api.signInDemo(email);
      }
      location.hash = "#/" + takePending();
    } catch (error) {
      toast(error.message || "Autentikasi gagal. Coba lagi.");
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

      api.saveDraft(id, answers);
      const data = api.submitTask(id);

      await api.flushState();
      render(false);
      toast(isSupabase ? "Tugas dinilai dan tersimpan di Supabase." : "Tugas dinilai dan tersimpan di perangkat ini.");
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
      } else await api.disconnectUser();
    } catch (error) {
      await api.disconnectUser();
      console.error("Supabase bootstrap failed:", error.message);
      toast(`Data Supabase belum termuat: ${error.message}`);
    }
  }
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
