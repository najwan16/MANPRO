import { requireSupabase } from "./supabaseClient.js";

let authenticatedUserId = null;
let stateSaveTimer = null;
let stateSavePromise = Promise.resolve();

export const supabaseAdapter = {
  setAuthenticatedUserId(id) {
    if (authenticatedUserId !== id) clearTimeout(stateSaveTimer);
    authenticatedUserId = id || null;
  },
  async loadUserState() {
    if (!authenticatedUserId) return null;
    const { data, error } = await requireSupabase().from("user_app_state")
      .select("state").eq("user_id", authenticatedUserId).maybeSingle();
    if (error) throw error;
    return data?.state || null;
  },
  async getPersistedAttempts() {
    if (!authenticatedUserId) return new Map();
    const { data, error } = await requireSupabase().from("simulation_attempts")
      .select("id,status");
    if (error) throw error;
    return new Map((data || []).map((attempt) => [attempt.id, attempt.status]));
  },
  async getPersistedEntitlements() {
    if (!authenticatedUserId) return [];
    const { data, error } = await requireSupabase().from("simulation_entitlements")
      .select("simulation_id,status").eq("status", "active");
    if (error) throw error;
    return (data || []).map((entitlement) => ({
      simulationId: entitlement.simulation_id,
      status: entitlement.status,
    }));
  },
  async saveUserState(state, userId = authenticatedUserId) {
    if (!userId) throw new Error("Sesi Supabase tidak terhubung.");
    const { error } = await requireSupabase().rpc("sync_my_simulation_state", { p_state: state });
    if (error) throw error;
  },
  scheduleUserStateSave(readState) {
    if (!authenticatedUserId) return;
    clearTimeout(stateSaveTimer);
    const userId = authenticatedUserId;
    stateSaveTimer = setTimeout(() => {
      const snapshot = structuredClone(readState());
      stateSavePromise = stateSavePromise.catch(() => {}).then(() => this.saveUserState(snapshot, userId));
      stateSavePromise.catch((error) => window.dispatchEvent(new CustomEvent("supabase-sync-error", { detail: error })));
    }, 450);
  },
  async flushUserState(readState) {
    if (!authenticatedUserId) return;
    clearTimeout(stateSaveTimer);
    const userId = authenticatedUserId;
    const snapshot = structuredClone(readState());
    stateSavePromise = stateSavePromise.catch(() => {}).then(() => this.saveUserState(snapshot, userId));
    await stateSavePromise;
  },
  async getCatalog() {
    const client = requireSupabase();
    const [companies, simulations, tasks] = await Promise.all([
      client.from("simulation_companies").select("id,name,definition").order("name"),
      client.from("simulations").select("id,company_id,role_name,title,price_idr,status,definition").in("status", ["ready", "soon"]).order("role_name"),
      client.from("simulation_tasks").select("id,simulation_id,sequence,title,definition").order("sequence"),
    ]);
    for (const result of [companies, simulations, tasks]) if (result.error) throw result.error;
    return { companies: companies.data, simulations: simulations.data, tasks: tasks.data };
  },
  async isCurrentUserAdmin() {
    const { data, error } = await requireSupabase().rpc("is_current_user_admin");
    if (error) throw error;
    return data === true;
  },
  async getAdminCatalog() {
    const client = requireSupabase();
    const [companies, simulations, tasks] = await Promise.all([
      client.from("simulation_companies").select("id,name,definition,updated_at").order("name"),
      client.from("simulations").select("id,company_id,role_name,title,price_idr,status,definition,updated_at").order("role_name"),
      client.from("simulation_tasks").select("id,simulation_id,sequence,title,definition,updated_at").order("sequence"),
    ]);
    for (const result of [companies, simulations, tasks]) if (result.error) throw result.error;
    return { companies: companies.data || [], simulations: simulations.data || [], tasks: tasks.data || [] };
  },
  async uploadSubmissionFile(file, attemptId, taskId, fieldId) {
    if (!authenticatedUserId) throw new Error("Sesi masuk tidak ditemukan. Silakan masuk kembali.");
    const cleanName = String(file.name || "upload")
      .normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-120);
    const path = `${authenticatedUserId}/${attemptId}/${taskId}/${fieldId}-${crypto.randomUUID()}-${cleanName}`;
    const { error } = await requireSupabase().storage.from("simulation-submissions").upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) throw error;
    return { name: file.name, size: file.size, type: file.type, storagePath: path };
  },
  async getManualReviews() {
    const { data, error } = await requireSupabase().from("simulation_submissions")
      .select("attempt_id,task_id,review_status,manual_score,manual_feedback,reviewed_at")
      .in("review_status", ["pending", "reviewed"]);
    if (error) throw error;
    return data || [];
  },
  async getAdminSubmissionReviews() {
    const client = requireSupabase();
    const { data, error } = await client.rpc("admin_list_submission_reviews");
    if (error) throw error;
    return Promise.all((data || []).map(async (review) => {
      const files = [];
      for (const [fieldId, answer] of Object.entries(review.answers || {})) {
        if (!answer?.storagePath) continue;
        const { data: signed, error: signError } = await client.storage
          .from("simulation-submissions").createSignedUrl(answer.storagePath, 600);
        files.push({ fieldId, name: answer.name || fieldId, url: signError ? "" : signed?.signedUrl || "" });
      }
      return { ...review, files };
    }));
  },
  async saveManualReview(submissionId, score, feedback) {
    const { error } = await requireSupabase().rpc("admin_review_submission", {
      p_submission_id: submissionId,
      p_score: Number(score),
      p_feedback: String(feedback || "").trim(),
    });
    if (error) throw error;
  },
  async saveAdminCompany(company) {
    const { error } = await requireSupabase().from("simulation_companies").upsert({
      id: company.id, name: company.name, definition: company.definition, updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  },
  async saveAdminSimulation(simulation, tasks) {
    const { error } = await requireSupabase().rpc("admin_save_simulation", {
      p_simulation: simulation,
      p_tasks: tasks,
    });
    if (error) throw error;
  },
  async getSession() {
    const { data, error } = await requireSupabase().auth.getSession();
    if (error) throw error;
    return data.session;
  },
  async signUp({ name, email, password }) {
    const { data, error } = await requireSupabase().auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    if (error) throw error;
    return data;
  },
  async signIn({ email, password }) {
    const { data, error } = await requireSupabase().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    return data;
  },
  async signOut() {
    const { error } = await requireSupabase().auth.signOut();
    if (error) throw error;
  },
};
