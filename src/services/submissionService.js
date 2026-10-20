import { supabase } from "./supabaseClient.js";

export async function saveSubmissionToSupabase(userEmail, taskId, answers, score) {
  try {
    const { data, error } = await supabase
      .from("user_submissions")
      .insert([
        {
          user_email: userEmail,
          task_id: taskId,
          answers: answers,
          score: score,
        },
      ]);

    if (error) {
      console.warn("Info Supabase (Abaikan jika RLS belum diset):", error.message);
    } else {
      console.log("Berhasil disimpan ke Supabase:", data);
    }
  } catch (err) {
    console.warn("Gagal terhubung ke Supabase:", err.message);
  }
}