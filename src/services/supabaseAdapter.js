import { requireSupabase } from './supabaseClient.js'
const db = () => requireSupabase()

const requireUser = async () => {
  const { data: { user }, error } = await db().auth.getUser()
  if (error) throw error
  if (!user) throw new Error('Silakan masuk untuk melanjutkan.')
  return user
}

// Auth and persistence primitives for the live backend. Grading stays server-side;
// the browser cannot submit a score or change an accepted result.
export const supabaseAdapter = {
  async configure() {
    const { data, error } = await db().auth.getSession()
    if (error) throw error
    return data.session
  },
  async signUp({ email, password, fullName }) {
    const { data, error } = await db().auth.signUp({
      email: email.trim().toLowerCase(), password,
      options: { data: { full_name: fullName.trim() } },
    })
    if (error) throw error
    return data
  },
  async signIn({ email, password }) {
    const { data, error } = await db().auth.signInWithPassword({
      email: email.trim().toLowerCase(), password,
    })
    if (error) throw error
    return data
  },
  async signOut() {
    const { error } = await db().auth.signOut()
    if (error) throw error
  },
  async getProfile() {
    const user = await requireUser()
    const { data, error } = await db().from('profiles').select('*').eq('id', user.id).single()
    if (error) throw error
    return { ...data, id: user.id, email: user.email }
  },
  async updateProfile(changes) {
    const user = await requireUser()
    const { data, error } = await db().from('profiles').update({
      full_name: changes.name,
      nickname: changes.nickname,
      interest: changes.interest,
      institution: changes.institution,
      major: changes.major,
      education_level: changes.educationLevel,
      city: changes.city,
      bio: changes.bio,
      avatar_color: changes.avatarColor,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id).select().single()
    if (error) throw error
    return data
  },
  async startAttempt(simulationId) {
    const user = await requireUser()
    const { data, error } = await db().from('test_attempts')
      .insert({ user_id: user.id, simulation_id: simulationId })
      .select().single()
    if (error) throw error
    return data
  },
  async listSubmissions(attemptId) {
    const user = await requireUser()
    const { data, error } = await db().from('user_submissions')
      .select('id, task_id, answers, score, submitted_at, expired')
      .eq('user_id', user.id).eq('attempt_id', attemptId).order('submitted_at')
    if (error) throw error
    return data
  },
  async persistSubmission({ attempt, taskId, answers, expired = false }) {
    const user = await requireUser()
    let remoteAttemptId = attempt.backendAttemptId
    if (!remoteAttemptId) {
      const { data: created, error: attemptError } = await db().from('test_attempts')
        .insert({ user_id: user.id, simulation_id: attempt.simulationId || 'system-analyst' })
        .select('id').single()
      if (attemptError) throw attemptError
      remoteAttemptId = created.id
    }

    const { data: existing, error: lookupError } = await db().from('user_submissions')
      .select('id').eq('user_id', user.id).eq('attempt_id', remoteAttemptId)
      .eq('task_id', taskId).maybeSingle()
    if (lookupError) throw lookupError
    if (!existing) {
      const { error } = await db().from('user_submissions').insert({
        user_id: user.id,
        attempt_id: remoteAttemptId,
        user_email: user.email,
        task_id: taskId,
        answers,
        score: null,
        expired,
      })
      if (error) throw error
    }
    return remoteAttemptId
  },
  onAuthStateChange(callback) {
    return db().auth.onAuthStateChange(callback)
  },
}
