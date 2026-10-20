import { api } from "../services/index.js";
import { ico, A } from "../components/ui.js";

export function AuthPage(isRegister = false) {
  return `<section class="container page-pad auth-page">
    <div class="auth-card content-panel">
      <div class="eyebrow">${isRegister ? "DAFTAR AKUN" : "MASUK AKUN"}</div>
      <h1>${isRegister ? "Buat akun demo baru" : "Selamat datang kembali"}</h1>
      <p>${isRegister ? "Daftar untuk menyimpan progres dan hasil latihanmu." : "Masuk dengan akun demo untuk melanjutkan simulasi."}</p>
      
      <form id="auth-form" data-type="${isRegister ? "register" : "login"}" class="form-stack">
        ${isRegister ? `<label class="work-field"><span>Nama Lengkap</span><input name="name" type="text" required placeholder="Contoh: Alex Wijaya"></label>` : ""}
        <label class="work-field">
          <span>Alamat Email</span>
          <input name="email" type="email" required placeholder="nama@email.com">
        </label>
        <button type="submit" class="btn btn-primary btn-lg">${isRegister ? "Daftar Akun" : "Masuk"} ${ico("arrow")}</button>
      </form>
      
      <div class="auth-switch">
        ${isRegister ? `Sudah punya akun? <a href="#/auth">Masuk di sini</a>` : `Belum punya akun? <a href="#/register">Daftar di sini</a>`}
      </div>
    </div>
  </section>`;
}