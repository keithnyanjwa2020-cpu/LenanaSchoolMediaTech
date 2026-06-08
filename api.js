// Media Core Hub - API Client
// Change this to your deployed API URL
const API_BASE_URL = (() => {
  // Auto-detect: if on localhost, use localhost:3000
  // If deployed, use the same domain
  const saved = localStorage.getItem('mch_api_url');
  if (saved) return saved;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }
  return window.location.origin + '/api';
})();

// Store token
function getToken() { return localStorage.getItem('mch_token') || ''; }
function setToken(token) { localStorage.setItem('mch_token', token); }
function removeToken() { localStorage.removeItem('mch_token'); }

// Store user
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
  if (user) {
    user.theme = theme;
    setUser(user);
  }
}

// API request helper
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error (${endpoint}):`, err.message);
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

// Posts API (Ideas)
const PostsAPI = {
  getAll: () => apiRequest('/posts'),
  getOne: (id) => apiRequest(`/posts/${id}`),
  create: (data) => apiRequest('/posts', { method: 'POST', body: data }),
  delete: (id) => apiRequest(`/posts/${id}`, { method: 'DELETE' }),
  like: (id) => apiRequest(`/posts/${id}/like`, { method: 'POST' }),
  comment: (id, text) => apiRequest(`/posts/${id}/comments`, { method: 'POST', body: { text } })
};

// Assignments API
const AssignmentsAPI = {
  getAll: () => apiRequest('/assignments'),
  create: (data) => apiRequest('/assignments', { method: 'POST', body: data }),
  delete: (id) => apiRequest(`/assignments/${id}`, { method: 'DELETE' })
};

// Projects API
const ProjectsAPI = {
  getAll: () => apiRequest('/projects'),
  create: (data) => apiRequest('/projects', { method: 'POST', body: data }),
  delete: (id) => apiRequest(`/projects/${id}`, { method: 'DELETE' })
};

// Users API (Leaderboard)
const UsersAPI = {
  getAll: () => apiRequest('/users'),
  getOne: (username) => apiRequest(`/users/${username}`)
};

// Admin API
const AdminAPI = {
  requestAdmin: (data) => apiRequest('/admin/request', { method: 'POST', body: data }),
  getRequests: () => apiRequest('/admin/requests'),
  approveRequest: (id, action) => apiRequest(`/admin/requests/${id}`, { method: 'PUT', body: { action } }),
  getUsers: () => apiRequest('/admin/users'),
  deleteUser: (id) => apiRequest(`/admin/users/${id}`, { method: 'DELETE' })
};

// Activity API
const ActivityAPI = {
  getAll: () => apiRequest('/activity')
};

// Upload API (REAL file uploads)
const UploadAPI = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    });
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  },
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/upload/avatar`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    });
    if (!response.ok) throw new Error('Avatar upload failed');
    return response.json();
  }
};

// Check if user is admin
function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

// Check if logged in
function isLoggedIn() {
  return !!getToken() && !!getUser();
}

// Logout
function logout() {
  removeToken();
  removeUser();
  window.location.href = 'index.html';
}

// Export for global use
window.API = { AuthAPI, PostsAPI, AssignmentsAPI, ProjectsAPI, UsersAPI, AdminAPI, UploadAPI, ActivityAPI };
window.getToken = getToken;
window.getUser = getUser;
window.setUser = setUser;
window.isAdmin = isAdmin;
window.isLoggedIn = isLoggedIn;
window.logout = logout;
window.apiRequest = apiRequest;
window.getTheme = getTheme;
window.setTheme = setTheme;
