// Penilaian deterministik untuk setiap pengiriman tugas.
export const RUBRIC_VERSION = 'SA-DEMO-2026.1';
export function assess(config, answers = {}) {
  let score=0;
  const breakdown=config.fields.filter(field=>Number(config.weights[field.id]||0)>0).map(field=>{
    const got=answers[field.id];
    const expected=config.expected[field.id];
    const weight=config.weights[field.id];
    let earned=0;
    if(field.type==='multi') {
      const selected=Array.isArray(got)?got:[];
      const correct=expected;
      const matches=correct.filter(x=>selected.includes(x)).length;
      const wrong=selected.filter(x=>!correct.includes(x)).length;
      earned=Math.max(0,Math.round(weight*(matches/correct.length)-wrong*weight/4));
    } else earned=got===expected?weight:0;
    score+=earned;
    return {fieldId:field.id,label:field.label,earned,max:weight,correct:earned===weight,feedback:earned===weight?'Sudah sesuai kriteria pada kasus ini.':config.feedback[field.id]};
  });
  return {score,breakdown,rubricVersion:RUBRIC_VERSION,gradedAt:new Date().toISOString()};
}
export function isComplete(config,answers={}) {
  return config.fields.every(f=>f.type==='multi'?Array.isArray(answers[f.id])&&answers[f.id].length>0:f.type==='textarea'?String(answers[f.id]||'').trim().length>=(f.minlength||1):Boolean(answers[f.id]));
}
// Data lama tetap dapat dibaca setelah alur dua versi dihapus.
export function submittedTask(data) {return data?.final||data?.v2||data?.v1||null;}
export function weightedScore(tasks,attempt) {
  const available=tasks.filter(t=>submittedTask(attempt?.tasks?.[t.id])?.assessment);
  if(!available.length)return null;
  return Math.round(available.reduce((sum,t)=>sum+submittedTask(attempt.tasks[t.id]).assessment.score*t.weight,0)/available.reduce((sum,t)=>sum+t.weight,0));
}
export function completion(tasks,attempt) {return tasks.every(t=>Boolean(submittedTask(attempt?.tasks?.[t.id])));}
export function certificateEligible(tasks,attempt) {return completion(tasks,attempt)&&weightedScore(tasks,attempt)>=70;}
