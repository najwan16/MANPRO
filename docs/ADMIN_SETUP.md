# Setup akses admin

Admin masuk menggunakan halaman autentikasi Supabase yang sama dengan pelamar. Role admin tidak dapat dipilih saat registrasi; pemilik project harus memberikan role secara manual.

## Memberikan akses admin

1. Buat akun melalui registrasi aplikasi dan selesaikan verifikasi email.
2. Buka Supabase SQL Editor sebagai pemilik project, lalu jalankan query berikut dengan email admin yang sudah diverifikasi:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('admin@contoh.com')
  and email_confirmed_at is not null
on conflict (user_id) do nothing;
```

3. Keluar lalu masuk kembali. Menu **Admin** akan muncul jika role terdeteksi.
4. Akses `#/admin` langsung juga dilindungi pemeriksaan role, sedangkan hak baca/tulis katalog ditegakkan ulang oleh Supabase RLS.

Untuk mencabut akses:

```sql
delete from public.admin_users
where user_id = (select id from auth.users where lower(email) = lower('admin@contoh.com'));
```

Jangan pernah memberi akses admin melalui `user_metadata` atau dari form registrasi pengguna.

## Pengelolaan katalog

Admin dapat membuat/memperbarui data perusahaan, mengedit simulasi, tugas, harga, dan status publikasi. Definisi tugas harus mengikuti struktur `fields`, `expected`, `weights`, dan `feedback` yang digunakan renderer serta rubric penilaian. Status `ready` membuat simulasi tampil di katalog pelamar. Menghapus tugas yang sudah dipakai submission akan ditolak oleh foreign key; arsipkan simulasi jika hendak menghentikan akses tanpa merusak riwayat.
