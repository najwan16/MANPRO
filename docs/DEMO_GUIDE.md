# Investor Demo Guide — 7 Minutes

## Preparation

- Start app: `npm run demo`; open `http://localhost:4173/#/home`.
- Use Chrome/Edge normal profile, no private data. For clean demo, reset from Dashboard or clear localStorage key `simagang:v3:demo`.
- Have a role persona: "Saya Andi, mahasiswa yang ingin magang sebagai System Analyst."
- All brands/companies/payments are fictional. Do not state a real investor paid.

## Timeline

**00:00–00:45** Hero: "Mahasiswa tidak tahu apakah mampu mengerjakan tugas posisi yang dituju." Open Free Task.

**00:45–01:45** Select (intentionally wrong) "warna biru", "prioritas rendah", "warna UI". Submit. Show low score and why decisions are inappropriate. If you instead choose correct, the UI correctly shows full score.

**01:45–02:20** Show free report (no hidden paywall). Scroll to **contoh artefak awal vs revisi**; explain example is illustrative and output real is created after payment.

**02:20–03:00** Open checkout → demo login `Andi Demo` / `andi@example.com` → click demo QRIS → **Aktifkan Akses Demo**. Point out visible "Tidak ada transaksi nyata" warning.

**03:00–04:15** Welcome Project Manager → Task 1: intentionally choose some wrong classifications and write a short analyst memo (≥25 characters); submit V1; read rubric; revise selections and submit V2. Show side-by-side actual Requirements Register. Export draft if desired.

**04:15–05:45** Task 2: fill actor `Staf`, action `melihat ketersediaan`, benefit `menghindari benturan`, AC `availability` & `overlap`; type a full original user story in the provided textarea (≥30 characters; stored but not auto-scored); first V1 can use one wrong structured selection to demonstrate feedback. Task 3: clarify requirement ambiguity and change management, then write one stakeholder question (≥25 characters). Submit V1 and V2 for both.

**05:45–06:45** Open Performance Report → Portfolio side-by-side → download Markdown → Certificate Demo (only if score >=70).

**06:45–07:00** Wrap up: "Kami tidak menjual sertifikat; kami menjual satu paket praktik, feedback, revisi dan bukti latihan. Harga Rp19k dan manfaat karier perlu diuji pasar."

## Investor objections and grounded replies

- **Rakamin already exists:** "SiMagang mencoba fokus pada bukti hasil revisi untuk target posisi; ini belum kompetitif terbukti, kami menguji kebutuhan spesifik."
- **Free alternatives:** "Kami tidak menutupi feedback gratis. Produk berbayar memberi tiga artefak saling terhubung dan latihan revisi; keputusan membeli pengguna nyata belum tervalidasi."
- **Validity:** "Scoring dibuat deterministik dari keputusan terstruktur, bukan AI yang mengklaim mengerti semua dokumen. Validasi industri diperlukan."
- **Revenue:** "Checkout demo menguji alur, bukan transaksi. Berikutnya perlu price sensitivity test dan eksperimen pembayaran nyata yang aman."
