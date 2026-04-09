const bcrypt = require('bcryptjs');
const { getDb, persist } = require('./init');

const ROLES = ['admin', 'manager', 'employee', 'reviewer', 'financial'];

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function findById(id) {
  const database = getDb();
  const stmt = database.prepare('SELECT id, name, email, role FROM users WHERE id = ?');
  stmt.bind([Number(id)]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject();
  stmt.free();
  return row;
}

function findByEmail(email) {
  const e = String(email).toLowerCase().trim();
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM users WHERE email = ?');
  stmt.bind([e]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject();
  stmt.free();
  return row;
}

function createUser({ name, email, passwordHash, role }) {
  const database = getDb();
  try {
    database.run(
      `INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [name, String(email).toLowerCase().trim(), passwordHash, role]
    );
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    const e = new Error(msg);
    if (msg.includes('UNIQUE') || msg.includes('constraint')) {
      e.code = 'SQLITE_CONSTRAINT_UNIQUE';
    }
    throw e;
  }
  const rid = database.exec('SELECT last_insert_rowid() AS id');
  const newId = rid[0].values[0][0];
  persist();
  return findById(newId);
}

function toPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: String(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
  };
}

module.exports = {
  ROLES,
  hashPassword,
  verifyPassword,
  findById,
  findByEmail,
  createUser,
  toPublicUser,
};
