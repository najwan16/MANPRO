import { ico } from "./ui.js";
import { esc, initials, displayName, avatarTone } from "../utils/helpers.js";

function profileMenu(s) {
  return `<details class="profile-menu"><summary aria-label="Profil ${esc(s.user.name)}"><span class="profile-avatar tone-${avatarTone(s.user)}">${esc(initials(displayName(s.user)))}</span><span class="profile-name">${esc(displayName(s.user))}</span>${ico("chevron")}</summary><div class="profile-popover"><div class="profile-heading"><span class="profile-avatar profile-avatar-large tone-${avatarTone(s.user)}">${esc(initials(displayName(s.user)))}</span><span><b>${esc(s.user.name)}</b><small>${esc(s.user.email)}</small></span></div><a href="#/profile">${ico("user")} Profil saya</a><button type="button" data-act="logout">${ico("logout")} Keluar</button></div></details>`;
}

export function Navbar(active, s) {
  const landing = active === "home" || active === "dashboard";
  return `<header class="header"><div class="container nav-wrap"><a class="brand" href="#/dashboard" aria-label="SiMagang, buka Dashboard"><span class="brand-icon">${ico("briefcase")}</span><span>Si<span class="brand-accent">Magang</span></span><span class="brand-dot"></span></a><nav class="nav-links" aria-label="Navigasi utama"><a href="#/dashboard" ${landing ? 'aria-current="page"' : ""}>Dashboard</a><a href="#/explore" ${active === "explore" ? 'aria-current="page"' : ""}>Eksplorasi</a><a href="#/progress" ${active === "progress" ? 'aria-current="page"' : ""}>Progres</a></nav><div class="nav-actions">${s.user ? profileMenu(s) : `<a class="btn btn-ghost btn-sm" href="#/auth">Masuk</a>`}<button class="menu-toggle" data-act="toggle-menu" aria-label="Buka menu" aria-expanded="false">${ico("menu")}</button></div></div><div class="mobile-links" id="mobile-nav" hidden><a href="#/dashboard">Dashboard</a><a href="#/explore">Eksplorasi</a><a href="#/progress">Progres</a></div></header>`;
}