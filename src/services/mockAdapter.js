import {readState,updateState,makeId,emptyState,writeState} from '../utils/storage.js';
import {assess,isComplete,completion,certificateEligible,submittedTask} from '../assessment/rubricEngine.js';
import {tasks,taskById} from '../data/systemAnalyst.js';
import {getFreeTrial} from '../data/freeTrials.js';
import {simulations,getProjectTask,getSimulationTasks} from '../data/catalog.js';
export const mockApi={
  state:readState,
  getFree(simulationId='system-analyst'){const s=readState();const result=s.freeTrials?.[simulationId]||(simulationId==='system-analyst'?s.free:null);return result?.owner===(s.user?.email||null)?result:null;},
  getFreeDraft(simulationId='system-analyst'){const s=readState();return s.freeDrafts?.[simulationId]||(simulationId==='system-analyst'?s.freeDraft:null)||{};},
  startFreeTimer(simulationId='system-analyst'){if(this.getFree(simulationId))return null;const s=readState();const timer=s.freeTimers?.[simulationId]||(simulationId==='system-analyst'?s.freeTimer:null);if(timer)return timer;const startedAt=Date.now(),next={startedAt,expiresAt:startedAt+5*60*1000};updateState(state=>{state.freeTimers??={};state.freeTimers[simulationId]=next;});return next;},
  getFreeRemainingSeconds(simulationId='system-analyst'){const s=readState();const timer=s.freeTimers?.[simulationId]||(simulationId==='system-analyst'?s.freeTimer:null);return timer?Math.max(0,Math.ceil((timer.expiresAt-Date.now())/1000)):null;},
  startTaskTimer(attemptId,taskId,durationMinutes){const key=`${attemptId}:${taskId}`;let timer=readState().taskTimers?.[key];if(!timer){const startedAt=Date.now();timer={startedAt,expiresAt:startedAt+Math.max(1,durationMinutes)*60*1000};updateState(state=>{state.taskTimers??={};state.taskTimers[key]=timer;});}else if(timer.pausedRemainingSeconds!==undefined){const startedAt=Date.now();timer={startedAt,expiresAt:startedAt+timer.pausedRemainingSeconds*1000};updateState(state=>{state.taskTimers[key]=timer;});}return timer;},
  pauseTaskTimer(attemptId,taskId){const key=`${attemptId}:${taskId}`;const timer=readState().taskTimers?.[key];if(!timer||timer.pausedRemainingSeconds!==undefined)return timer;const pausedRemainingSeconds=Math.max(0,Math.ceil((timer.expiresAt-Date.now())/1000));updateState(state=>{state.taskTimers[key]={...timer,pausedRemainingSeconds};});return {...timer,pausedRemainingSeconds};},
  saveFreeDraft(simulationId,answers){if(typeof simulationId!=='string'){answers=simulationId;simulationId='system-analyst';}if(this.getFreeRemainingSeconds(simulationId)===0){this.expireFreeTask(simulationId);return;}updateState(s=>{s.freeDrafts??={};s.freeDrafts[simulationId]=structuredClone(answers);});},
  submitFree(simulationId,answers,{expired=false}={}){if(typeof simulationId!=='string'){expired=answers?.expired||false;answers=simulationId;simulationId='system-analyst';}const existing=this.getFree(simulationId);if(existing)return existing;if(this.getFreeRemainingSeconds(simulationId)===0&&!expired)return this.expireFreeTask(simulationId);const task=getFreeTrial(simulationId).task;if(!expired&&!isComplete(task,answers))throw Error('Lengkapi seluruh keputusan sebelum mengirim tugas.');const result={owner:readState().user?.email||null,answers:structuredClone(answers),assessment:assess(task,answers),finishedAt:new Date().toISOString(),expired};updateState(s=>{s.freeTrials??={};s.freeTrials[simulationId]=result;s.freeDrafts??={};s.freeDrafts[simulationId]={};s.freeTimers??={};delete s.freeTimers[simulationId];if(simulationId==='system-analyst'){s.free=result;s.freeDraft={};s.freeTimer=null;}});return result;},
  expireFreeTask(simulationId='system-analyst'){if(this.getFree(simulationId)||this.getFreeRemainingSeconds(simulationId)!==0)return null;const s=readState();return this.submitFree(simulationId,s.freeDrafts?.[simulationId]||(simulationId==='system-analyst'?s.freeDraft:null)||{},{expired:true});},
  restartFree(simulationId='system-analyst'){updateState(s=>{s.freeTrials??={};s.freeDrafts??={};s.freeTimers??={};delete s.freeTrials[simulationId];delete s.freeDrafts[simulationId];delete s.freeTimers[simulationId];if(simulationId==='system-analyst'){s.free=null;s.freeDraft={};s.freeTimer=null;}});},
  login(name,email){name=name.trim();email=email.trim().toLowerCase();if(name.length<2)throw Error('Tuliskan nama minimal dua karakter.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Gunakan format email yang valid.');return updateState(s=>{s.profiles??={};s.user={name,email,...s.profiles[email]};if(s.free&&!s.free.owner)s.free.owner=email;for(const result of Object.values(s.freeTrials||{}))if(!result.owner)result.owner=email;const history=[...s.attempts].reverse().filter(attempt=>attempt.owner===email&&attempt.status!=='abandoned');s.activeAttemptId=history.find(attempt=>{const simulation=simulations.find(item=>item.id===attempt.simulationId);return simulation&&getSimulationTasks(simulation).some(task=>!submittedTask(attempt.tasks[task.id]));})?.id||null;}).user;},
  registerDemo(name,email){name=String(name||'').trim();email=String(email||'').trim().toLowerCase();if(name.length<2)throw Error('Tuliskan nama lengkap minimal dua karakter.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Gunakan format email yang valid.');const s=readState();if(s.profiles?.[email]||s.entitlements.some(x=>x.userEmail===email)||s.attempts.some(x=>x.owner===email)||s.orders.some(x=>x.userEmail===email))throw Error('Identitas demo ini sudah ada. Pilih Masuk untuk melanjutkan.');updateState(st=>{st.profiles??={};st.profiles[email]={name,email,nickname:'',interest:'',avatarColor:'navy',institution:'',major:'',educationLevel:'',city:'',bio:''};});return this.login(name,email);},
  signInDemo(email){email=String(email||'').trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Gunakan format email yang valid.');const s=readState();const known=s.profiles?.[email]||s.entitlements.some(x=>x.userEmail===email)||s.attempts.some(x=>x.owner===email)||s.orders.some(x=>x.userEmail===email);if(!known)throw Error('Identitas demo belum ditemukan di browser ini. Pilih Daftar untuk memulai.');return this.login(s.profiles?.[email]?.name||'Peserta SiMagang',email);},
  updateProfile({name,email,nickname,interest,avatarColor,institution,major,educationLevel,city,bio}){
    const current=readState().user;
    if(!current)throw Error('Masuk terlebih dahulu untuk mengubah profil.');
    name=String(name||'').trim();email=String(email||'').trim().toLowerCase();nickname=String(nickname||'').trim();
    institution=String(institution??current.institution??'').trim();major=String(major??current.major??'').trim();
    educationLevel=String(educationLevel??current.educationLevel??'').trim();city=String(city??current.city??'').trim();bio=String(bio??current.bio??'').trim();
    if(name.length<2)throw Error('Nama lengkap minimal dua karakter.');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Gunakan format email yang valid.');
    if(nickname.length>30)throw Error('Nama panggilan maksimal 30 karakter.');
    for(const [value,max,label] of [[institution,100,'Nama kampus'],[major,100,'Program studi'],[city,80,'Kota domisili'],[bio,240,'Perkenalan singkat']])if(value.length>max)throw Error(`${label} maksimal ${max} karakter.`);
    if(!['','D3','D4','S1','S2','S3'].includes(educationLevel))throw Error('Pilih jenjang pendidikan yang tersedia.');
    const interests=['system-analyst','data-analyst','uiux-designer','digital-marketing'];
    if(interest&&!interests.includes(interest))throw Error('Pilih posisi yang diminati.');
    if(!['navy','teal','purple'].includes(avatarColor))throw Error('Pilih warna profil yang tersedia.');
    return updateState(s=>{
      s.profiles??={};const oldEmail=s.user.email;
      if(email!==oldEmail&&(s.profiles[email]||s.entitlements.some(x=>x.userEmail===email)||s.attempts.some(x=>x.owner===email)||s.orders.some(x=>x.userEmail===email)))throw Error('Email tersebut sudah digunakan oleh profil lain di browser ini.');
      const profile={name,email,nickname,interest:interest||'',avatarColor,institution,major,educationLevel,city,bio};
      delete s.profiles[oldEmail];s.profiles[email]=profile;s.user=profile;
      if(email!==oldEmail){if(s.free?.owner===oldEmail)s.free.owner=email;for(const item of s.orders)if(item.userEmail===oldEmail)item.userEmail=email;for(const item of s.entitlements)if(item.userEmail===oldEmail)item.userEmail=email;for(const item of s.attempts)if(item.owner===oldEmail)item.owner=email;}
    }).user;
  },
  logout(){updateState(s=>{s.user=null;s.activeAttemptId=null;});},
  hasAccess(id){const s=readState();return s.entitlements.some(x=>x.simulationId===id&&x.userEmail===s.user?.email);},
  checkout(id,method){const state=readState();if(!state.user)throw Error('Masuk dengan akun demo terlebih dahulu.');const simulation=simulations.find(item=>item.id===id);if(!simulation||simulation.status!=='ready')throw Error('Simulasi ini belum tersedia.');if(this.hasAccess(id))throw Error('Akses simulasi ini sudah aktif.');updateState(s=>{s.orders.push({id:makeId('order'),simulationId:id,method,userEmail:s.user.email,amount:simulation.price,mode:'demo',createdAt:new Date().toISOString()});s.entitlements.push({simulationId:id,userEmail:s.user.email});});},
  getActive(simulationId='system-analyst'){const s=readState();if(!this.hasAccess(simulationId))return null;return s.attempts.find(a=>a.id===s.activeAttemptId&&a.owner===s.user?.email&&a.simulationId===simulationId&&a.status==='in_progress')||null;},
  getAttempts(){const s=readState();if(!s.user)return [];const entitled=new Set(s.entitlements.filter(item=>item.userEmail===s.user.email).map(item=>item.simulationId));return s.attempts.filter(a=>a.owner===s.user.email&&a.status!=='abandoned'&&entitled.has(a.simulationId)).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));},
  getDashboardSummary(){
    const s=readState(),email=s.user?.email;
    if(!email)return null;
    const accessIds=new Set(s.entitlements.filter(e=>e.userEmail===email).map(e=>e.simulationId));
    const attempts=s.attempts.filter(a=>a.owner===email&&a.status!=='abandoned'&&accessIds.has(a.simulationId));
    // Access rights are not evidence that a learner has started a simulation.
    // In particular, clearing attempts must return this metric to zero even if
    // an entitlement remains available for starting the simulation again.
    const joinedIds=new Set(attempts.map(a=>a.simulationId));
    const completed=attempts.filter(a=>{const simulation=simulations.find(item=>item.id===a.simulationId);return simulation&&completion(getSimulationTasks(simulation),a);}).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
    const activeAttempt=attempts.find(a=>a.id===s.activeAttemptId)||null;
    const activeSimulation=activeAttempt&&simulations.find(item=>item.id===activeAttempt.simulationId);
    const activeTasks=getSimulationTasks(activeSimulation);
    const active=activeAttempt&&activeSimulation&&!completion(activeTasks,activeAttempt)?activeAttempt:null;
    const finishedTasks=active?activeTasks.filter(t=>submittedTask(active.tasks[t.id])).length:0;
    const nextTask=active?activeTasks.find(t=>!submittedTask(active.tasks[t.id])):null;
    const systemFree=s.freeTrials?.['system-analyst']||s.free;
    const free=systemFree?.owner===email?systemFree:null;
    const recommendations=[];
    const add=(id,reason,detail='')=>{const simulation=simulations.find(p=>p.id===id);if(simulation&&!recommendations.some(x=>x.simulation.id===id))recommendations.push({simulation,reason,detail});};
    if(free){const weak=free.assessment?.breakdown?.find(item=>!item.correct);add('system-analyst','Berdasarkan hasil latihanmu',weak?`Latih lagi: ${weak.label}`:'Lanjutkan kemampuan analisis kebutuhan');}
    if(s.user.interest)add(s.user.interest,'Sesuai minatmu');
    for(const simulation of simulations)add(simulation.id,'Pilihan untuk dijelajahi');
    return {joinedCount:joinedIds.size,completedCount:new Set(completed.map(a=>a.simulationId)).size,hasAccess:accessIds.size>0,accessSimulationId:[...accessIds][0]||null,active:active?{id:active.id,simulationId:active.simulationId,finishedTasks,totalTasks:activeTasks.length,nextTaskId:nextTask?.id,nextTaskTitle:nextTask?.title}:null,recentCompleted:completed[0]||null,recommendations:recommendations.slice(0,2),free};
  },
  getMySimulations(){
    const s=readState(),email=s.user?.email;
    if(!email)return [];
    const accessIds=new Set(s.entitlements.filter(e=>e.userEmail===email).map(e=>e.simulationId));
    const ownedAttempts=s.attempts.filter(a=>a.owner===email&&accessIds.has(a.simulationId));
    const ids=accessIds;
    return simulations.filter(simulation=>ids.has(simulation.id)).map(simulation=>{
      const history=ownedAttempts.filter(a=>a.simulationId===simulation.id&&a.status!=='abandoned');
      const attempt=history.find(a=>a.id===s.activeAttemptId)||history.at(-1)||null;
      const taskList=getSimulationTasks(simulation);
      const completedTasks=attempt?taskList.filter(task=>Boolean(submittedTask(attempt.tasks[task.id]))).length:0;
      const nextTask=attempt?taskList.find(task=>!submittedTask(attempt.tasks[task.id])):null;
      const status=!attempt?'not-started':taskList.length&&completedTasks===taskList.length?'completed':'in-progress';
      return {simulationId:simulation.id,attemptId:attempt?.id||null,status,completedTasks,totalTasks:taskList.length,percent:taskList.length?Math.round(completedTasks/taskList.length*100):0,nextTaskId:nextTask?.id||null,nextTaskTitle:nextTask?.title||null};
    });
  },
  startAttempt(simulationId='system-analyst'){const s=readState();if(!s.user||!this.hasAccess(simulationId))throw Error('Aktifkan akses simulasi dahulu.');const simulation=simulations.find(item=>item.id===simulationId),taskList=getSimulationTasks(simulation);const history=[...s.attempts].filter(attempt=>attempt.owner===s.user.email&&attempt.simulationId===simulationId&&attempt.status!=='abandoned').sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));const isIncomplete=attempt=>taskList.some(task=>!submittedTask(attempt.tasks?.[task.id]));const current=this.getActive(simulationId);const existing=current&&current.status!=='abandoned'&&isIncomplete(current)?current:history.find(isIncomplete);if(existing){updateState(st=>{st.activeAttemptId=existing.id;});return existing;}const a={id:makeId('attempt'),owner:s.user.email,simulationId,createdAt:new Date().toISOString(),status:'in_progress',tasks:{}};updateState(st=>{st.attempts.push(a);st.activeAttemptId=a.id;});return a;},
  newAttempt(){return this.restartAttempt('system-analyst');},
  restartAttempt(simulationId){const s=readState();if(!s.user||!this.hasAccess(simulationId))throw Error('Belum memiliki akses simulasi.');if(!simulations.some(item=>item.id===simulationId))throw Error('Simulasi tidak ditemukan.');const a={id:makeId('attempt'),owner:s.user.email,simulationId,createdAt:new Date().toISOString(),status:'in_progress',tasks:{}};updateState(st=>{for(const old of st.attempts){if(old.owner===s.user.email&&old.simulationId===simulationId){old.status='abandoned';old.tasks={};}}st.attempts.push(a);st.activeAttemptId=a.id;});return a;},
  saveDraft(taskId,answers){const task=taskById(taskId),projectTask=getProjectTask(taskId);if(!task&&!projectTask)throw Error('Tugas tidak dikenali.');const simulationId=projectTask?.simulationId||'system-analyst';updateState(s=>{const a=s.attempts.find(a=>a.id===s.activeAttemptId&&a.owner===s.user?.email&&a.simulationId===simulationId);if(!a)throw Error('Sesi tugas tidak ditemukan.');a.tasks[taskId]??={draft:{}};if(submittedTask(a.tasks[taskId]))throw Error('Tugas ini sudah dikirim.');a.tasks[taskId].draft=structuredClone(answers);});},
  submitTask(taskId){const projectTask=getProjectTask(taskId);if(projectTask){const current=this.getActive(projectTask.simulationId),simulation=simulations.find(item=>item.id===projectTask.simulationId),index=getSimulationTasks(simulation).findIndex(item=>item.id===taskId),previous=getSimulationTasks(simulation)[index-1];if(!current)throw Error('Sesi tugas tidak ditemukan.');if(previous&&!submittedTask(current.tasks[previous.id]))throw Error('Selesaikan tugas sebelumnya lebih dahulu.');const data=current.tasks[taskId];if(submittedTask(data))throw Error('Tugas ini sudah dikirim.');if(!data||!isComplete(projectTask,data.draft))throw Error('Lengkapi seluruh bagian tugas sebelum mengirim.');const answers=structuredClone(data.draft);const manualReview=Boolean(projectTask.manualReview||projectTask.fields?.some(field=>field.type==='file'));const snapshot={answers,assessment:!manualReview&&projectTask.expected?assess(projectTask,answers):null,reviewStatus:manualReview?'pending':undefined,submittedAt:new Date().toISOString()};updateState(s=>{const attempt=s.attempts.find(item=>item.id===current.id&&item.owner===s.user?.email);attempt.tasks[taskId].final=snapshot;attempt.tasks[taskId].completedAt=snapshot.submittedAt;});return {snapshot};}const task=taskById(taskId);const current=this.getActive('system-analyst');if(!current||!task)throw Error('Tugas tidak tersedia.');const previous=tasks[task.number-2];if(previous&&!submittedTask(current.tasks[previous.id]))throw Error('Selesaikan tugas sebelumnya lebih dahulu.');const t=current.tasks[taskId];if(submittedTask(t))throw Error('Tugas ini sudah dikirim.');if(!t||!isComplete(task,t.draft))throw Error('Lengkapi seluruh bagian tugas sebelum mengirim.');const answerSnapshot=structuredClone(t.draft);const snapshot={answers:answerSnapshot,assessment:assess(task,answerSnapshot),submittedAt:new Date().toISOString()};updateState(s=>{const a=s.attempts.find(a=>a.id===s.activeAttemptId&&a.owner===s.user?.email);a.tasks[taskId].final=snapshot;a.tasks[taskId].completedAt=snapshot.submittedAt;});return {snapshot};},
  getAttempt(id){const s=readState();return s.attempts.find(a=>a.id===id&&a.owner===s.user?.email)||null;},
  certificateAllowed(){return certificateEligible(tasks,this.getActive());},
  reset(){writeState(emptyState());}
};
