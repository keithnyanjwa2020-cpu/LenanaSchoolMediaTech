const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'localdb.json');

function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('DB read error:', e);
  }
  return getDefaultDB();
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('DB write error:', e);
  }
}

function getDefaultDB() {
  return {
    users: [],
    posts: [],
    assignments: [],
    projects: [],
    adminRequests: [],
    shopItems: getDefaultShopItems(),
    inventory: {},
    dailyRewards: {},
    achievements: {},
    activityLog: [],
    errorLog: []
  };
}

function getDefaultShopItems() {
  return [
    { _id: 'frame_gold', name: 'Gold Frame', type: 'frame', price: 100, icon: '🏆', rarity: 'common', animation: 'spin', borderColor: '#FFD700', glowColor: 'rgba(255,215,0,0.6)' },
    { _id: 'frame_rainbow', name: 'Rainbow Frame', type: 'frame', price: 250, icon: '🌈', rarity: 'rare', animation: 'rainbow', borderColor: 'linear-gradient(45deg, red,orange,yellow,green,blue,indigo,violet)', glowColor: 'rgba(255,0,255,0.5)' },
    { _id: 'frame_fire', name: 'Fire Frame', type: 'frame', price: 500, icon: '🔥', rarity: 'epic', animation: 'pulse', borderColor: '#FF4500', glowColor: 'rgba(255,69,0,0.7)' },
    { _id: 'frame_neon', name: 'Neon Frame', type: 'frame', price: 750, icon: '✨', rarity: 'epic', animation: 'glow', borderColor: '#00FFFF', glowColor: 'rgba(0,255,255,0.8)' },
    { _id: 'frame_legendary', name: 'Legendary Frame', type: 'frame', price: 2000, icon: '👑', rarity: 'legendary', animation: 'legendary', borderColor: 'linear-gradient(45deg, gold, purple, gold)', glowColor: 'rgba(255,215,0,0.9)' },
    { _id: 'frame_galaxy', name: 'Galaxy Frame', type: 'frame', price: 1500, icon: '🌌', rarity: 'legendary', animation: 'galaxy', borderColor: 'linear-gradient(45deg, #4a0080, #000428, #004e92)', glowColor: 'rgba(138,43,226,0.8)' },
    { _id: 'frame_diamond', name: 'Diamond Frame', type: 'frame', price: 3000, icon: '💎', rarity: 'mythic', animation: 'diamond', borderColor: '#B9F2FF', glowColor: 'rgba(185,242,255,0.9)' },
    { _id: 'font_inter', name: 'Inter Font', type: 'font', price: 50, icon: '🔤', rarity: 'common', fontFamily: '"Inter", sans-serif' },
    { _id: 'font_georgia', name: 'Georgia Font', type: 'font', price: 100, icon: '✒️', rarity: 'common', fontFamily: '"Georgia", serif' },
    { _id: 'font_mono', name: 'Mono Font', type: 'font', price: 150, icon: '💻', rarity: 'common', fontFamily: '"Courier New", monospace' },
    { _id: 'font_comic', name: 'Comic Font', type: 'font', price: 200, icon: '🎨', rarity: 'rare', fontFamily: '"Comic Sans MS", cursive' },
    { _id: 'font_futuristic', name: 'Futuristic', type: 'font', price: 400, icon: '🚀', rarity: 'epic', fontFamily: '"Orbitron", sans-serif' },
    { _id: 'theme_ocean', name: 'Ocean', type: 'theme', price: 300, icon: '🌊', rarity: 'rare', colors: { bg: '#001a33', accent: '#00d4ff', text: '#e0f7ff' } },
    { _id: 'theme_sunset', name: 'Sunset', type: 'theme', price: 300, icon: '🌅', rarity: 'rare', colors: { bg: '#2d1b4e', accent: '#ff6b35', text: '#ffe8d6' } },
    { _id: 'theme_forest', name: 'Forest', type: 'theme', price: 300, icon: '🌲', rarity: 'rare', colors: { bg: '#0d2818', accent: '#4ade80', text: '#dcfce7' } },
    { _id: 'theme_cyberpunk', name: 'Cyberpunk', type: 'theme', price: 500, icon: '🌃', rarity: 'epic', colors: { bg: '#0a0a0a', accent: '#ff00ff', text: '#ff00ff' } },
    { _id: 'theme_pastel', name: 'Pastel', type: 'theme', price: 300, icon: '🎀', rarity: 'rare', colors: { bg: '#fef3f2', accent: '#f472b6', text: '#831843' } },
    { _id: 'theme_midnight', name: 'Midnight', type: 'theme', price: 200, icon: '🌙', rarity: 'common', colors: { bg: '#0f0f23', accent: '#818cf8', text: '#c7d2fe' } },
    { _id: 'theme_cherry', name: 'Cherry Blossom', type: 'theme', price: 400, icon: '🌸', rarity: 'epic', colors: { bg: '#fdf2f8', accent: '#ec4899', text: '#9d174d' } },
    { _id: 'badge_verified', name: 'Verified', type: 'badge', price: 0, icon: '✓', rarity: 'special', description: 'Verified account' },
    { _id: 'badge_early', name: 'Early Adopter', type: 'badge', price: 0, icon: '🌟', rarity: 'special', description: 'Joined in the first week' },
    { _id: 'badge_top', name: 'Top Contributor', type: 'badge', price: 0, icon: '🏆', rarity: 'special', description: '100+ posts' },
    { _id: 'badge_dev', name: 'Developer', type: 'badge', price: 0, icon: '💻', rarity: 'special', description: 'Helped build the site' }
  ];
}

// User functions
function findUser(query) {
  const data = readDB();
  return data.users.find(u => u.username === query.username || u.email === query.email);
}

function findUserById(id) {
  const data = readDB();
  return data.users.find(u => u._id === id);
}

function findUserByUsername(username) {
  const data = readDB();
  return data.users.find(u => u.username === username.toLowerCase());
}

function createUser(userData) {
  const data = readDB();
  const user = {
    _id: 'user_' + Date.now(),
    name: userData.name || '',
    username: userData.username || '',
    email: userData.email || '',
    password: userData.password || '',
    role: userData.role || 'student',
    isApproved: userData.isApproved !== false,
    bio: userData.bio || '',
    avatar: userData.avatar || '',
    banner: userData.banner || '',
    points: userData.points || 0,
    xp: 0,
    level: 1,
    theme: userData.theme || 'dark',
    glassBlur: 24,
    glassOpacity: 0.06,
    glassBorder: 0.12,
    font: 'font_inter',
    frame: null,
    badges: [],
    achievements: [],
    loginStreak: 0,
    lastLogin: null,
    createdAt: new Date().toISOString()
  };
  data.users.push(user);
  writeDB(data);
  return user;
}

function updateUser(id, updates) {
  const data = readDB();
  const idx = data.users.findIndex(u => u._id === id);
  if (idx >= 0) {
    data.users[idx] = { ...data.users[idx], ...updates };
    writeDB(data);
    return data.users[idx];
  }
  return null;
}

function deleteUser(id) {
  const data = readDB();
  data.users = data.users.filter(u => u._id !== id);
  writeDB(data);
}

// Post functions
function getAllPosts() {
  return readDB().posts;
}

function createPost(postData) {
  const data = readDB();
  const post = {
    _id: 'post_' + Date.now(),
    title: postData.title || '',
    content: postData.content || '',
    mediaUrl: postData.mediaUrl || '',
    mediaType: postData.mediaType || 'none',
    author: postData.author || {},
    likes: [],
    comments: [],
    createdAt: new Date().toISOString()
  };
  data.posts.push(post);
  writeDB(data);
  return post;
}

function deletePost(id) {
  const data = readDB();
  data.posts = data.posts.filter(p => p._id !== id);
  writeDB(data);
}

// Assignment functions
function getAllAssignments() {
  return readDB().assignments;
}

function createAssignment(data) {
  const db = readDB();
  const assignment = {
    _id: 'assign_' + Date.now(),
    title: data.title || '',
    description: data.description || '',
    dueDate: data.dueDate || '',
    createdBy: data.createdBy || {},
    createdAt: new Date().toISOString()
  };
  db.assignments.push(assignment);
  writeDB(db);
  return assignment;
}

function deleteAssignment(id) {
  const data = readDB();
  data.assignments = data.assignments.filter(a => a._id !== id);
  writeDB(data);
}

// Project functions
function getAllProjects() {
  return readDB().projects;
}

function createProject(data) {
  const db = readDB();
  const project = {
    _id: 'proj_' + Date.now(),
    name: data.name || '',
    description: data.description || '',
    category: data.category || 'other',
    members: data.members || [],
    createdBy: data.createdBy || {},
    createdAt: new Date().toISOString()
  };
  db.projects.push(project);
  writeDB(db);
  return project;
}

function deleteProject(id) {
  const data = readDB();
  data.projects = data.projects.filter(p => p._id !== id);
  writeDB(data);
}

// Admin request functions
function getAllAdminRequests() {
  return readDB().adminRequests;
}

function createAdminRequest(data) {
  const db = readDB();
  const request = {
    _id: 'req_' + Date.now(),
    name: data.name || '',
    username: data.username || '',
    email: data.email || '',
    password: data.password || '',
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

// Shop functions
function getShopItems() {
  const data = readDB();
  if (!data.shopItems || data.shopItems.length === 0) {
    data.shopItems = getDefaultShopItems();
    writeDB(data);
  }
  return data.shopItems;
}

function getUserInventory(userId) {
  const data = readDB();
  if (!data.inventory) data.inventory = {};
  if (!data.inventory[userId]) {
    data.inventory[userId] = {
      frames: [],
      fonts: ['font_inter'],
      themes: ['theme_midnight'],
      badges: [],
      activeFrame: null,
      activeFont: 'font_inter',
      activeTheme: 'theme_midnight'
    };
    writeDB(data);
  }
  return data.inventory[userId];
}

function purchaseItem(userId, itemId) {
  const data = readDB();
  const user = data.users.find(u => u._id === userId);
  if (!user) return { error: 'User not found' };

  const items = getShopItems();
  const item = items.find(i => i._id === itemId);
  if (!item) return { error: 'Item not found' };

  if ((user.points || 0) < item.price) return { error: 'Not enough points' };

  const inv = getUserInventory(userId);
  if (item.type === 'frame' && inv.frames.includes(itemId)) return { error: 'Already owned' };
  if (item.type === 'font' && inv.fonts.includes(itemId)) return { error: 'Already owned' };
  if (item.type === 'theme' && inv.themes.includes(itemId)) return { error: 'Already owned' };
  if (item.type === 'badge' && inv.badges.includes(itemId)) return { error: 'Already owned' };

  user.points = (user.points || 0) - item.price;
  if (item.type === 'frame') inv.frames.push(itemId);
  if (item.type === 'font') inv.fonts.push(itemId);
  if (item.type === 'theme') inv.themes.push(itemId);
  if (item.type === 'badge') inv.badges.push(itemId);

  writeDB(data);
  return { success: true, item, remainingPoints: user.points };
}

function equipItem(userId, itemId, slot) {
  const data = readDB();
  const inv = getUserInventory(userId);

  if (slot === 'frame' && inv.frames.includes(itemId)) inv.activeFrame = itemId;
  if (slot === 'font' && inv.fonts.includes(itemId)) inv.activeFont = itemId;
  if (slot === 'theme' && inv.themes.includes(itemId)) inv.activeTheme = itemId;

  writeDB(data);
  return { success: true };
}

function giftPoints(fromId, toUsername, amount) {
  const data = readDB();
  const fromUser = data.users.find(u => u._id === fromId);
  if (!fromUser) return { error: 'Sender not found' };
  if (fromUser.role !== 'admin') return { error: 'Admin only' };

  const toUser = data.users.find(u => u.username === toUsername.toLowerCase());
  if (!toUser) return { error: 'Recipient not found' };
  if (amount <= 0) return { error: 'Invalid amount' };
  if (amount > 1000000) return { error: 'Max 1,000,000' };

  toUser.points = (toUser.points || 0) + amount;
  writeDB(data);
  return { success: true, toUser: toUser.name, newPoints: toUser.points };
}

// Daily rewards
function getDailyReward(userId) {
  const data = readDB();
  if (!data.dailyRewards) data.dailyRewards = {};

  const today = new Date().toDateString();
  const lastClaim = data.dailyRewards[userId];

  if (lastClaim === today) {
    return { error: 'Already claimed today', nextClaim: 'Tomorrow' };
  }

  const user = data.users.find(u => u._id === userId);
  if (!user) return { error: 'User not found' };

  // Calculate streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isStreak = lastClaim === yesterday.toDateString();

  if (isStreak) {
    user.loginStreak = (user.loginStreak || 0) + 1;
  } else {
    user.loginStreak = 1;
  }

  // Reward based on streak
  var baseReward = 50;
  var streakBonus = Math.min(user.loginStreak * 10, 200);
  var totalReward = baseReward + streakBonus;

  user.points = (user.points || 0) + totalReward;
  user.lastLogin = new Date().toISOString();
  data.dailyRewards[userId] = today;

  writeDB(data);
  return { 
    success: true, 
    reward: totalReward, 
    streak: user.loginStreak,
    points: user.points 
  };
}

// Achievements
function checkAchievements(userId) {
  const data = readDB();
  const user = data.users.find(u => u._id === userId);
  if (!user) return [];

  if (!data.achievements) data.achievements = {};
  if (!data.achievements[userId]) data.achievements[userId] = [];

  var newAchievements = [];
  var userAchievements = data.achievements[userId];

  // Check post count
  var postCount = data.posts.filter(p => p.author && p.author._id === userId).length;
  if (postCount >= 1 && !userAchievements.includes('first_post')) {
    userAchievements.push('first_post');
    newAchievements.push({ id: 'first_post', name: 'First Post', icon: '📝', points: 50 });
    user.points = (user.points || 0) + 50;
  }
  if (postCount >= 10 && !userAchievements.includes('prolific')) {
    userAchievements.push('prolific');
    newAchievements.push({ id: 'prolific', name: 'Prolific', icon: '✍️', points: 200 });
    user.points = (user.points || 0) + 200;
  }
  if (postCount >= 50 && !userAchievements.includes('master')) {
    userAchievements.push('master');
    newAchievements.push({ id: 'master', name: 'Master Creator', icon: '👑', points: 1000 });
    user.points = (user.points || 0) + 1000;
  }

  // Check login streak
  if (user.loginStreak >= 7 && !userAchievements.includes('streak_7')) {
    userAchievements.push('streak_7');
    newAchievements.push({ id: 'streak_7', name: 'Week Warrior', icon: '🔥', points: 100 });
    user.points = (user.points || 0) + 100;
  }
  if (user.loginStreak >= 30 && !userAchievements.includes('streak_30')) {
    userAchievements.push('streak_30');
    newAchievements.push({ id: 'streak_30', name: 'Month Master', icon: '📅', points: 500 });
    user.points = (user.points || 0) + 500;
  }

  // Check points
  if (user.points >= 1000 && !userAchievements.includes('rich_1k')) {
    userAchievements.push('rich_1k');
    newAchievements.push({ id: 'rich_1k', name: 'Rich', icon: '💰', points: 100 });
    user.points = (user.points || 0) + 100;
  }
  if (user.points >= 10000 && !userAchievements.includes('rich_10k')) {
    userAchievements.push('rich_10k');
    newAchievements.push({ id: 'rich_10k', name: 'Wealthy', icon: '💎', points: 500 });
    user.points = (user.points || 0) + 500;
  }

  writeDB(data);
  return newAchievements;
}

function getUserAchievements(userId) {
  const data = readDB();
  if (!data.achievements || !data.achievements[userId]) return [];

  var allAchievements = [
    { id: 'first_post', name: 'First Post', icon: '📝', description: 'Create your first post' },
    { id: 'prolific', name: 'Prolific', icon: '✍️', description: 'Create 10 posts' },
    { id: 'master', name: 'Master Creator', icon: '👑', description: 'Create 50 posts' },
    { id: 'streak_7', name: 'Week Warrior', icon: '🔥', description: '7 day login streak' },
    { id: 'streak_30', name: 'Month Master', icon: '📅', description: '30 day login streak' },
    { id: 'rich_1k', name: 'Rich', icon: '💰', description: 'Earn 1000 points' },
    { id: 'rich_10k', name: 'Wealthy', icon: '💎', description: 'Earn 10000 points' }
  ];

  var earned = data.achievements[userId] || [];
  return allAchievements.map(function(a) {
    return { ...a, earned: earned.includes(a.id) };
  });
}

// Activity log
function addActivity(type, user, details) {
  const data = readDB();
  if (!data.activityLog) data.activityLog = [];

  data.activityLog.unshift({
    _id: 'act_' + Date.now(),
    type,
    user: user ? { _id: user._id, name: user.name, username: user.username, avatar: user.avatar } : null,
    details,
    createdAt: new Date().toISOString()
  });

  if (data.activityLog.length > 50) data.activityLog.pop();
  writeDB(data);
}

function getActivityLog() {
  return readDB().activityLog || [];
}

// Error log
function addErrorLog(error) {
  const data = readDB();
  if (!data.errorLog) data.errorLog = [];

  data.errorLog.unshift({
    _id: 'err_' + Date.now(),
    ...error,
    createdAt: new Date().toISOString()
  });

  if (data.errorLog.length > 100) data.errorLog.pop();
  writeDB(data);
}

function getErrorLog() {
  return readDB().errorLog || [];
}

module.exports = {
  readDB, writeDB, getDefaultDB,
  findUser, findUserById, findUserByUsername, createUser, updateUser, deleteUser,
  getAllPosts, createPost, deletePost,
  getAllAssignments, createAssignment, deleteAssignment,
  getAllProjects, createProject, deleteProject,
  getAllAdminRequests, createAdminRequest, updateAdminRequest,
  getShopItems, getUserInventory, purchaseItem, equipItem, giftPoints,
  getDailyReward, checkAchievements, getUserAchievements,
  addActivity, getActivityLog,
  addErrorLog, getErrorLog
};