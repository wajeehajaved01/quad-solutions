// ── Config ──────────────────────────────────────────────────
const API = 'https://quad-solutions-production.up.railway.app/';  // Change to deployed URL later

// ── Token helpers ────────────────────────────────────────────
const getToken = () => localStorage.getItem('token');
const getUser = () => JSON.parse(localStorage.getItem('user') || 'null');
const isAdmin = () => getUser()?.role === 'admin';
const isLoggedIn = () => !!getToken();

function saveAuth(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify({ _id: data._id, name: data.name, email: data.email, role: data.role }));
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '../pages/login.html';
}

// ── Core fetch wrapper ───────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

// ── Auth ─────────────────────────────────────────────────────
const authAPI = {
  register: (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => apiFetch('/auth/me'),
};

// ── Client requests ──────────────────────────────────────────
const requestsAPI = {
  submit: (body) => apiFetch('/requests', { method: 'POST', body: JSON.stringify(body) }),
  getAll: () => apiFetch('/requests'),
  getOne: (id) => apiFetch(`/requests/${id}`),
};

// ── Admin ────────────────────────────────────────────────────
const adminAPI = {
  stats: () => apiFetch('/admin/stats'),
  clients: () => apiFetch('/admin/clients'),
  allRequests: () => apiFetch('/admin/requests'),
  getRequest: (id) => apiFetch(`/admin/requests/${id}`),
  updateStatus: (id, body) => apiFetch(`/admin/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteRequest: (id) => apiFetch(`/admin/requests/${id}`, { method: 'DELETE' }),
};

// ── UI helpers ───────────────────────────────────────────────
function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `alert ${type} show`;
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.className = 'alert';
}

function statusBadge(status) {
  return `<span class="badge-status badge-${status}">${status.replace('_', ' ')}</span>`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Route guards ─────────────────────────────────────────────
function requireLogin() {
  if (!isLoggedIn()) window.location.href = 'login.html';
}
function requireAdmin() {
  if (!isLoggedIn() || !isAdmin()) window.location.href = 'login.html';
}
