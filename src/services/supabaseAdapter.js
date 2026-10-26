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
