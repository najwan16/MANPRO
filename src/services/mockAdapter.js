import { getStorage, setStorage } from "../utils/storage.js";
import { tasks } from "../data/systemAnalyst.js";
import { evaluateTask } from "../assessment/rubricEngine.js";

const STORAGE_KEY = "simagang:v3:data";

function loadData() {
  const defaultData = {
    user: null,
    hasAccess: false,
    freeTaskSubmitted: false,
    freeTaskAnswers: null,
    attempts: [],
    activeAttemptId: null,
  };
  return getStorage(STORAGE_KEY, defaultData);
}

function saveData(data) {
  setStorage(STORAGE_KEY, data);
}

export const mockAdapter = {
  // --- AUTH & USER PROFILE ---
  state() {
    return loadData();
  },

  login({ email }) {
    const db = loadData();
    db.user = {
      name: email.split("@")[0],
      email: email,
      nickname: "",
      city: "",
      institution: "",
      major: "",
      educationLevel: "",
      interest: "system-analyst",
      bio: "",
      avatarColor: "navy",
    };
    saveData(db);
    return db.user;
  },

  register({ name, email }) {
    const db = loadData();
    db.user = {
      name,
      email,
      nickname: "",
      city: "",
      institution: "",
      major: "",
      educationLevel: "",
      interest: "system-analyst",
      bio: "",
      avatarColor: "navy",
    };
    saveData(db);
    return db.user;
  },

  logout() {
    const db = loadData();
    db.user = null;
    saveData(db);
  },

  updateProfile(profileData) {
    const db = loadData();
    if (!db.user) throw new Error("Pengguna belum masuk.");
    db.user = { ...db.user, ...profileData };
    saveData(db);
    return db.user;
  },

  // --- ATTEMPTS & SIMULATION PROGRES ---
  // Menyediakan getAttempts & listAttempts agar kompatibel
  getAttempts() {
    const db = loadData();
    return db.attempts || [];
  },

  listAttempts() {
    return this.getAttempts();
  },

  getAttempt(id) {
    const attempts = this.getAttempts();
    return attempts.find((a) => a.id === id) || null;
  },

  getActive() {
    const db = loadData();
    if (!db.activeAttemptId) {
      // Jika belum ada attempt aktif tapi punya akses, buatkan otomatis
      if (db.hasAccess || db.user) {
        return this.startNewAttempt();
      }
      return null;
    }
    return db.attempts.find((a) => a.id === db.activeAttemptId) || null;
  },

  startNewAttempt() {
    const db = loadData();
    const newAttempt = {
      id: "att_" + Date.now(),
      createdAt: new Date().toISOString(),
      tasks: {
        requirements: { draft: {}, final: null },
        userstory: { draft: {}, final: null },
        validation: { draft: {}, final: null },
      },
    };
    db.attempts.push(newAttempt);
    db.activeAttemptId = newAttempt.id;
    saveData(db);
    return newAttempt;
  },

  saveDraft(taskId, answers) {
    const db = loadData();
    let attempt = db.attempts.find((a) => a.id === db.activeAttemptId);
    if (!attempt) {
      attempt = this.startNewAttempt();
    }
    if (!attempt.tasks[taskId]) {
      attempt.tasks[taskId] = { draft: {}, final: null };
    }
    attempt.tasks[taskId].draft = answers;
    saveData(db);
  },

  submitTask(taskId) {
    const db = loadData();
    const attempt = db.attempts.find((a) => a.id === db.activeAttemptId);
    if (!attempt) throw new Error("Sesi simulasi tidak ditemukan.");

    const draftAnswers = attempt.tasks[taskId]?.draft || {};
    const taskConfig = tasks.find((t) => t.id === taskId);
    
    // Evaluasi jawaban menggunakan rubricEngine
    const assessment = evaluateTask(taskConfig, draftAnswers);

    const submissionData = {
      submittedAt: new Date().toISOString(),
      answers: draftAnswers,
      assessment: assessment,
    };

    attempt.tasks[taskId].final = submissionData;
    saveData(db);

    return submissionData;
  },

  // --- DASHBOARD SUMMARY ---
  getDashboardSummary() {
    const db = loadData();
    const attempts = db.attempts || [];
    const active = this.getActive();

    let finishedCount = 0;
    if (active) {
      finishedCount = tasks.filter((t) => active.tasks?.[t.id]?.final).length;
    }

    const nextTask = tasks.find((t) => !active?.tasks?.[t.id]?.final);

    return {
      joinedCount: attempts.length,
      completedCount: attempts.filter((a) => 
        tasks.every((t) => a.tasks?.[t.id]?.final)
      ).length,
      active: active ? {
        attemptId: active.id,
        finishedTasks: finishedCount,
        totalTasks: tasks.length,
        nextTaskId: nextTask ? nextTask.id : "requirements",
      } : null,
      recentCompleted: attempts.reverse().find((a) => 
        tasks.every((t) => a.tasks?.[t.id]?.final)
      ) || null,
      hasAccess: db.hasAccess,
      free: db.freeTaskSubmitted,
      recommendations: [
        {
          simulation: {
            id: "system-analyst",
            role: "Junior System Analyst",
            teaser: "Ubah kebutuhan stakeholder menjadi spesifikasi yang bisa diuji.",
            icon: "workflow",
            status: "ready",
            skills: ["Analisis Kebutuhan", "User Story", "Validasi Kebutuhan"],
          },
          reason: "Rekomendasi Berdasarkan Minat",
          detail: "Cocok untuk memulai karier di bidang analisis sistem dan produk software.",
        },
      ],
    };
  },
};