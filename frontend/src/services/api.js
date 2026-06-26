// ═══════════════════════════════════════════════════
// SERVICES/API.JS — Appels HTTP vers FastAPI
// ═══════════════════════════════════════════════════
import axios from 'axios';
import { getToken, clearSession } from './auth';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// ← NOUVEAU : Intercepteur — ajoute automatiquement le token JWT
// à chaque requête sortante
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ← NOUVEAU : Intercepteur — gère les erreurs 401 (token expiré ou invalide)
// L'utilisateur est automatiquement déconnecté et redirigé vers /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Upload CSV
export const uploadDataset = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// Lancer AutoML
export const runAutoML = async (config) => {
  const res = await api.post('/run-automl', config);
  return res.data;
};

// Statut tâche
export const getStatus = async (taskId) => {
  const res = await api.get(`/status/${taskId}`);
  return res.data;
};

// Résultats
export const getResults = async (experimentId) => {
  const res = await api.get(`/results/${experimentId}`);
  return res.data;
};

// Liste expériences
export const listExperiments = async () => {
  const res = await api.get('/experiments');
  return res.data;
};

// Résumé
export const getSummary = async () => {
  const res = await api.get('/experiments/summary');
  return res.data;
};

// Prédiction sur de nouvelles données
export const predict = async (experimentId, values) => {
  const res = await api.post('/predict', {
    experiment_id: experimentId,
    values: values,
  });
  return res.data;
};

// URL téléchargement modèle
export const getDownloadUrl = (experimentId) =>
  `/api/download/${experimentId}/model`;

export default api; 