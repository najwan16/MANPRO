import { mockApi } from "./mockAdapter.js";
import { supabaseAdapter } from "./supabaseAdapter.js";
import { emptyState, readState, writeState } from "../utils/storage.js";

export const authApi = supabaseAdapter;
const viteEnv = import.meta.env || {};
export const isSupabase = viteEnv.VITE_APP_MODE === "supabase";
export const isDemo = !isSupabase;

const persistedMutations = new Set([
  "login", "updateProfile", "checkout", "startAttempt", "newAttempt", "restartAttempt",
  "saveDraft", "submitTask", "startTaskTimer", "pauseTaskTimer", "saveFreeDraft", "restartFree",
  "submitFree", "expireFreeTask",
]);

const supabaseApi = {
  ...mockApi,
  async connectUser(authUser) {
    supabaseAdapter.setAuthenticatedUserId(authUser.id);
    const cloudState = (await supabaseAdapter.loadUserState()) || emptyState();
    // Entitlements in the normalized table are authoritative. In particular,
    // deleting/revoking access there must not be undone by an old JSON snapshot.
    const persistedEntitlements = await supabaseAdapter.getPersistedEntitlements();
    cloudState.entitlements = persistedEntitlements.map((item) => ({
      ...item,
      userEmail: authUser.email.toLowerCase(),
    }));
    if (cloudState?.attempts) {
      // The normalized attempts table is authoritative. Otherwise stale attempts
      // in user_app_state are mirrored back after someone deletes/reset rows.
      const persistedAttempts = await supabaseAdapter.getPersistedAttempts();
      cloudState.attempts = cloudState.attempts.filter((attempt) => persistedAttempts.has(attempt.id));
      for (const attempt of cloudState.attempts) attempt.status = persistedAttempts.get(attempt.id);
      if (!cloudState.attempts.some((attempt) => attempt.id === cloudState.activeAttemptId && attempt.status !== "abandoned")) {
        cloudState.activeAttemptId = null;
      }
    }
    // In Supabase mode, cloud state is authoritative; don't silently import a
    // possibly stale browser's demo/local submissions into a new cloud account.
    if (cloudState?.attempts) {
      const idMap = new Map();
      for (const attempt of cloudState.attempts) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attempt.id || "")) {
          idMap.set(attempt.id, globalThis.crypto.randomUUID());
          attempt.id = idMap.get(attempt.id);
        }
      }
      if (idMap.has(cloudState.activeAttemptId)) cloudState.activeAttemptId = idMap.get(cloudState.activeAttemptId);
      if (cloudState.taskTimers) {
        for (const [oldAttemptId, newAttemptId] of idMap) {
          for (const [key, timer] of Object.entries(cloudState.taskTimers)) {
            if (key.startsWith(`${oldAttemptId}:`)) {
              cloudState.taskTimers[`${newAttemptId}:${key.slice(oldAttemptId.length + 1)}`] = timer;
              delete cloudState.taskTimers[key];
            }
          }
        }
      }
    }
    writeState(cloudState || emptyState());
    const user = mockApi.login(authUser.user_metadata?.full_name || "Peserta SiMagang", authUser.email);
    await supabaseAdapter.saveUserState(readState());
    return user;
  },
  async refreshEntitlements() {
    const state = readState();
    if (!state.user) return false;
    const persisted = await supabaseAdapter.getPersistedEntitlements();
    const next = persisted.map((item) => ({ ...item, userEmail: state.user.email.toLowerCase() }));
    const signature = (items) => JSON.stringify(items
      .map(({ simulationId, status, userEmail }) => ({ simulationId, status, userEmail }))
      .sort((a, b) => a.simulationId.localeCompare(b.simulationId)));
    if (signature(state.entitlements || []) === signature(next)) return false;
    writeState({ ...state, entitlements: next });
    return true;
  },
  async disconnectUser() {
    mockApi.logout();
    writeState(emptyState());
    supabaseAdapter.setAuthenticatedUserId(null);
  },
  flushState() {
    return supabaseAdapter.flushUserState(readState);
  },
};

const demoApi = {
  ...mockApi,
  async flushState() {},
  async disconnectUser() { mockApi.logout(); },
};

export const api = isSupabase
  ? new Proxy(supabaseApi, {
      get(target, property, receiver) {
        const value = Reflect.get(target, property, receiver);
        if (typeof value !== "function" || !persistedMutations.has(property)) return value;
        return (...args) => {
          const result = value.apply(receiver, args);
          supabaseAdapter.scheduleUserStateSave(readState);
          return result;
        };
      },
    })
  : demoApi;
