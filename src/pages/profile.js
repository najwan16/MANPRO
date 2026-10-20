import { api } from "../services/index.js";
import { ico } from "../components/ui.js";
import { esc, initials, displayName, avatarTone } from "../utils/helpers.js";
import { simulations } from "../data/catalog.js";

export function ProfilePage() {
  const user = api.state().user;
  if (!user) return `<section class="container page-pad empty-state"><h2>Masuk terlebih dahulu</h2></section>`;

  const education = [user.educationLevel, user.major, user.institution]
    .filter(Boolean)
    .join(" · ");

  return `<section class="container page-pad profile-page"><div class="eyebrow">AKUN SAYA</div><h1 class="page-title">Profil & personalisasi</h1><p class="page-intro">Lengkapi profilmu agar minat dan latar belakangmu tersimpan bersama hasil latihan.</p>
    <div class="profile-layout"><aside class="content-panel profile-preview"><span class="profile-preview-label">PRATINJAU PROFIL</span><span class="profile-avatar profile-preview-avatar tone-${avatarTone(user)}">${esc(initials(displayName(user)))}</span><h2>${esc(displayName(user))}</h2><p class="profile-preview-email">${esc(user.email)}</p>${education ? `<p class="profile-education">${esc(education)}</p>` : ""}${user.city ? `<p class="profile-city">${esc(user.city)}</p>` : ""}<span class="profile-interest">${esc(simulations.find((item) => item.id === user.interest)?.role || "Belum memilih minat")}</span>${user.bio ? `<p class="profile-bio">${esc(user.bio)}</p>` : '<p class="profile-bio profile-bio-empty">Tulis perkenalan singkat agar profilmu lebih personal.</p>'}</aside>
    <form id="profile-form" class="content-panel form-stack"><section class="profile-form-section"><div class="profile-section-heading"><h2>Informasi dasar</h2><p>Nama dan email yang digunakan pada akun ini.</p></div><div class="profile-fields"><label class="work-field"><span>Nama lengkap</span><input name="name" type="text" required minlength="2" maxlength="80" autocomplete="name" value="${esc(user.name)}"></label><label class="work-field"><span>Alamat email</span><input name="email" type="email" required autocomplete="email" value="${esc(user.email)}"></label><label class="work-field"><span>Nama panggilan <small>(opsional)</small></span><input name="nickname" type="text" maxlength="30" placeholder="Nama yang tampil di Dashboard" value="${esc(user.nickname || "")}"></label><label class="work-field"><span>Kota domisili <small>(opsional)</small></span><input name="city" type="text" maxlength="80" autocomplete="address-level2" placeholder="Contoh: Bandung" value="${esc(user.city || "")}"></label></div></section>
    <section class="profile-form-section"><div class="profile-section-heading"><h2>Pendidikan</h2><p>Tambahkan latar belakang pendidikan jika ingin ditampilkan di profil.</p></div><div class="profile-fields"><label class="work-field"><span>Nama kampus <small>(opsional)</small></span><input name="institution" type="text" maxlength="100" placeholder="Contoh: Universitas Indonesia" value="${esc(user.institution || "")}"></label><label class="work-field"><span>Program studi <small>(opsional)</small></span><input name="major" type="text" maxlength="100" placeholder="Contoh: Sistem Informasi" value="${esc(user.major || "")}"></label><label class="work-field"><span>Jenjang pendidikan <small>(opsional)</small></span><select name="educationLevel"><option value="">Pilih jenjang</option>${["D3", "D4", "S1", "S2", "S3"].map((level) => `<option value="${level}" ${user.educationLevel === level ? "selected" : ""}>${level}</option>`).join("")}</select></label></div></section>
    <section class="profile-form-section"><div class="profile-section-heading"><h2>Minat & tampilan</h2><p>Gunakan minatmu untuk menyesuaikan rekomendasi simulasi di Dashboard.</p></div><div class="profile-fields"><label class="work-field"><span>Posisi yang diminati <small>(opsional)</small></span><select name="interest"><option value="">Belum memilih posisi</option>${simulations.map((item) => `<option value="${esc(item.id)}" ${user.interest === item.id ? "selected" : ""}>${esc(item.role)}</option>`).join("")}</select></label><label class="work-field profile-field-full"><span>Perkenalan singkat <small>(opsional, maks. 240 karakter)</small></span><textarea name="bio" maxlength="240" rows="3" placeholder="Ceritakan bidang yang ingin kamu pelajari atau pengalaman yang relevan.">${esc(user.bio || "")}</textarea></label></div><fieldset class="profile-colors"><legend>Warna avatar</legend>${[
      ["navy", "Biru tua"],
      ["teal", "Hijau"],
      ["purple", "Ungu"],
    ]
      .map(
        ([color, label]) =>
          `<label><input type="radio" name="avatarColor" value="${color}" ${avatarTone(user) === color ? "checked" : ""}><span class="profile-color-swatch tone-${color}"></span>${label}</label>`,
      )
      .join("")}</fieldset></section>
    <p class="profile-help">Data profil dan progres hanya tersimpan di browser ini.</p><button class="btn btn-primary" type="submit">Simpan profil ${ico("check")}</button></form></div></section>`;
}