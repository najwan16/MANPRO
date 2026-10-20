import test from 'node:test';
import assert from 'node:assert/strict';
import {mockApi as api} from '../src/services/mockAdapter.js';
import {freeTask,tasks} from '../src/data/systemAnalyst.js';
import {weightedScore,completion,certificateEligible,submittedTask} from '../src/assessment/rubricEngine.js';
class LocalStorageStub { constructor(){this.values=new Map()}getItem(k){return this.values.get(k)??null}setItem(k,v){this.values.set(k,String(v))}removeItem(k){this.values.delete(k)}clear(){this.values.clear()}}
globalThis.localStorage=new LocalStorageStub();
const correct=config=>Object.fromEntries([...Object.entries(config.expected).map(([k,v])=>[k,structuredClone(v)]),...config.fields.filter(f=>f.type==='textarea').map(f=>[f.id,'Sebagai staf, saya ingin mengecek jadwal agar tidak terjadi benturan pemesanan.'])]);
const incorrect=config=>Object.fromEntries(config.fields.map(f=>[f.id,f.type==='textarea'?'Saya belum tahu apakah ini benar atau belum.':f.type==='multi'?[f.options.at(-1)[0]]:f.options[1][0]===config.expected[f.id]?f.options.at(-1)[0]:f.options[1][0]]));
test('demo registration and sign-in preserve the saved identity',()=>{
  api.reset();assert.throws(()=>api.signInDemo('baru@example.com'),/belum ditemukan/);
  api.registerDemo('Nina Pratama','NINA@example.com');assert.equal(api.state().user.email,'nina@example.com');
  api.logout();api.signInDemo('nina@example.com');assert.equal(api.state().user.name,'Nina Pratama');
  assert.throws(()=>api.registerDemo('Nina Lain','nina@example.com'),/sudah ada/);
  api.reset();
});
test('free challenge scores answers rather than fabricating a weak result',()=>{
  api.reset();const good=api.submitFree(correct(freeTask));assert.equal(good.assessment.score,100);
  assert.equal(api.getFree().assessment.score,100);assert.equal(api.getActive(),null);assert.equal(api.hasAccess('system-analyst'),false);
  assert.equal(api.submitFree(incorrect(freeTask)).assessment.score,100,'a second submit is idempotent until the preview is restarted');
  api.restartFree();assert.throws(()=>api.submitFree({}),/Lengkapi/);
  const bad=api.submitFree(incorrect(freeTask));assert.ok(bad.assessment.score<100);
  api.login('Tamu A','tamu.a@example.com');assert.equal(api.getFree().assessment.score,bad.assessment.score,'guest preview follows its owner after login');
  api.logout();api.login('Tamu B','tamu.b@example.com');assert.equal(api.getFree(),null,'another user cannot read preview answers');
});
test('checkout grants scoped access; each task is submitted once',()=>{
  api.reset();assert.equal(api.hasAccess('system-analyst'),false);
  api.login('Andi Pratama','andi@example.com');
  assert.equal(api.hasAccess('system-analyst'),false);
  assert.throws(()=>api.startAttempt(),/Aktifkan/);
  api.checkout('data-analyst','qris');assert.equal(api.hasAccess('data-analyst'),true);
  assert.equal(api.state().orders[0].amount,29000);
  api.checkout('system-analyst','qris');assert.equal(api.hasAccess('system-analyst'),true);
  assert.equal(api.state().orders[1].amount,19000);
  assert.throws(()=>api.checkout('system-analyst','qris'),/sudah aktif/);
  assert.equal(api.state().orders.length,2,'repeat checkout cannot create another order');
  const attempt=api.startAttempt();assert.ok(attempt.id);
  assert.throws(()=>api.submitTask('userstory'),/Selesaikan/);
  for(const config of tasks){
    api.saveDraft(config.id,correct(config));const result=api.submitTask(config.id);
    assert.equal(result.snapshot.assessment.score,100);
    assert.deepEqual(api.getActive().tasks[config.id].final,result.snapshot);
    assert.throws(()=>api.submitTask(config.id),/sudah dikirim/);
    assert.throws(()=>api.saveDraft(config.id,incorrect(config)),/sudah dikirim/);
  }
  const a=api.getActive();assert.ok(completion(tasks,a));
  assert.equal(weightedScore(tasks,a),100);
  assert.equal(certificateEligible(tasks,a),true);
  assert.throws(()=>api.submitTask('requirements'),/sudah dikirim/);
  api.logout();assert.equal(api.hasAccess('system-analyst'),false);
  api.login('Nia Lestari','nia@example.com');assert.equal(api.hasAccess('system-analyst'),false);assert.equal(api.getAttempt(attempt.id),null);
  assert.equal(api.getActive(),null);
  api.login('Andi Pratama','andi@example.com');assert.equal(api.hasAccess('system-analyst'),true);
  assert.ok(api.getAttempt(attempt.id),'completed attempt and its results remain available after sign-in');
  assert.equal(api.getActive(),null,'completed work is not treated as an active session');
});
test('draft survives logout and does not raise progress before submission',()=>{
  api.reset();api.login('Dina','dina@example.com');api.checkout('system-analyst','qris');api.startAttempt();
  api.saveDraft('requirements',correct(tasks[0]));
  assert.equal(api.getMySimulations()[0].percent,0);
  api.logout();api.login('Dina','dina@example.com');
  assert.deepEqual(api.getActive().tasks.requirements.draft,correct(tasks[0]));
  assert.equal(api.getMySimulations()[0].percent,0);
  api.submitTask('requirements');assert.equal(api.getMySimulations()[0].percent,33);
});
test('low scores do not unlock the certificate; a new attempt starts empty',()=>{
  api.reset();api.login('Uji Netral','netral@example.com');api.checkout('system-analyst','ewallet');api.startAttempt();
  for(const c of tasks){api.saveDraft(c.id,incorrect(c));api.submitTask(c.id);}
  const a=api.getActive();assert.ok(completion(tasks,a));assert.ok(weightedScore(tasks,a)<70);assert.equal(certificateEligible(tasks,a),false);
  api.newAttempt();assert.ok(!completion(tasks,api.getActive()));
});
test('previously saved submissions remain readable',()=>{
  const snapshot={assessment:{score:80},answers:{},submittedAt:'2026-01-01'};
  assert.equal(submittedTask({v1:snapshot}),snapshot);
  assert.equal(submittedTask({v1:snapshot,v2:{...snapshot,assessment:{score:90}}}).assessment.score,90);
  assert.equal(weightedScore(tasks,{tasks:Object.fromEntries(tasks.map(t=>[t.id,{v1:snapshot}]))}),80);
});
test('dashboard recommendations and counts use the signed-in user data',()=>{
  api.reset();api.login('Alya','alya@example.com');
  let summary=api.getDashboardSummary();
  assert.equal(summary.joinedCount,0);assert.equal(summary.completedCount,0);assert.equal(summary.active,null);
  assert.equal(summary.recommendations.length,2);
  assert.equal(summary.recommendations[0].reason,'Pilihan untuk dijelajahi');
  api.submitFree(incorrect(freeTask));
  summary=api.getDashboardSummary();assert.equal(summary.recommendations[0].simulation.id,'system-analyst');assert.equal(summary.recommendations[0].reason,'Berdasarkan hasil latihanmu');
  api.updateProfile({name:'Alya',email:'alya@example.com',nickname:'',interest:'uiux-designer',avatarColor:'navy'});
  summary=api.getDashboardSummary();assert.equal(summary.recommendations[1].simulation.id,'uiux-designer');assert.equal(summary.recommendations[1].simulation.status,'ready');
  api.checkout('system-analyst','qris');api.startAttempt();
  summary=api.getDashboardSummary();assert.equal(summary.joinedCount,1);assert.equal(summary.active.finishedTasks,0);assert.equal(summary.active.nextTaskId,'requirements');
  let mySimulations=api.getMySimulations();assert.equal(mySimulations.length,1);assert.equal(mySimulations[0].status,'in-progress');assert.equal(mySimulations[0].percent,0);
  api.saveDraft('requirements',correct(tasks[0]));
  summary=api.getDashboardSummary();assert.equal(summary.active.finishedTasks,0,'draft does not count as completed');assert.equal(api.getMySimulations()[0].percent,0);
  api.submitTask('requirements');summary=api.getDashboardSummary();assert.equal(summary.active.finishedTasks,1);assert.equal(summary.active.nextTaskId,'userstory');
  mySimulations=api.getMySimulations();assert.equal(mySimulations[0].percent,33);assert.equal(mySimulations[0].nextTaskId,'userstory');
  api.logout();api.login('Bima','bima@example.com');summary=api.getDashboardSummary();assert.equal(summary.joinedCount,0);assert.equal(summary.active,null);assert.equal(summary.free,null);assert.equal(summary.recommendations[0].reason,'Pilihan untuk dijelajahi');assert.deepEqual(api.getMySimulations(),[]);
  api.login('Alya','alya@example.com');assert.equal(api.getMySimulations()[0].percent,33,'progress survives sign-out');
});
test('my simulations shows owned access as not started and completed tasks as 100 percent',()=>{
  api.reset();api.login('Raka','raka@example.com');assert.deepEqual(api.getMySimulations(),[]);
  api.checkout('system-analyst','qris');
  let item=api.getMySimulations()[0];assert.equal(item.status,'not-started');assert.equal(item.percent,0);assert.equal(item.attemptId,null);
  api.startAttempt();for(const task of tasks){api.saveDraft(task.id,correct(task));api.submitTask(task.id);}
  item=api.getMySimulations()[0];assert.equal(item.status,'completed');assert.equal(item.percent,100);assert.equal(item.completedTasks,3);assert.equal(item.nextTaskId,null);
  const finishedId=item.attemptId;api.newAttempt();item=api.getMySimulations()[0];assert.equal(item.status,'in-progress');assert.equal(item.percent,0);assert.ok(api.getAttempt(finishedId));
});
test('editing profile preserves project access, progress, and preferences',()=>{
  api.reset();api.login('Andi Pratama','andi@example.com');api.checkout('system-analyst','qris');const attempt=api.startAttempt();
  const saved=api.updateProfile({name:'Andi Saputra',email:'andi.baru@example.com',nickname:'Andi',interest:'system-analyst',avatarColor:'teal',institution:'Universitas Contoh',major:'Sistem Informasi',educationLevel:'S1',city:'Bandung',bio:'Tertarik pada analisis kebutuhan pengguna.'});
  assert.equal(saved.nickname,'Andi');assert.equal(saved.avatarColor,'teal');assert.equal(api.hasAccess('system-analyst'),true);assert.equal(api.getActive().id,attempt.id);
  assert.equal(saved.institution,'Universitas Contoh');assert.equal(saved.educationLevel,'S1');assert.equal(saved.bio,'Tertarik pada analisis kebutuhan pengguna.');
  assert.equal(api.state().orders[0].userEmail,'andi.baru@example.com');assert.equal(api.state().attempts[0].owner,'andi.baru@example.com');
  api.logout();api.login('Andi Lama','andi.baru@example.com');assert.equal(api.state().user.name,'Andi Saputra');assert.equal(api.state().user.interest,'system-analyst');assert.equal(api.state().user.city,'Bandung');assert.equal(api.state().user.major,'Sistem Informasi');assert.equal(api.getActive().id,attempt.id);
  assert.throws(()=>api.updateProfile({name:'Andi Saputra',email:'andi.baru@example.com',nickname:'Andi',interest:'system-analyst',avatarColor:'teal',bio:'x'.repeat(241)}),/Perkenalan singkat maksimal 240/);
  assert.throws(()=>api.updateProfile({name:'A',email:'invalid',nickname:'',interest:'system-analyst',avatarColor:'navy'}),/Nama lengkap/);
});
