// ═══════════════════════════════════════════════════
// SERVICES/AUTH.JS — Gestion token JWT + appels auth
// ═══════════════════════════════════════════════════
import axios from 'axios';

const API_BASE = '/api';

// ── Clés de stockage ─────────────────────────────────────────────────────────
const TOKEN_KEY    = 'lw_ai_token';
const USER_KEY     = 'lw_ai_user';
const LOGIN_DATE_KEY = 'lw_ai_login_date';

// ── Durée de session : 30 jours en millisecondes ─────────────────────────────
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// ── Sauvegarder la session ───────────────────────────────────────────────────
export const saveSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY,     token);
  localStorage.setItem(USER_KEY,      JSON.stringify(user));
  localStorage.setItem(LOGIN_DATE_KEY, Date.now().toString());
};

// ── Récupérer le token ───────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem(TOKEN_KEY);

// ── Récupérer l'utilisateur courant ─────────────────────────────────────────
export const getCurrentUser = () => {
  const u = localStorage.getItem(USER_KEY);
  return u ? JSON.parse(u) : null;
};

// ── Vérifier si la session est encore valide (< 30 jours) ───────────────────
export const isSessionValid = () => {
  const token     = getToken();
  const loginDate = localStorage.getItem(LOGIN_DATE_KEY);
  if (!token || !loginDate) return false;
  const elapsed = Date.now() - parseInt(loginDate);
  return elapsed < SESSION_DURATION_MS;
};

// ── Supprimer la session (déconnexion) ───────────────────────────────────────
export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LOGIN_DATE_KEY);
};

// ── Appel API : Inscription ──────────────────────────────────────────────────
export const register = async (formData) => {
  const res = await axios.post(`${API_BASE}/auth/register`, formData);
  return res.data;
};

// ── Appel API : Connexion ────────────────────────────────────────────────────
export const login = async (email, password) => {
  const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
  return res.data;
};

// ── Header Authorization pour les requêtes protégées ─────────────────────────
export const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};