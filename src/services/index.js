import {mockApi} from './mockAdapter.js';
import {supabaseAdapter} from './supabaseAdapter.js';
export const api=mockApi;
export const authApi=supabaseAdapter;
export const isSupabase=import.meta.env.VITE_APP_MODE==='supabase';
export const isDemo=!isSupabase;
