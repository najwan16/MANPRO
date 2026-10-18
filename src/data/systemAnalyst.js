// Definisi konten dan jawaban rujukan ini untuk demo deterministic scoring; dalam produksi bersifat server-side.
export const freeTask = {
  title:'Identifikasi masalah pemesanan ruang',
  prompt:'Office Operations melaporkan: “Dua tim dapat memesan ruang rapat yang sama pada jam yang sama. Kami ingin sistem mencegah pemesanan ganda.”',
  fields:[
    {id:'requirement',label:'Kebutuhan fungsional yang paling tepat',type:'select',options:[['','Pilih tindakan sistem'],['prevent','Sistem memeriksa benturan waktu sebelum mengonfirmasi pemesanan'],['visual','Sistem menggunakan warna biru profesional'],['hardware','Sistem wajib memiliki server paling mahal']]},
    {id:'priority',label:'Prioritas kebutuhan tersebut',type:'select',options:[['','Pilih prioritas'],['high','Tinggi — menyelesaikan masalah inti'],['low','Rendah — dapat ditunda tanpa dampak'],['unknown','Tidak perlu diprioritaskan']]},
    {id:'validation',label:'Bagaimana menguji kebutuhan ini?',type:'select',options:[['','Pilih cara validasi'],['test','Coba pesan ruang yang sama pada rentang waktu tumpang tindih'],['color','Periksa konsistensi warna antarmuka'],['ignore','Tunggu keluhan baru dari pengguna']]}
  ],
  expected:{requirement:'prevent',priority:'high',validation:'test'},
  weights:{requirement:40,priority:25,validation:35},
  feedback:{requirement:'Kebutuhan fungsional perlu menjelaskan perilaku sistem yang mencegah pemesanan ganda.',priority:'Benturan jadwal merupakan masalah utama, sehingga tepat ditempatkan sebagai prioritas tinggi.',validation:'Validasi paling relevan dilakukan melalui skenario pemesanan dengan jadwal bertabrakan.'}
};
export const tasks = [
  {id:'requirements',number:1,title:'Requirement Identification',kicker:'Pahami kebutuhan bisnis',description:'Baca catatan stakeholder, lalu klasifikasikan kebutuhan dan tentukan prioritas utamanya.',deliverable:'Requirements Register',weight:30,readTime:'± 20 menit',
   briefing:'Rani meminta sistem yang bisa mencegah dua tim memesan ruang yang sama. Tim developer membutuhkan daftar kebutuhan yang dibedakan antara fungsi utama, kualitas sistem, dan permintaan di luar ruang lingkup.',
   fields:[
    {id:'req1',label:'"Staf dapat mengecek ruang yang tersedia sesuai tanggal dan jam."',type:'select',options:[['','Pilih klasifikasi'],['functional','Functional Requirement'],['nonfunctional','Non-functional Requirement'],['out','Di luar ruang lingkup']]},
    {id:'req2',label:'"Hasil pencarian ketersediaan tampil maksimal dua detik."',type:'select',options:[['','Pilih klasifikasi'],['functional','Functional Requirement'],['nonfunctional','Non-functional Requirement'],['out','Di luar ruang lingkup']]},
    {id:'req3',label:'"Aplikasi ini juga harus menghitung gaji pegawai setiap bulan."',type:'select',options:[['','Pilih klasifikasi'],['functional','Functional Requirement'],['nonfunctional','Non-functional Requirement'],['out','Di luar ruang lingkup']]},
    {id:'req4',label:'"Sistem mencegah pemesanan ruang dengan jadwal yang tumpang tindih."',type:'select',options:[['','Pilih klasifikasi'],['functional','Functional Requirement'],['nonfunctional','Non-functional Requirement'],['out','Di luar ruang lingkup']]},
    {id:'priority',label:'Kebutuhan mana yang harus diprioritaskan pada MVP?',type:'select',options:[['','Pilih fokus proyek'],['conflict','Pencegahan benturan jadwal'],['salary','Penggajian pegawai'],['style','Dekorasi dashboard']]},
    {id:'analystNote',label:'Tulis memo singkat untuk developer tentang prioritas requirement (minimal 25 karakter)',type:'textarea',placeholder:'Saya merekomendasikan ... karena ...',minlength:25,ungraded:true}
   ],
   expected:{req1:'functional',req2:'nonfunctional',req3:'out',req4:'functional',priority:'conflict'},weights:{req1:20,req2:20,req3:20,req4:20,priority:20},
   feedback:{req1:'Pencarian ruang kosong adalah perilaku yang harus disediakan sistem.',req2:'Batas dua detik merupakan atribut performa, bukan fungsi bisnis.',req3:'Penggajian berada di luar ruang lingkup booking ruang rapat.',req4:'Penolakan benturan jadwal merupakan fungsi utama yang menyelesaikan masalah.',priority:'Pencegahan benturan jadwal mengatasi masalah inti stakeholder.'}},
  {id:'userstory',number:2,title:'User Story & Acceptance Criteria',kicker:'Dokumentasikan solusi',description:'Susun user story yang spesifik lalu tentukan acceptance criteria yang dapat diuji.',deliverable:'User Story Specification',weight:40,readTime:'± 25 menit',
   briefing:'Project Manager Dina meminta user story untuk kebutuhan utama. Hindari pernyataan abstrak seperti "aplikasi lebih mudah". Kriteria penerimaan harus memungkinkan QA memverifikasi sistem.',
   fields:[
    {id:'actor',label:'Aktor utama',type:'select',options:[['','Pilih aktor'],['staff','Staf yang memesan ruang'],['visitor','Pengunjung tanpa akun'],['server','Server aplikasi']]},
    {id:'action',label:'Kebutuhan pengguna',type:'select',options:[['','Pilih tindakan'],['check','Melihat ketersediaan dan mengajukan pemesanan ruang pada waktu tertentu'],['use','Menggunakan aplikasi yang bagus'],['pay','Mengelola penggajian karyawan']]},
    {id:'benefit',label:'Manfaat bisnis',type:'select',options:[['','Pilih manfaat'],['avoid','Menghindari benturan jadwal antar tim'],['pretty','Mendapat tampilan lebih menarik'],['unrelated','Mempermudah transaksi gaji']]},
    {id:'criteria',label:'Pilih semua acceptance criteria yang relevan (pilih dua)',type:'multi',options:[['availability','Pengguna dapat melihat ketersediaan ruang berdasarkan tanggal dan jam'],['overlap','Sistem menolak pemesanan ketika rentang waktu bertabrakan'],['blue','Latar setiap halaman harus berwarna biru'],['salary','Sistem dapat mengekspor laporan penggajian']]},
    {id:'draftStory',label:'Tulis versi user story dengan kalimatmu sendiri (minimal 30 karakter)',type:'textarea',placeholder:'Sebagai staf, saya ingin ... agar ...',minlength:30,ungraded:true}
   ],
   expected:{actor:'staff',action:'check',benefit:'avoid',criteria:['availability','overlap']},weights:{actor:15,action:25,benefit:20,criteria:40},
   feedback:{actor:'User story harus mengidentifikasi aktor yang benar-benar menggunakan fungsi pemesanan.',action:'Tindakan harus spesifik dan berkaitan dengan proses peminjaman ruang.',benefit:'Nilai bisnis utamanya adalah menghindari pemesanan yang bertabrakan.',criteria:'Dua acceptance criteria inti adalah pencarian ketersediaan dan penolakan benturan jadwal. Kriteria lain tidak relevan dengan user story.'}},
  {id:'validation',number:3,title:'Requirement Validation',kicker:'Pastikan kebutuhan dapat diuji',description:'Identifikasi ambiguitas, pilih pertanyaan klarifikasi, dan tentukan perubahan yang aman.',deliverable:'Requirement Validation Log',weight:30,readTime:'± 20 menit',
   briefing:'Stakeholder memberikan kebutuhan lanjutan: "Ruang harus segera tersedia setelah dibatalkan" dan "Booking prioritas bisa melewati reservasi lain". Sebelum implementasi, kamu harus mengurangi ambiguitas.',
   fields:[
    {id:'ambiguous',label:'Apa masalah utama pada frasa "segera tersedia"?',type:'select',options:[['','Pilih analisis'],['undefined','Tidak memiliki batas waktu yang terukur'],['color','Tidak menentukan warna tombol'],['perfect','Sudah jelas dan dapat diuji']]},
    {id:'clarify',label:'Pertanyaan terbaik kepada stakeholder',type:'select',options:[['','Pilih pertanyaan'],['sla','Dalam berapa detik setelah pembatalan ruang harus dapat dipesan ulang?'],['theme','Warna latar apa yang diinginkan?'],['none','Tidak perlu klarifikasi']]},
    {id:'conflict',label:'Tindakan terhadap kebijakan booking prioritas',type:'select',options:[['','Pilih tindakan'],['rules','Minta aturan otorisasi dan penyelesaian konflik reservasi secara eksplisit'],['force','Selalu batalkan booking lama tanpa konfirmasi'],['ignore','Abaikan masukan stakeholder']]},
    {id:'accept',label:'Kondisi requirement layak disetujui',type:'select',options:[['','Pilih kondisi'],['testable','Dinyatakan jelas, dapat diuji, dan dikonfirmasi stakeholder'],['fast','Disetujui tanpa diskusi agar proyek cepat selesai'],['visual','Hanya didasarkan pada tampilan UI']]},
    {id:'change',label:'Langkah ketika ada perubahan kebutuhan baru',type:'select',options:[['','Pilih langkah'],['impact','Catat perubahan, analisis dampak, lalu ajukan persetujuan'],['overwrite','Ubah dokumen diam-diam tanpa riwayat'],['reject','Tolak seluruh perubahan otomatis']]},
    {id:'stakeholderNote',label:'Tulis satu pertanyaan klarifikasi ke stakeholder (minimal 25 karakter)',type:'textarea',placeholder:'Mohon konfirmasi berapa ...',minlength:25,ungraded:true}
   ],
   expected:{ambiguous:'undefined',clarify:'sla',conflict:'rules',accept:'testable',change:'impact'},weights:{ambiguous:20,clarify:20,conflict:20,accept:20,change:20},
   feedback:{ambiguous:'Kata "segera" belum menentukan ukuran waktu yang dapat diuji.',clarify:'Klarifikasi SLA diperlukan agar requirement mempunyai ukuran penerimaan.',conflict:'Hak prioritas perlu aturan dan otorisasi jelas sebelum memengaruhi reservasi orang lain.',accept:'Requirement yang baik harus jelas, dapat diuji, dan disepakati stakeholder.',change:'Perubahan perlu jejak persetujuan dan analisis dampak agar tidak menambah risiko.'}}
];
export const taskById=id=>tasks.find(t=>t.id===id);
export const getOptionLabel=(field,value)=>field.options.find(o=>o[0]===value)?.[1]||'Belum diisi';
