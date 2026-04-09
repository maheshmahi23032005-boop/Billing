/**
 * Demo accounts (password for all): password123
 *   admin@demo.local    — Admin
 *   employee@demo.local — Employee
 *   reviewer@demo.local — Reviewer
 *
 * Run: npm run seed --prefix server
 * Uses SQLite file (default: server/data/billing.db)
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { initDb } = require('../db/init');
const users = require('../db/users');

const DEMO_PASSWORD = 'password123';

const DEMO_USERS = [
  { name: 'Demo Admin', email: 'admin@demo.local', role: 'admin', password: 'password123' },
  { name: 'Demo Manager', email: 'manager@demo.local', role: 'manager', password: 'password123' },
  { name: 'Demo Employee', email: 'employee@demo.local', role: 'employee', password: 'password123' },
  { name: 'Demo Reviewer', email: 'reviewer@demo.local', role: 'reviewer', password: 'password123' },
  { name: 'Demo Financial', email: 'financial@demo.local', role: 'financial', password: 'finance123' },
];

async function main() {
  await initDb();

  for (const u of DEMO_USERS) {
    const email = u.email.toLowerCase();
    const existing = users.findByEmail(email);
    if (existing) {
      console.log(`Exists: ${email} (${existing.role}) — skipped`);
      continue;
    }
    const passwordHash = await users.hashPassword(u.password);
    users.createUser({
      name: u.name,
      email,
      passwordHash,
      role: u.role,
    });
    console.log(`Created: ${email} (${u.role})`);
  }

  console.log('\n--- Demo login credentials ---');
  DEMO_USERS.forEach((u) => console.log(`  ${u.email}  →  ${u.role}  (password: ${u.password})`));
  console.log('---\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
