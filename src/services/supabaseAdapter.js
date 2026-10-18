/**
 * BACKEND HANDOFF — KONTRAK, BUKAN IMPLEMENTASI LIVE.
 * Jangan mengganti adapter demo dengan adapter ini sampai Auth, RLS, entitlements,
 * Edge Function evaluasi, dan verifikasi transaksi benar-benar tersedia.
 * Antarmuka yang harus dipenuhi terdapat di docs/API_CONTRACT.md.
 */
export const supabaseAdapter={
  async configure(){throw Error('Integrasi Supabase belum aktif. Baca docs/BACKEND_HANDOFF.md.');}
};
