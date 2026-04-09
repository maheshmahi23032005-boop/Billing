const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

let db;
let dbFilePath;

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

function persist() {
  if (!db || !dbFilePath) return;
  const data = db.export();
  fs.writeFileSync(dbFilePath, Buffer.from(data));
}

function columnExists(database, table, colName) {
  const r = database.exec(`PRAGMA table_info(${table})`);
  if (!r.length || !r[0].values) return false;
  return r[0].values.some((row) => row[1] === colName);
}

function migrateReimbursementsReviewComment(database) {
  if (!columnExists(database, 'reimbursements', 'review_comment')) {
    database.run(
      `ALTER TABLE reimbursements ADD COLUMN review_comment TEXT NOT NULL DEFAULT ''`
    );
  }
}

function migrateReimbursementsTax(database) {
  if (!columnExists(database, 'reimbursements', 'tax_amount')) {
    database.run(`ALTER TABLE reimbursements ADD COLUMN tax_amount REAL NOT NULL DEFAULT 0`);
  }
  if (!columnExists(database, 'reimbursements', 'tax_rate')) {
    database.run(`ALTER TABLE reimbursements ADD COLUMN tax_rate REAL NOT NULL DEFAULT 0`);
  }
  if (!columnExists(database, 'reimbursements', 'tax_label')) {
    database.run(`ALTER TABLE reimbursements ADD COLUMN tax_label TEXT NOT NULL DEFAULT ''`);
  }
  if (!columnExists(database, 'reimbursements', 'tax_rule')) {
    database.run(`ALTER TABLE reimbursements ADD COLUMN tax_rule TEXT NOT NULL DEFAULT ''`);
  }
  if (!columnExists(database, 'reimbursements', 'total_amount')) {
    database.run(`ALTER TABLE reimbursements ADD COLUMN total_amount REAL`);
    database.run(
      `UPDATE reimbursements SET total_amount = amount + COALESCE(tax_amount, 0) WHERE total_amount IS NULL`
    );
  }
  if (!columnExists(database, 'reimbursements', 'paid_at')) {
    database.run(`ALTER TABLE reimbursements ADD COLUMN paid_at TEXT`);
  }
}

async function initDb() {
  dbFilePath =
    process.env.SQLITE_PATH || path.join(__dirname, '../../data/billing.db');
  fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });

  const SQL = await initSqlJs();
  if (fs.existsSync(dbFilePath)) {
    const buf = fs.readFileSync(dbFilePath);
    db = new SQL.Database(new Uint8Array(buf));
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee', 'reviewer', 'financial')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reimbursements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL CHECK (amount >= 0),
      category TEXT NOT NULL,
      bill_date TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Paid')),
      paid_at TEXT,
      review_comment TEXT NOT NULL DEFAULT '',
      tax_amount REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0,
      tax_label TEXT NOT NULL DEFAULT '',
      tax_rule TEXT NOT NULL DEFAULT '',
      total_amount REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_reimbursements_user_id ON reimbursements(user_id);
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
  `);
  migrateReimbursementsReviewComment(db);
  migrateReimbursementsTax(db);
  persist();
  const cnt = db.exec('SELECT COUNT(*) FROM users');
  const userCount =
    cnt.length && cnt[0].values && cnt[0].values[0] ? cnt[0].values[0][0] : 0;
  console.log(`SQLite (sql.js): ${dbFilePath}`);
  console.log(`Users in database: ${userCount} (if 0, run: npm run seed --prefix server)`);
}

module.exports = { initDb, getDb, persist };
