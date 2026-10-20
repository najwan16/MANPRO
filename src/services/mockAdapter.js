import {readState,updateState,makeId,emptyState,writeState} from '../utils/storage.js';
import {assess,isComplete,completion,certificateEligible,submittedTask} from '../assessment/rubricEngine.js';
import {freeTask,tasks,taskById} from '../data/systemAnalyst.js';
import {simulations} from '../data/catalog.js';
export const mockApi={
  state:readState,
  getFree(){const s=readState();return s.free?.owner===(s.user?.email||null)?s.free:null;},
  submitFree(answers){if(!isComplete(freeTask,answers))throw Error('Lengkapi seluruh keputusan sebelum mengirim tugas.');return updateState(s=>{s.free={owner:s.user?.email||null,answers:structuredClone(answers),assessment:assess(freeTask,answers),finishedAt:new Date().toISOString()};}).free;},
  login(name,email){name=name.trim();email=email.trim().toLowerCase();if(name.length<2)throw Error('Tuliskan nama minimal dua karakter.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Gunakan format email yang valid.');return updateState(s=>{s.profiles??={};s.user={name,email,...s.profiles[email]};if(s.free&&!s.free.owner)s.free.owner=email;s.activeAttemptId=[...s.attempts].reverse().find(a=>a.owner===email&&a.simulationId==='system-analyst')?.id||null;}).user;},
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
  getActive(){const s=readState();return s.attempts.find(a=>a.id===s.activeAttemptId&&a.owner===s.user?.email&&a.simulationId==='system-analyst')||null;},
  getDashboardSummary(){
    const s=readState(),email=s.user?.email;
    if(!email)return null;
    const attempts=s.attempts.filter(a=>a.owner===email);
    const accessIds=new Set(s.entitlements.filter(e=>e.userEmail===email).map(e=>e.simulationId));
    const joinedIds=new Set([...accessIds,...attempts.map(a=>a.simulationId)]);
    const completed=attempts.filter(a=>a.simulationId==='system-analyst'&&completion(tasks,a)).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
    const active=attempts.find(a=>a.id===s.activeAttemptId&&a.simulationId==='system-analyst'&&!completion(tasks,a))||null;
    const finishedTasks=active?tasks.filter(t=>submittedTask(active.tasks[t.id])).length:0;
    const nextTask=active?tasks.find(t=>!submittedTask(active.tasks[t.id])):null;
    const free=s.free?.owner===email?s.free:null;
    const recommendations=[];
    const add=(id,reason,detail='')=>{const simulation=simulations.find(p=>p.id===id);if(simulation&&!recommendations.some(x=>x.simulation.id===id))recommendations.push({simulation,reason,detail});};
    if(free){const weak=free.assessment?.breakdown?.find(item=>!item.correct);add('system-analyst','Berdasarkan hasil latihanmu',weak?`Latih lagi: ${weak.label}`:'Lanjutkan kemampuan analisis kebutuhan');}
    if(s.user.interest)add(s.user.interest,'Sesuai minatmu');
    for(const simulation of simulations)add(simulation.id,'Pilihan untuk dijelajahi');
    return {joinedCount:joinedIds.size,completedCount:new Set(completed.map(a=>a.simulationId)).size,hasAccess:accessIds.has('system-analyst'),active:active?{id:active.id,finishedTasks,totalTasks:tasks.length,nextTaskId:nextTask?.id}:null,recentCompleted:completed[0]||null,recommendations:recommendations.slice(0,2),free};
  },
  getMySimulations(){
    const s=readState(),email=s.user?.email;
    if(!email)return [];
    const ownedAttempts=s.attempts.filter(a=>a.owner===email);
    const ids=new Set([...s.entitlements.filter(e=>e.userEmail===email).map(e=>e.simulationId),...ownedAttempts.map(a=>a.simulationId)]);
    return simulations.filter(simulation=>ids.has(simulation.id)).map(simulation=>{
      const history=ownedAttempts.filter(a=>a.simulationId===simulation.id);
      const attempt=history.find(a=>a.id===s.activeAttemptId)||history.at(-1)||null;
      const taskList=simulation.id==='system-analyst'?tasks:[];
      const completedTasks=attempt?taskList.filter(task=>Boolean(submittedTask(attempt.tasks[task.id]))).length:0;
      const nextTask=attempt?taskList.find(task=>!submittedTask(attempt.tasks[task.id])):null;
      const status=!attempt?'not-started':taskList.length&&completedTasks===taskList.length?'completed':'in-progress';
      return {simulationId:simulation.id,attemptId:attempt?.id||null,status,completedTasks,totalTasks:taskList.length,percent:taskList.length?Math.round(completedTasks/taskList.length*100):0,nextTaskId:nextTask?.id||null,nextTaskTitle:nextTask?.title||null};
    });
  },
  startAttempt(){const s=readState();if(!s.user||!this.hasAccess('system-analyst'))throw Error('Aktifkan akses demo simulasi dahulu.');const existing=this.getActive();if(existing)return existing;const a={id:makeId('attempt'),owner:s.user.email,simulationId:'system-analyst',createdAt:new Date().toISOString(),tasks:{}};updateState(st=>{st.attempts.push(a);st.activeAttemptId=a.id;});return a;},
  newAttempt(){const s=readState();if(!s.user||!this.hasAccess('system-analyst'))throw Error('Belum memiliki akses simulasi.');const a={id:makeId('attempt'),owner:s.user.email,simulationId:'system-analyst',createdAt:new Date().toISOString(),tasks:{}};updateState(st=>{st.attempts.push(a);st.activeAttemptId=a.id;});return a;},
  saveDraft(taskId,answers){const task=taskById(taskId);if(!task)throw Error('Tugas tidak dikenali.');updateState(s=>{const a=s.attempts.find(a=>a.id===s.activeAttemptId&&a.owner===s.user?.email);if(!a)throw Error('Sesi tugas tidak ditemukan.');a.tasks[taskId]??={draft:{}};if(submittedTask(a.tasks[taskId]))throw Error('Tugas ini sudah dikirim.');a.tasks[taskId].draft=structuredClone(answers);});},
  submitTask(taskId){const task=taskById(taskId);const current=this.getActive();if(!current||!task)throw Error('Tugas tidak tersedia.');const previous=tasks[task.number-2];if(previous&&!submittedTask(current.tasks[previous.id]))throw Error('Selesaikan tugas sebelumnya lebih dahulu.');const t=current.tasks[taskId];if(submittedTask(t))throw Error('Tugas ini sudah dikirim.');if(!t||!isComplete(task,t.draft))throw Error('Lengkapi seluruh bagian tugas sebelum mengirim.');const answerSnapshot=structuredClone(t.draft);const snapshot={answers:answerSnapshot,assessment:assess(task,answerSnapshot),submittedAt:new Date().toISOString()};updateState(s=>{const a=s.attempts.find(a=>a.id===s.activeAttemptId&&a.owner===s.user?.email);a.tasks[taskId].final=snapshot;a.tasks[taskId].completedAt=snapshot.submittedAt;});return {snapshot};},
  getAttempt(id){const s=readState();return s.attempts.find(a=>a.id===id&&a.owner===s.user?.email)||null;},
  certificateAllowed(){return certificateEligible(tasks,this.getActive());},
  reset(){writeState(emptyState());}
};
