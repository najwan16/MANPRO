import { api } from "./services/index.js";
import { saveSubmissionToSupabase } from "./services/submissionService.js";
import { tasks, taskById } from "./data/systemAnalyst.js";
import { downloadText } from "./utils/storage.js";
import { readForm, fieldName } from "./utils/helpers.js";
import { Navbar } from "./components/navbar.js";
import { Footer } from "./components/footer.js";
import { toast } from "./components/ui.js";
import { artifact } from "./components/artifacts.js";

// Import Halaman Modular
import { HomePage } from "./pages/home.js";
import { DashboardPage } from "./pages/dashboard.js";
import { DetailPage } from "./pages/detail.js";
import { WorkspacePage } from "./pages/workspace.js";
import { ProgressPage } from "./pages/progress.js";
import { ProfilePage } from "./pages/profile.js";
import { PortfolioPage, formatPortfolio } from "./pages/portfolio.js";
import { ReportPage, formatReport } from "./pages/report.js";
import { CertificatePage, downloadCertificate } from "./pages/certificate.js";
import { InformationPage } from "./pages/information.js";
import { ExplorePage } from "./pages/explore.js";
import { AuthPage } from "./pages/auth.js";

const app = document.getElementById("app");

const route = () =>
  decodeURIComponent((location.hash.replace(/^#\/?/, "") || "home").split("?")[0]);

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
  return `<a class="skip-link" href="#page-content">Lewati ke konten utama</a>
  ${Navbar(active, s)}
  <main id="page-content" class="${options.full ? "main-full" : "main-content"}">${content}</main>
  ${Footer(s)}
  <div id="toast" role="status" aria-live="polite"></div>`;
}

function render(scroll = false) {
  const value = route();
  const [name, id] = value.split("/");
  const s = api.state();
  const signedDashboard = name === "dashboard" && !!s.user;
  
  // Rute yang membutuhkan login terlebih dahulu
  const protectedRoutes = ["progress", "checkout", "welcome", "workspace", "report", "portfolio", "certificate", "profile"];

  if (protectedRoutes.includes(name) && !s.user) {
    setPending(value);
    go("auth");
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
      view = ExplorePage();
      break;
    case "detail":
      view = DetailPage(id);
      break;
    case "workspace":
      view = WorkspacePage(id);
      break;
    case "progress":
      view = ProgressPage();
      break;
    case "profile":
      view = ProfilePage();
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
    case "auth":
      view = AuthPage(false);
      break;
    case "register":
      view = AuthPage(true);
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

  if (scroll) window.scrollTo({ top: 0, behavior: "instant" });
}

window.addEventListener("hashchange", () => render(true));

// --- REALTIME INPUT & AUTOSAVE DRAFT HANDLER ---
document.addEventListener("input", (e) => {
  if (e.target.matches("[data-answer]") && e.target.closest("#task-work-form")) {
    const taskId = e.target.closest("form").dataset.task;
    const config = taskById(taskId);
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
});

// --- SUBMIT FORM HANDLER ---
document.addEventListener("submit", (e) => {
  if (e.target.id === "auth-form") {
    e.preventDefault();
    const form = e.target;
    const type = form.dataset.type;
    const formData = new FormData(form);
    const email = formData.get("email");
    const name = formData.get("name") || email.split("@")[0];

    try {
      if (type === "register") {
        api.register({ name, email });
      } else {
        api.login({ email });
      }
      const nextTarget = takePending();
      go(nextTarget);
      toast("Berhasil masuk!");
    } catch (err) {
      toast(err.message);
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
      const cfg = taskById(id);
      const answers = readForm(form, cfg);

      api.saveDraft(id, answers);
      const data = api.submitTask(id);

      const userEmail = api.state().user?.email || "anonymous@demo.com";
      const score = data?.assessment?.score || 0;
      
      saveSubmissionToSupabase(userEmail, id, answers, score);

      render(false);
      toast("Tugas dinilai dan tersimpan di database!");
    } catch (err) {
      toast(err.message);
    }
  }
});

// --- GLOBAL CLICK ACTION HANDLER ---
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-act]");
  if (!t) return;
  const action = t.dataset.act;

  switch (action) {
    case "logout":
      api.logout();
      go("dashboard");
      break;
    case "toggle-menu": {
      const el = document.getElementById("mobile-nav");
      if (el) el.hidden = !el.hidden;
      break;
    }
    case "save-work-draft": {
      const form = document.getElementById("task-work-form");
      if (form) {
        const taskId = form.dataset.task;
        const config = taskById(taskId);
        const answers = readForm(form, config);
        api.saveDraft(taskId, answers);
        toast("Draf berhasil disimpan!");
      }
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

// Jalankan aplikasi
render();