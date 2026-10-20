import { supabase } from "./supabaseClient.js";

export async function saveSubmissionToSupabase(userEmail, taskId, answers, score) {
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
    console.error("Gagal menyimpan ke Supabase:", error.message);
  } else {
    console.log("Berhasil disimpan ke Supabase:", data);
  }
}