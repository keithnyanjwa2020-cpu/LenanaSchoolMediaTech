const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'localdb.json');

// Initialize database file
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      posts: [],
      assignments: [],
      projects: [],
      adminRequests: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
}

function readDB() {
  initDB();
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// User operations
function findUser(query) {
  const db = readDB();
  return db.users.find(u => {
    for (const key in query) {
      if (u[key] !== query[key]) return false;
    }
    return true;
  });
}

function findUserById(id) {
  const db = readDB();
  return db.users.find(u => u._id === id);
}

function createUser(userData) {
  const db = readDB();
  const user = {
    _id: 'user_' + Date.now(),
    ...userData,
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  writeDB(db);
  return user;
}

function updateUser(id, updates) {
  const db = readDB();
  const idx = db.users.findIndex(u => u._id === id);
  if (idx >= 0) {
    db.users[idx] = { ...db.users[idx], ...updates };
    writeDB(db);
    return db.users[idx];
  }
  return null;
}

function deleteUser(id) {
  const db = readDB();
  db.users = db.users.filter(u => u._id !== id);
  writeDB(db);
}

// Post operations
function getAllPosts() {
  return readDB().posts;
}

function createPost(postData) {
  const db = readDB();
  const post = {
    _id: 'post_' + Date.now(),
    ...postData,
    likes: [],
    comments: [],
    createdAt: new Date().toISOString()
  };
  db.posts.push(post);
  writeDB(db);
  return post;
}

function deletePost(id) {
  const db = readDB();
  db.posts = db.posts.filter(p => p._id !== id);
  writeDB(db);
}

// Assignment operations
function getAllAssignments() {
  return readDB().assignments;
}

function createAssignment(assignmentData) {
  const db = readDB();
  const assignment = {
    _id: 'assignment_' + Date.now(),
    ...assignmentData,
    createdAt: new Date().toISOString()
  };
  db.assignments.push(assignment);
  writeDB(db);
  return assignment;
}

function deleteAssignment(id) {
  const db = readDB();
  db.assignments = db.assignments.filter(a => a._id !== id);
  writeDB(db);
}

// Project operations
function getAllProjects() {
  return readDB().projects;
}

function createProject(projectData) {
  const db = readDB();
  const project = {
    _id: 'project_' + Date.now(),
    ...projectData,
    createdAt: new Date().toISOString()
  };
  db.projects.push(project);
  writeDB(db);
  return project;
}

function deleteProject(id) {
  const db = readDB();
  db.projects = db.projects.filter(p => p._id !== id);
  writeDB(db);
}

// Admin request operations
function getAllAdminRequests() {
  return readDB().adminRequests;
}

function createAdminRequest(requestData) {
  const db = readDB();
  const request = {
    _id: 'request_' + Date.now(),
    ...requestData,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  db.adminRequests.push(request);
  writeDB(db);
  return request;
}

function updateAdminRequest(id, updates) {
  const db = readDB();
  const idx = db.adminRequests.findIndex(r => r._id === id);
  if (idx >= 0) {
    db.adminRequests[idx] = { ...db.adminRequests[idx], ...updates };
    writeDB(db);
    return db.adminRequests[idx];
  }
  return null;
}


// Shop items (frames, fonts, themes)
function getShopItems() {
  const data = readDB();
  if (!data.shopItems) {
    data.shopItems = [
      { _id: 'frame_gold', name: 'Gold Frame', type: 'frame', price: 100, icon: '🏆', animation: 'spin 4s linear infinite', border: '3px solid gold', glow: '0 0 20px gold' },
      { _id: 'frame_rainbow', name: 'Rainbow Frame', type: 'frame', price: 250, icon: '🌈', animation: 'rainbow 3s linear infinite', border: '3px solid transparent', glow: '0 0 30px rainbow' },
      { _id: 'frame_fire', name: 'Fire Frame', type: 'frame', price: 500, icon: '🔥', animation: 'pulse 1s ease-in-out infinite', border: '3px solid orange', glow: '0 0 25px red' },
      { _id: 'frame_neon', name: 'Neon Frame', type: 'frame', price: 750, icon: '✨', animation: 'glow 2s ease-in-out infinite', border: '3px solid cyan', glow: '0 0 30px cyan' },
      { _id: 'frame_legendary', name: 'Legendary Frame', type: 'frame', price: 2000, icon: '👑', animation: 'legendary 5s ease-in-out infinite', border: '4px solid linear-gradient(45deg, gold, purple)', glow: '0 0 40px gold' },
      { _id: 'font_cool', name: 'Cool Font', type: 'font', price: 50, icon: '🔤', fontFamily: '"Inter", sans-serif' },
      { _id: 'font_fancy', name: 'Fancy Font', type: 'font', price: 100, icon: '✒️', fontFamily: '"Georgia", serif' },
      { _id: 'font_mono', name: 'Hacker Font', type: 'font', price: 150, icon: '💻', fontFamily: '"Courier New", monospace' },
      { _id: 'font_cute', name: 'Cute Font', type: 'font', price: 200, icon: '🎀', fontFamily: '"Comic Sans MS", cursive' },
      { _id: 'theme_ocean', name: 'Ocean Theme', type: 'theme', price: 300, icon: '🌊', colors: { bg: '#001a33', accent: '#00d4ff' } },
      { _id: 'theme_sunset', name: 'Sunset Theme', type: 'theme', price: 300, icon: '🌅', colors: { bg: '#2d1b4e', accent: '#ff6b35' } },
    ];
    writeDB(data);
  }
  return data.shopItems;
}

function getUserInventory(userId) {
  const data = readDB();
  if (!data.inventory) data.inventory = {};
  if (!data.inventory[userId]) data.inventory[userId] = { frames: [], fonts: [], themes: ['default'], activeFrame: null, activeFont: null, activeTheme: 'default' };
  return data.inventory[userId];
}

function purchaseItem(userId, itemId) {
  const data = readDB();

  // Initialize shop items if not present
  if (!data.shopItems || data.shopItems.length === 0) {
    data.shopItems = [
      { _id: 'frame_gold', name: 'Gold Frame', type: 'frame', price: 100, icon: '🏆', animation: 'spin 4s linear infinite', border: '3px solid gold', glow: '0 0 20px gold' },
      { _id: 'frame_rainbow', name: 'Rainbow Frame', type: 'frame', price: 250, icon: '🌈', animation: 'rainbow 3s linear infinite', border: '3px solid transparent', glow: '0 0 30px rainbow' },
      { _id: 'frame_fire', name: 'Fire Frame', type: 'frame', price: 500, icon: '🔥', animation: 'pulse 1s ease-in-out infinite', border: '3px solid orange', glow: '0 0 25px red' },
      { _id: 'frame_neon', name: 'Neon Frame', type: 'frame', price: 750, icon: '✨', animation: 'glow 2s ease-in-out infinite', border: '3px solid cyan', glow: '0 0 30px cyan' },
      { _id: 'frame_legendary', name: 'Legendary Frame', type: 'frame', price: 2000, icon: '👑', animation: 'legendary 5s ease-in-out infinite', border: '4px solid linear-gradient(45deg, gold, purple)', glow: '0 0 40px gold' },
      { _id: 'font_cool', name: 'Cool Font', type: 'font', price: 50, icon: '🔤', fontFamily: '"Inter", sans-serif' },
      { _id: 'font_fancy', name: 'Fancy Font', type: 'font', price: 100, icon: '✒️', fontFamily: '"Georgia", serif' },
      { _id: 'font_mono', name: 'Hacker Font', type: 'font', price: 150, icon: '💻', fontFamily: '"Courier New", monospace' },
      { _id: 'font_cute', name: 'Cute Font', type: 'font', price: 200, icon: '🎀', fontFamily: '"Comic Sans MS", cursive' },
      { _id: 'theme_ocean', name: 'Ocean Theme', type: 'theme', price: 300, icon: '🌊', colors: { bg: '#001a33', accent: '#00d4ff' } },
      { _id: 'theme_sunset', name: 'Sunset Theme', type: 'theme', price: 300, icon: '🌅', colors: { bg: '#2d1b4e', accent: '#ff6b35' } },
    ];
  }

  // Find user by _id or username (case insensitive)
  let user = data.users.find(u => u._id === userId);
  if (!user) {
    user = data.users.find(u => u.username && u.username.toLowerCase() === String(userId).toLowerCase());
  }
  if (!user) {
    console.log('Purchase debug - userId:', userId, 'type:', typeof userId);
    console.log('Available users:', data.users.map(u => ({ _id: u._id, username: u.username, name: u.name })));
    return { error: 'User not found. Your ID: ' + userId + '. Available: ' + data.users.map(u => u.username || u._id).join(', ') };
  }

  const item = data.shopItems.find(i => i._id === itemId);
  if (!item) return { error: 'Item not found. Available: ' + data.shopItems.map(i => i._id).join(', ') };
  if ((user.points || 0) < item.price) return { error: 'Not enough points' };

  const inv = getUserInventory(user._id);
  if (item.type === 'frame' && inv.frames.includes(itemId)) return { error: 'Already owned' };
  if (item.type === 'font' && inv.fonts.includes(itemId)) return { error: 'Already owned' };
  if (item.type === 'theme' && inv.themes.includes(itemId)) return { error: 'Already owned' };

  user.points = (user.points || 0) - item.price;
  if (item.type === 'frame') inv.frames.push(itemId);
  if (item.type === 'font') inv.fonts.push(itemId);
  if (item.type === 'theme') inv.themes.push(itemId);

  writeDB(data);
  return { success: true, item, remainingPoints: user.points };
}

function equipItem(userId, itemId, slot) {
  const data = readDB();
  // Try _id first, then username
  let user = data.users.find(u => u._id === userId);
  if (!user) {
    user = data.users.find(u => u.username && u.username.toLowerCase() === String(userId).toLowerCase());
  }
  if (!user) return { error: 'User not found' };

  const inv = getUserInventory(user._id);
  if (slot === 'frame' && inv.frames.includes(itemId)) inv.activeFrame = itemId;
  if (slot === 'font' && inv.fonts.includes(itemId)) inv.activeFont = itemId;
  if (slot === 'theme' && inv.themes.includes(itemId)) inv.activeTheme = itemId;
  writeDB(data);
  return { success: true };
}

function giftPoints(fromId, toIdOrUsername, amount) {
  const data = readDB();
  // Try _id first, then username
  let toUser = data.users.find(u => u._id === toIdOrUsername);
  if (!toUser) {
    toUser = data.users.find(u => u.username === toIdOrUsername.toLowerCase());
  }
  if (!toUser) return { error: 'User not found' };
  if (amount <= 0) return { error: 'Invalid amount' };
  if (amount > 1000000) return { error: 'Max gift is 1,000,000 points' };

  toUser.points = (toUser.points || 0) + amount;
  writeDB(data);
  return { success: true, toUser: toUser.name, newPoints: toUser.points };
}

module.exports = {
  findUser, findUserById, createUser, updateUser, deleteUser,
  getAllPosts, createPost, deletePost,
  getAllAssignments, createAssignment, deleteAssignment,
  getAllProjects, createProject, deleteProject,
  getAllAdminRequests, createAdminRequest, updateAdminRequest,
  readDB, writeDB,
  getShopItems, getUserInventory, purchaseItem, equipItem, giftPoints
};
