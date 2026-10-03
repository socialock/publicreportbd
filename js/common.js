// Common helpers for all pages
const API_BASE = ""; // same-origin

function getToken() {
  return localStorage.getItem("session_token");
}

function setToken(t) {
  if (t) localStorage.setItem("session_token", t);
  else localStorage.removeItem("session_token");
}

function setUser(u) {
  if (u) localStorage.setItem("user", JSON.stringify(u));
  else localStorage.removeItem("user");
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(API_BASE + path, {
    ...options,
    headers,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg = (data && data.error) || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "এইমাত্র";
  if (diff < 3600) return Math.floor(diff / 60) + " মিনিট আগে";
  if (diff < 86400) return Math.floor(diff / 3600) + " ঘণ্টা আগে";
  if (diff < 2592000) return Math.floor(diff / 86400) + " দিন আগে";
  return formatDate(iso);
}

function policeStatusLabel(s) {
  return {
    unknown: "মামলার তথ্য জানা নেই",
    filed: "মামলা হয়েছে",
    not_filed: "মামলা নেয়নি",
    investigating: "তদন্ত চলছে",
  }[s] || "জানা নেই";
}

async function updateAuthUI() {
  // Update navbar and bottom nav based on user
  const user = getUser();
  const navAuth = document.getElementById("navAuth");
  const bottomAuth = document.getElementById("bottomAuth");

  if (user) {
    if (navAuth) {
      navAuth.innerHTML = `<i class="fa-solid fa-user"></i> ${escapeHtml(user.username)}`;
      navAuth.href = "#";
      navAuth.onclick = async (e) => {
        e.preventDefault();
        if (confirm("লগআউট করবেন?")) {
          try {
            await apiFetch("/api/auth/logout", { method: "POST" });
          } catch {}
          setToken(null);
          setUser(null);
          location.reload();
        }
      };
    }
    if (bottomAuth) {
      bottomAuth.innerHTML = `<i class="fa-solid fa-user"></i><span>${escapeHtml(user.username).slice(0, 8)}</span>`;
      bottomAuth.href = "#";
      bottomAuth.onclick = (e) => {
        e.preventDefault();
        if (confirm("লগআউট করবেন?")) {
          apiFetch("/api/auth/logout", { method: "POST" }).finally(() => {
            setToken(null);
            setUser(null);
            location.reload();
          });
        }
      };
    }
  } else {
    if (navAuth) navAuth.href = "/auth.html";
    if (bottomAuth) bottomAuth.href = "/auth.html";
  }
}

function requireLoginOrRedirect() {
  if (!getToken()) {
    location.href = "/auth.html?next=" + encodeURIComponent(location.pathname + location.search);
    return false;
  }
  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});