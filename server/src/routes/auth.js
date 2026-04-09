const express = require('express');
const jwt = require('jsonwebtoken');
const users = require('../db/users');
const { requireAuth } = require('../middleware/auth');

const publicRouter = express.Router();
const privateRouter = express.Router();

function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function userPayload(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

/** POST /register (also POST /api/register when mounted under /api) */
publicRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }
    const r = role && users.ROLES.includes(role) ? role : 'employee';
    const passwordHash = await users.hashPassword(password);
    const created = users.createUser({ name, email, passwordHash, role: r });
    const token = signToken(created.id);
    res.status(201).json({
      token,
      user: userPayload(created),
    });
  } catch (err) {
    if (err && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

/** POST /login (also POST /api/login when mounted under /api) */
publicRouter.post('/login', async (req, res) => {
  try {
    const email =
      typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const row = users.findByEmail(email);
    if (!row || !(await users.verifyPassword(password, row.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = signToken(row.id);
    res.json({
      token,
      user: userPayload(users.toPublicUser(row)),
    });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

/** GET /me when router is mounted at /api/auth */
privateRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: userPayload(req.user) });
});

module.exports = { publicRouter, privateRouter };
