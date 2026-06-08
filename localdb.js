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

module.exports = {
  findUser, findUserById, createUser, updateUser, deleteUser,
  getAllPosts, createPost, deletePost,
  getAllAssignments, createAssignment, deleteAssignment,
  getAllProjects, createProject, deleteProject,
  getAllAdminRequests, createAdminRequest, updateAdminRequest,
  readDB
};
