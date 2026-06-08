// Media Core Hub - API Client
const API_BASE_URL = (() => {
  const saved = localStorage.getItem('mch_api_url');
  if (saved) return saved;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }
  return window.location.origin + '/api';
})();

// Token management
function getToken() { return localStorage.getItem('mch_token') || ''; }
function setToken(token) { localStorage.setItem('mch_token', token); }
function removeToken() { localStorage.removeItem('mch_token'); }

// User management
function getUser() {
  try { const u = localStorage.getItem('mch_user'); return u ? JSON.parse(u) : null; }
  catch { return null; }
}
function setUser(user) { localStorage.setItem('mch_user', JSON.stringify(user)); }
function removeUser() { localStorage.removeItem('mch_user'); }

// Theme
function getTheme() {
  const user = getUser();
  return user?.theme || localStorage.getItem('mch_theme') || 'dark';
}
function setTheme(theme) {
  localStorage.setItem('mch_theme', theme);
  document.body.setAttribute('data-theme', theme);
  const user = getUser();
  if (user) { user.theme = theme; setUser(user); }
}

// API request helper
async function apiRequest(endpoint, options = {}) {
  const url = API_BASE_URL + endpoint;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'HTTP ' + response.status);
    return data;
  } catch (err) {
    console.error('API Error (' + endpoint + '):', err.message);
    throw err;
  }
}

// Auth API
const AuthAPI = {
  register: (data) => apiRequest('/auth/register', { method: 'POST', body: data }),
  login: (data) => apiRequest('/auth/login', { method: 'POST', body: data }),
  me: () => apiRequest('/auth/me'),
  updateProfile: (data) => apiRequest('/auth/profile', { method: 'PUT', body: data }),
  changePassword: (data) => apiRequest('/auth/password', { method: 'PUT', body: data })
};

// Posts API
const PostsAPI = {
  getAll: () => apiRequest('/posts'),
  create: (data) => apiRequest('/posts', { method: 'POST', body: data }),
  delete: (id) => apiRequest('/posts/' + id, { method: 'DELETE' }),
  like: (id) => apiRequest('/posts/' + id + '/like', { method: 'POST' }),
  comment: (id, text) => apiRequest('/posts/' + id + '/comments', { method: 'POST', body: { text } })
};

// Assignments API
const AssignmentsAPI = {
  getAll: () => apiRequest('/assignments'),
  create: (data) => apiRequest('/assignments', { method: 'POST', body: data }),
  delete: (id) => apiRequest('/assignments/' + id, { method: 'DELETE' })
};

// Projects API
const ProjectsAPI = {
  getAll: () => apiRequest('/projects'),
  create: (data) => apiRequest('/projects', { method: 'POST', body: data }),
  delete: (id) => apiRequest('/projects/' + id, { method: 'DELETE' })
};

// Users API
const UsersAPI = {
  getAll: () => apiRequest('/users')
};

// Admin API
const AdminAPI = {
  requestAdmin: (data) => apiRequest('/admin/request', { method: 'POST', body: data }),
  getRequests: () => apiRequest('/admin/requests'),
  approveRequest: (id, action) => apiRequest('/admin/requests/' + id, { method: 'PUT', body: { action } }),
  getUsers: () => apiRequest('/admin/users'),
  deleteUser: (id) => apiRequest('/admin/users/' + id, { method: 'DELETE' }),
  giftPoints: (username, amount) => apiRequest('/admin/gift', { method: 'POST', body: { username, amount } })
};

// Shop API
const ShopAPI = {
  getItems: () => apiRequest('/shop'),
  getInventory: () => apiRequest('/inventory'),
  purchase: (itemId) => apiRequest('/shop/purchase', { method: 'POST', body: { itemId } }),
  equip: (itemId, slot) => apiRequest('/shop/equip', { method: 'POST', body: { itemId, slot } })
};

// Daily Rewards & Achievements
const RewardsAPI = {
  getDaily: () => apiRequest('/daily-reward'),
  getAchievements: () => apiRequest('/achievements'),
  checkAchievements: () => apiRequest('/achievements/check', { method: 'POST' })
};

// Glassmorphism Settings
const SettingsAPI = {
  updateGlass: (data) => apiRequest('/settings/glass', { method: 'PUT', body: data })
};

// Activity & Error Logs
const ActivityAPI = {
  getAll: () => apiRequest('/activity')
};

// Upload API
const UploadAPI = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(API_BASE_URL + '/upload', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + getToken() },
      body: formData
    });
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  },
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(API_BASE_URL + '/upload/avatar', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + getToken() },
      body: formData
    });
    if (!response.ok) throw new Error('Avatar upload failed');
    return response.json();
  },
  uploadBanner: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(API_BASE_URL + '/upload/banner', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + getToken() },
      body: formData
    });
    if (!response.ok) throw new Error('Banner upload failed');
    return response.json();
  }
};

// Auth helpers
function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}
function isLoggedIn() {
  return !!getToken() && !!getUser();
}
function logout() {
  removeToken();
  removeUser();
  window.location.href = 'index.html';
}

// Export for global use

// ============================================
// ERROR LOG SYSTEM
// ============================================

var errorLog = [];
var maxErrors = 50;

function captureError(msg, source, line, col, err) {
  var timestamp = new Date().toLocaleTimeString();
  var entry = {
    time: timestamp,
    message: msg,
    source: source || '',
    line: line || 0,
    stack: err && err.stack ? err.stack.split('
').slice(0, 3).join('
') : ''
  };
  errorLog.push(entry);
  if (errorLog.length > maxErrors) errorLog.shift();

  // Also try to send to server
  try {
    fetch(API_BASE_URL + '/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    }).catch(function(){});
  } catch(e) {}
}

function getErrorLog() {
  return errorLog.map(function(e) {
    return '[' + e.time + '] ' + e.message + 
           (e.source ? ' at ' + e.source + ':' + e.line : '') +
           (e.stack ? '
' + e.stack : '');
  }).join('

');
}

function clearErrorLog() {
  errorLog = [];
}

function showErrorLog() {
  var log = getErrorLog();
  if (!log) return 'No errors captured yet.';
  return log;
}

// Auto-capture errors
window.onerror = function(msg, url, line, col, err) {
  captureError(msg, url, line, col, err);
  return false;
};

window.addEventListener('error', function(e) {
  captureError(e.message, e.filename, e.lineno, e.colno, e.error);
});

window.addEventListener('unhandledrejection', function(e) {
  captureError('Promise rejected: ' + e.reason, '', 0, 0, e.reason);
});

// Capture fetch errors
var originalFetch = window.fetch;
window.fetch = function() {
  return originalFetch.apply(this, arguments).catch(function(err) {
    captureError('Fetch failed: ' + err.message, arguments[0], 0, 0, err);
    throw err;
  });
};


window.API = { AuthAPI, PostsAPI, AssignmentsAPI, ProjectsAPI, UsersAPI, AdminAPI, ShopAPI, RewardsAPI, SettingsAPI, ActivityAPI, UploadAPI };
window.getErrorLog = getErrorLog;
window.clearErrorLog = clearErrorLog;
window.showErrorLog = showErrorLog;
window.captureError = captureError;
window.getToken = getToken;
window.getUser = getUser;
window.setUser = setUser;
window.isAdmin = isAdmin;
window.isLoggedIn = isLoggedIn;
window.logout = logout;
window.apiRequest = apiRequest;
window.getTheme = getTheme;
window.setTheme = setTheme;