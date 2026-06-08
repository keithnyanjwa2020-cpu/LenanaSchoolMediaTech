const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Import local database
const db = require('./localdb');

const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/wav', 'video/mp4', 'video/webm'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images, audio, and video files allowed'));
  }
});

// ============================================
// AUTH ROUTES
// ============================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, username, email, password, role = 'student' } = req.body;
    const existing = db.findUser({ username: username.toLowerCase() }) || db.findUser({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'Username or email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = db.createUser({
      name, username: username.toLowerCase(), email: email.toLowerCase(),
      password: hashedPassword, role, isApproved: role === 'student'
    });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    db.addActivity('user_joined', user, { message: name + ' joined as ' + role });
    db.checkAchievements(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role, isApproved: user.isApproved, points: user.points, theme: user.theme, avatar: user.avatar, bio: user.bio }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.findUser({ email: email.toLowerCase() }) || db.findUser({ username: email.toLowerCase() });

    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    if (!user.isApproved) return res.status(403).json({ error: 'Account pending approval' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Check daily reward
    const dailyReward = db.getDailyReward(user._id);

    // Check achievements
    const newAchievements = db.checkAchievements(user._id);

    db.addActivity('user_login', user, { message: user.name + ' logged in' });

    res.json({
      token,
      user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role, avatar: user.avatar, bio: user.bio, points: user.points, theme: user.theme, level: user.level, xp: user.xp, loginStreak: user.loginStreak, glassBlur: user.glassBlur, glassOpacity: user.glassOpacity, glassBorder: user.glassBorder },
      dailyReward: dailyReward.success ? dailyReward : null,
      newAchievements: newAchievements
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findUserById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    res.json({ id: user._id, name: user.name, username: user.username, email: user.email, role: user.role, avatar: user.avatar, banner: user.banner, bio: user.bio, points: user.points, theme: user.theme, level: user.level, xp: user.xp, loginStreak: user.loginStreak, glassBlur: user.glassBlur, glassOpacity: user.glassOpacity, glassBorder: user.glassBorder, frame: user.frame, font: user.font, badges: user.badges });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.put('/api/auth/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const updates = req.body;
    const user = db.updateUser(decoded.id, updates);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/auth/password', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const { currentPassword, newPassword } = req.body;
    const user = db.findUserById(decoded.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Current password incorrect' });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.updateUser(decoded.id, { password: hashedPassword });
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// UPLOAD ROUTES
// ============================================
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    jwt.verify(token, JWT_SECRET);
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = '/uploads/' + req.file.filename;
    let type = 'image';
    if (req.file.mimetype.startsWith('audio/')) type = 'audio';
    else if (req.file.mimetype.startsWith('video/')) type = 'video';
    res.json({ url: fileUrl, publicId: req.file.filename, type, originalName: req.file.originalname });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload/avatar', upload.single('file'), async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = '/uploads/' + req.file.filename;
    db.updateUser(decoded.id, { avatar: fileUrl });
    res.json({ url: fileUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload/banner', upload.single('file'), async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = '/uploads/' + req.file.filename;
    db.updateUser(decoded.id, { banner: fileUrl });
    res.json({ url: fileUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POSTS ROUTES
// ============================================
app.get('/api/posts', (req, res) => {
  try {
    const posts = db.getAllPosts().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findUserById(decoded.id);
    const { title, content, mediaUrl, mediaType } = req.body;
    const post = db.createPost({
      title, content: content || '', mediaUrl: mediaUrl || '', mediaType: mediaType || 'none',
      author: { _id: user._id, name: user.name, username: user.username, avatar: user.avatar }
    });
    db.updateUser(decoded.id, { points: (user.points || 0) + 10, xp: (user.xp || 0) + 20 });
    db.addActivity('new_post', user, { postId: post._id, title: post.title });
    db.checkAchievements(user._id);
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const post = db.getAllPosts().find(p => p._id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author._id !== decoded.id && decoded.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
    db.deletePost(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findUserById(decoded.id);
    const data = db.readDB();
    const post = data.posts.find(p => p._id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (!post.likes) post.likes = [];
    const likeIndex = post.likes.findIndex(l => l._id === decoded.id);
    if (likeIndex >= 0) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push({ _id: decoded.id, name: user.name, username: user.username });
    }
    db.writeDB(data);
    res.json({ likes: post.likes.length, liked: likeIndex < 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findUserById(decoded.id);
    const { text } = req.body;
    const data = db.readDB();
    const post = data.posts.find(p => p._id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (!text || text.trim().length === 0) return res.status(400).json({ error: 'Comment text required' });
    if (!post.comments) post.comments = [];
    const comment = {
      _id: 'comment_' + Date.now(),
      text: text.trim(),
      author: { _id: decoded.id, name: user.name, username: user.username, avatar: user.avatar },
      createdAt: new Date().toISOString()
    };
    post.comments.push(comment);
    db.writeDB(data);
    db.addActivity('new_comment', user, { postId: post._id, title: post.title });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ASSIGNMENTS & PROJECTS
// ============================================
app.get('/api/assignments', (req, res) => res.json(db.getAllAssignments().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))));
app.post('/api/assignments', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { title, description, dueDate } = req.body;
    const user = db.findUserById(decoded.id);
    const assignment = db.createAssignment({ title, description: description || '', dueDate, createdBy: { _id: user._id, name: user.name, username: user.username } });
    db.addActivity('new_assignment', user, { assignmentId: assignment._id, title });
    res.status(201).json(assignment);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/assignments/:id', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    db.deleteAssignment(req.params.id);
    res.json({ message: 'Assignment deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/projects', (req, res) => res.json(db.getAllProjects().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))));
app.post('/api/projects', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findUserById(decoded.id);
    const { name, description, category, members } = req.body;
    const project = db.createProject({ name, description, category: category || 'other', members: members ? members.split(',').map(m => m.trim()).filter(m => m) : [], createdBy: { _id: user._id, name: user.name, username: user.username } });
    db.updateUser(decoded.id, { points: (user.points || 0) + 30, xp: (user.xp || 0) + 50 });
    db.addActivity('new_project', user, { projectId: project._id, name });
    db.checkAchievements(user._id);
    res.status(201).json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const project = db.getAllProjects().find(p => p._id === req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.createdBy._id !== decoded.id && decoded.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
    db.deleteProject(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================
// USERS & LEADERBOARD
// ============================================
app.get('/api/users', (req, res) => {
  try {
    const users = db.readDB().users.map(u => ({ _id: u._id, name: u.name, username: u.username, role: u.role, points: u.points || 0, level: u.level || 1, xp: u.xp || 0, avatar: u.avatar, frame: u.frame, badges: u.badges || [] })).sort((a, b) => (b.points || 0) - (a.points || 0));
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/users/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    db.deleteUser(decoded.id);
    res.json({ message: 'Account deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================
// ACTIVITY & ERROR LOGS
// ============================================
app.get('/api/activity', (req, res) => res.json(db.getActivityLog().slice(0, 20)));
app.get('/api/error-log', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    res.json(db.getErrorLog());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================
// SHOP API
// ============================================
app.get('/api/shop', (req, res) => res.json(db.getShopItems()));
app.get('/api/inventory', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const inv = db.getUserInventory(decoded.id);
    res.json(inv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/shop/purchase', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const { itemId } = req.body;
    const result = db.purchaseItem(decoded.id, itemId);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/shop/equip', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const { itemId, slot } = req.body;
    const result = db.equipItem(decoded.id, itemId, slot);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================
// DAILY REWARDS & ACHIEVEMENTS
// ============================================
app.get('/api/daily-reward', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = db.getDailyReward(decoded.id);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/achievements', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const achievements = db.getUserAchievements(decoded.id);
    res.json(achievements);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/achievements/check', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const newAchievements = db.checkAchievements(decoded.id);
    res.json(newAchievements);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================
// GLASSMORPHISM SETTINGS
// ============================================
app.put('/api/settings/glass', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const { blur, opacity, border } = req.body;
    const updates = {};
    if (blur !== undefined) updates.glassBlur = blur;
    if (opacity !== undefined) updates.glassOpacity = opacity;
    if (border !== undefined) updates.glassBorder = border;
    const user = db.updateUser(decoded.id, updates);
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================
// ADMIN ROUTES
// ============================================
app.post('/api/admin/request', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    const existing = db.findUser({ username: username.toLowerCase() }) || db.findUser({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'Username or email already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const request = db.createAdminRequest({ name, username: username.toLowerCase(), email: email.toLowerCase(), password: hashedPassword });
    res.status(201).json({ message: 'Admin request submitted!', requestId: request._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/admin/requests', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    res.json(db.getAllAdminRequests().filter(r => r.status === 'pending').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/admin/requests/:id', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { action } = req.body;
    const request = db.getAllAdminRequests().find(r => r._id === req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (action === 'approve') {
      db.createUser({ name: request.name, username: request.username, email: request.email, password: request.password, role: 'admin', isApproved: true, points: 0 });
      db.updateAdminRequest(req.params.id, { status: 'approved' });
      res.json({ message: 'Approved' });
    } else {
      db.updateAdminRequest(req.params.id, { status: 'rejected' });
      res.json({ message: 'Rejected' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/admin/users', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    res.json(db.readDB().users.map(u => ({ _id: u._id, name: u.name, username: u.username, email: u.email, role: u.role, points: u.points || 0, level: u.level || 1, avatar: u.avatar })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    db.deleteUser(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/admin/gift', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { username, amount } = req.body;
    const result = db.giftPoints(decoded.id, username, parseInt(amount));
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/admin/stats', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const data = db.readDB();
    res.json({ totalUsers: data.users.length, totalAdmins: data.users.filter(u => u.role === 'admin').length, pendingRequests: data.adminRequests.filter(r => r.status === 'pending').length, totalRequests: data.adminRequests.length, totalPosts: data.posts.length, totalProjects: data.projects.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================
// HEALTH & FALLBACK
// ============================================
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: 'local-json', timestamp: new Date().toISOString() }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Seed admin
async function seedAdmin() {
  const existing = db.findUser({ username: 'kasuku' });
  if (!existing) {
    const hashedPassword = await bcrypt.hash('kasuku123', 10);
    db.createUser({ name: 'Kasuku Admin', username: 'kasuku', email: 'kasuku@mediacore.local', password: hashedPassword, role: 'admin', isApproved: true, points: 0, badges: ['badge_dev'] });
    console.log('✅ Kasuku admin created (kasuku / kasuku123)');
  } else {
    console.log('✅ Kasuku admin exists');
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  seedAdmin();
  console.log('🚀 Lenana School Media Tech running on port ' + PORT);
  console.log('📡 API: http://localhost:' + PORT + '/api');
  console.log('👤 Admin: kasuku / kasuku123');
  console.log('💾 Database: local JSON file');
  console.log('🎨 Features: 7 themes, 7 frames, 5 fonts, 4 badges, daily rewards, achievements, glassmorphism');
});

module.exports = app;