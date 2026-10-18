import test from 'node:test';
import assert from 'node:assert/strict';
class Storage{m=new Map();getItem(k){return this.m.get(k)??null;}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
const app={innerHTML:''};const catalog={innerHTML:''};const toast={textContent:'',classList:{add(){},remove(){}}};const listeners=new Map();let hashCB;
globalThis.localStorage=new Storage();globalThis.sessionStorage=new Storage();
globalThis.document={title:'',getElementById:id=>id==='app'?app:id==='catalog-container'?catalog:id==='toast'?toast:null,addEventListener:(n,fn)=>listeners.set(n,[...(listeners.get(n)||[]),fn])};
globalThis.window={addEventListener:(n,fn)=>{if(n==='hashchange')hashCB=fn;},scrollTo(){}};
let urlhash='#/home';globalThis.location={get hash(){return urlhash},set hash(v){urlhash=v;if(hashCB)hashCB()}};
await import('../src/main.js');
const visit=p=>{location.hash='#/'+p;return app.innerHTML;};
const selectProgressFilter=filter=>{const button={dataset:{act:'progress-filter',filter},closest:selector=>selector==='[data-act="progress-filter"]'||selector==='[data-act]'?button:null};for(const listener of listeners.get('click')||[])listener({target:button,preventDefault(){}});return app.innerHTML;};
const dispatch=(type,target)=>{for(const listener of listeners.get(type)||[])listener({target,preventDefault(){}});};
const visibleCopy=html=>html.replace(/<svg[\s\S]*?<\/svg>/g,'');
test('Landing, catalog and all four detail pages render without crashing',()=>{
  const home=visit('home');assert.match(home,/Kenali pekerjaan/);assert.match(home,/<nav class="nav-links"[^>]*><a href="#\/dashboard"[^>]*>Dashboard<\/a>/);assert.match(home,/<div class="mobile-links"[^>]*><a href="#\/dashboard">Dashboard<\/a>/);assert.doesNotMatch(home,/demo akademik|proyek akademik/i);assert.match(visit('explore'),/Jelajahi Simulasi/);
  assert.doesNotMatch(home.match(/<footer class="footer site-footer">[\s\S]*?<\/footer>/)?.[0]||'',/href="#\/free"|Latihan Gratis/);
  assert.doesNotMatch(home.match(/<div class="nav-actions">.*?<\/div><\/div><div class="mobile-links"/)?.[0]||'',/Coba Gratis|href="#\/free"/);
  assert.match(home,/<div class="hero-cta"><a href="#\/explore"/);
  assert.match(home,/<a class="brand" href="#\/dashboard"/);assert.match(home,/<a href="#\/dashboard" aria-current="page">Dashboard<\/a>/);assert.match(home,/<a href="#\/progress"[^>]*>Progres<\/a>/);assert.doesNotMatch(home.match(/<nav class="nav-links".*?<\/nav>/)?.[0]||'',/Cara Kerja|3\/3/);assert.doesNotMatch(home,/visual-tag|checkout-banner/);
  assert.match(catalog.innerHTML,/System Analyst/);
  for(const slug of ['system-analyst','data-analyst','uiux-designer','digital-marketing'])assert.match(visit('detail/'+slug),/Perusahaan fiktif/);
  const detailSoon=visit('detail/data-analyst');assert.match(detailSoon,/Segera Hadir/);assert.match(detailSoon,/Belum tersedia untuk dibeli/);assert.doesNotMatch(detailSoon,/href="#\/checkout\/data-analyst"/);
  const detailReady=visit('detail/system-analyst');assert.match(detailReady,/Beli Simulasi/);assert.match(detailReady,/Coba 1 Tugas Gratis/);assert.equal((detailReady.match(/class="simulation-task"/g)||[]).length,3);
  assert.equal((detailReady.match(/class="simulation-preview-link"/g)||[]).length,1);
  assert.doesNotMatch(detailReady,/rating|ulasan pengguna/i);
  assert.match(catalog.innerHTML,/Lihat Rincian/);assert.doesNotMatch(catalog.innerHTML,/Beli Simulasi|Coba 1 Tugas Gratis/);
  visit('explore');dispatch('input',{id:'catalog-search',value:'nusa digital',matches:()=>false});assert.match(catalog.innerHTML,/System Analyst/);assert.doesNotMatch(catalog.innerHTML,/Data Analyst/);
  dispatch('input',{id:'catalog-search',value:'tidak ada',matches:()=>false});assert.match(catalog.innerHTML,/Simulasi tidak ditemukan/);
  visit('explore');dispatch('input',{id:'catalog-search',value:'',matches:()=>false});dispatch('change',{id:'catalog-category',value:'Desain',matches:()=>false});assert.match(catalog.innerHTML,/UI\/UX Designer/);assert.doesNotMatch(catalog.innerHTML,/System Analyst/);
});
test('Guest can open free task and guarded checkout forwards to auth',()=>{
  assert.match(visit('dashboard'),/Kenali pekerjaan/);assert.equal(location.hash,'#/dashboard');assert.doesNotMatch(app.innerHTML,/Masuk untuk lanjut latihan/);
  assert.match(visit('progress'),/Progres Saya/);assert.match(app.innerHTML,/Belum ada simulasi yang kamu ikuti/);assert.match(app.innerHTML,/Jelajahi Simulasi/);
  visit('profile');assert.equal(location.hash,'#/auth');assert.match(app.innerHTML,/Selamat datang kembali/);
  assert.match(visit('free'),/Kirim Keputusan/);
  assert.match(visit('free-result'),/Belum ada hasil tugas gratis/);
  visit('checkout/system-analyst');assert.equal(location.hash,'#/auth');assert.match(app.innerHTML,/Selamat datang kembali/);
});
test('Account choices and footer lead to available Indonesian pages',async()=>{
  const {mockApi}=await import('../src/services/mockAdapter.js');mockApi.reset();
  const login=visit('auth');assert.match(login,/aria-current="page">Masuk/);assert.match(login,/href="#\/register"/);assert.match(login,/name="email"/);assert.doesNotMatch(login,/name="name"/);
  const register=visit('register');assert.match(register,/aria-current="page">Daftar/);assert.match(register,/name="name"/);assert.match(register,/name="email"/);
  for(const [route,title] of [['about','Tentang SiMagang'],['help','Pusat Bantuan'],['privacy','Privasi Data Demo']]){assert.match(register,new RegExp(`href="#/${route}"`));assert.match(visit(route),new RegExp(title));}
  mockApi.reset();
});
test('auth resumes checkout destination, and checkout needs explicit confirmation',async()=>{
  const {mockApi}=await import('../src/services/mockAdapter.js');
  mockApi.reset();visit('checkout/system-analyst');assert.equal(location.hash,'#/auth');
  mockApi.login('Tamu Baru','baru@example.com');visit('auth');assert.equal(location.hash,'#/checkout/system-analyst');
  assert.match(app.innerHTML,/Konfirmasi Pembelian Demo/);assert.match(app.innerHTML,/Tidak ada transaksi uang nyata/);
  assert.equal(mockApi.hasAccess('system-analyst'),false,'opening checkout does not grant access');
  assert.equal(mockApi.state().orders.length,0);
  mockApi.checkout('system-analyst','qris');assert.equal(mockApi.hasAccess('system-analyst'),true);
  visit('checkout/system-analyst');assert.equal(location.hash,'#/welcome');
  mockApi.reset();
});
test('UI report and certificate use real saved data, with correct gating',async()=>{
  const {mockApi}=await import('../src/services/mockAdapter.js');const {tasks}=await import('../src/data/systemAnalyst.js');
  mockApi.reset();mockApi.login('Andi Demo','andi@example.com');mockApi.checkout('system-analyst','qris');
  assert.match(visit('home'),/Kenali pekerjaan/);const dashboard=visit('dashboard');assert.match(dashboard,/Halo, Andi!/);assert.match(dashboard,/Simulasi Diikuti/);assert.match(dashboard,/Simulasi Selesai/);assert.match(dashboard,/Belum ada simulasi yang sedang kamu kerjakan/);assert.match(dashboard,/Rekomendasi pekerjaan/);assert.match(dashboard,/Hasil simulasimu/);assert.doesNotMatch(dashboard,/Kenali pekerjaan/);assert.match(dashboard,/class="profile-menu"/);assert.match(dashboard,/href="#\/profile"/);
  const progress=visit('progress');assert.match(progress,/Progres Saya/);assert.match(progress,/Belum Dimulai/);assert.match(progress,/0 dari 3 tugas selesai/);assert.match(progress,/href="#\/welcome"[^>]*>Mulai Simulasi/);assert.equal((progress.match(/class="my-progress-stat"/g)||[]).length,2);assert.doesNotMatch(visibleCopy(progress),/\b(?:V1|V2|Revisi)\b/i);
  const progressRoute=location.hash;assert.match(selectProgressFilter('in-progress'),/Tidak ada simulasi yang sedang berlangsung/);assert.equal(location.hash,progressRoute);assert.doesNotMatch(app.innerHTML,/class="my-progress-card"/);
  assert.match(selectProgressFilter('completed'),/Belum ada simulasi yang selesai/);
  assert.match(selectProgressFilter('all'),/Belum Dimulai/);
  const profile=visit('profile');assert.match(profile,/Profil & personalisasi/);assert.match(profile,/id="profile-form"/);assert.match(profile,/name="institution"/);assert.match(profile,/name="major"/);assert.match(profile,/name="bio"/);assert.doesNotMatch(profile,/Ringkasan belajar|Checkout demo dilakukan/);
  visit('checkout/system-analyst');assert.equal(location.hash,'#/welcome','existing access skips checkout');
  assert.match(visit('welcome'),/Mulai Tugas Pertama/);
  mockApi.startAttempt();
  assert.match(visit('progress'),/Berlangsung/);assert.match(app.innerHTML,/Requirement Identification/);assert.match(app.innerHTML,/0 dari 3 tugas selesai/);
  const started=visit('dashboard');assert.match(started,/Sedang Berlangsung/);assert.match(started,/0 dari 3 tugas selesai/);assert.match(started,/href="#\/workspace\/requirements"[^>]*>Lanjutkan Simulasi/);
  const editor=visit('workspace/requirements');assert.match(editor,/Susun Requirements Register/);assert.match(editor,/Simpan Draf/);assert.match(editor,/Data pendukung/);assert.doesNotMatch(visibleCopy(editor),/\b(?:V1|V2|Revisi)\b/i);
  assert.match(visit('report'),/belum tersedia/);
  for(const c of tasks){const correct=Object.fromEntries([...Object.entries(c.expected).map(([k,v])=>[k,v]),...c.fields.filter(f=>f.type==='textarea').map(f=>[f.id,'Sebagai staf, saya ingin mengecek jadwal agar tidak terjadi benturan pemesanan.'])]);mockApi.saveDraft(c.id,correct);mockApi.submitTask(c.id);if(c.number===1){const inProgress=visit('dashboard');assert.match(inProgress,/1 dari 3 tugas selesai/);assert.match(inProgress,/href="#\/workspace\/userstory"[^>]*>Lanjutkan Simulasi/);const page=visit('progress');assert.match(page,/1 dari 3 tugas selesai/);assert.match(page,/33%/);assert.match(page,/href="#\/workspace\/userstory"[^>]*>Lanjutkan Simulasi/);}if(c.number===2){const page=visit('progress');assert.match(page,/2 dari 3 tugas selesai/);assert.match(page,/67%/);assert.match(page,/Requirement Validation/);}}
  assert.match(visit('progress'),/3 dari 3 tugas selesai/);assert.match(app.innerHTML,/100%/);assert.match(app.innerHTML,/href="#\/report\//);assert.match(app.innerHTML,/Lihat Hasil/);assert.doesNotMatch(app.innerHTML,/Lanjutkan Simulasi/);
  assert.match(selectProgressFilter('in-progress'),/Tidak ada simulasi yang sedang berlangsung/);
  assert.match(selectProgressFilter('completed'),/100%/);
  assert.match(selectProgressFilter('all'),/100%/);
  const complete=visit('dashboard');assert.match(complete,/Simulasi terakhirmu sudah selesai/);assert.doesNotMatch(complete,/Sedang Berlangsung/);assert.match(complete,/Laporan Kinerja/);assert.match(complete,/Portofolio/);assert.match(complete,/Sertifikat/);
  const finished=visit('workspace/requirements');assert.match(finished,/Hasil tugas/);assert.doesNotMatch(visibleCopy(finished),/\b(?:V1|V2|Revisi)\b/i);
  const report=visit('report');assert.match(report,/Hasil kerja/);assert.doesNotMatch(visibleCopy(report),/\b(?:V1|V2|Revisi)\b/i);
  const portfolio=visit('portfolio');assert.match(portfolio,/Dokumen hasil kerja/);assert.doesNotMatch(visibleCopy(portfolio),/\b(?:V1|V2|Revisi)\b/i);
  const certificate=visit('certificate');assert.match(certificate,/CERTIFICATE OF COMPLETION/);assert.doesNotMatch(visibleCopy(certificate),/\b(?:V1|V2|Revisi)\b/i);
  const finishedId=mockApi.getActive().id;mockApi.newAttempt();
  const resumed=visit('dashboard');assert.match(resumed,/Sedang Berlangsung/);assert.match(resumed,new RegExp(`href="#/report/${finishedId}"`));
  assert.match(visit('report/'+finishedId),/Hasil kerja/);
  assert.match(visit('portfolio/'+finishedId),/Dokumen hasil kerja/);
  assert.match(visit('certificate/'+finishedId),/CERTIFICATE OF COMPLETION/);
});
