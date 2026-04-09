const { getDb, persist } = require('./init');

function sanitizeSearch(q) {
  return String(q || '')
    .trim()
    .slice(0, 100)
    .replace(/[%_]/g, '');
}

function create({
  userId,
  amount,
  category,
  billDateIso,
  description,
  taxAmount,
  taxRate,
  taxLabel,
  taxRule,
  totalAmount,
}) {
  const database = getDb();
  database.run(
    `INSERT INTO reimbursements (
      user_id, amount, category, bill_date, description, status,
      tax_amount, tax_rate, tax_label, tax_rule, total_amount,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      userId,
      amount,
      category,
      billDateIso,
      description || '',
      taxAmount,
      taxRate,
      taxLabel,
      taxRule,
      totalAmount,
    ]
  );
  const rid = database.exec('SELECT last_insert_rowid() AS id');
  const newId = rid[0].values[0][0];
  persist();
  return findById(newId);
}

function findById(id) {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM reimbursements WHERE id = ?');
  stmt.bind([Number(id)]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject();
  stmt.free();
  return row;
}

function listByUserId(userId, options = {}) {
  const { page = 1, limit = 20, status, q } = options;
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safeLimit;

  let where = 'user_id = ?';
  const params = [userId];
  if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
    where += ' AND status = ?';
    params.push(status);
  }
  const search = sanitizeSearch(q);
  if (search) {
    const term = `%${search}%`;
    where += ' AND (category LIKE ? OR description LIKE ?)';
    params.push(term, term);
  }

  const database = getDb();
  const countStmt = database.prepare(`SELECT COUNT(*) AS c FROM reimbursements WHERE ${where}`);
  countStmt.bind(params);
  countStmt.step();
  const total = countStmt.getAsObject().c;
  countStmt.free();

  const dataStmt = database.prepare(
    `SELECT * FROM reimbursements WHERE ${where} ORDER BY datetime(created_at) DESC LIMIT ? OFFSET ?`
  );
  dataStmt.bind([...params, safeLimit, offset]);
  const rows = [];
  while (dataStmt.step()) {
    rows.push(dataStmt.getAsObject());
  }
  dataStmt.free();

  return { rows, total, page: safePage, limit: safeLimit };
}

function listAllWithSubmitter(options = {}) {
  const { page = 1, limit = 20, status, q } = options;
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safeLimit;

  let where = '1=1';
  const params = [];
  if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
    where += ' AND r.status = ?';
    params.push(status);
  }
  const search = sanitizeSearch(q);
  if (search) {
    const term = `%${search}%`;
    where += ' AND (r.category LIKE ? OR r.description LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
    params.push(term, term, term, term);
  }

  const database = getDb();
  const countStmt = database.prepare(`
    SELECT COUNT(*) AS c FROM reimbursements r JOIN users u ON u.id = r.user_id WHERE ${where}
  `);
  countStmt.bind(params);
  countStmt.step();
  const total = countStmt.getAsObject().c;
  countStmt.free();

  const dataStmt = database.prepare(`
    SELECT
      r.id,
      r.user_id,
      r.amount,
      r.category,
      r.bill_date,
      r.description,
      r.status,
      r.review_comment,
      r.tax_amount,
      r.tax_rate,
      r.tax_label,
      r.tax_rule,
      r.total_amount,
      r.created_at,
      r.updated_at,
      u.name AS submitter_name,
      u.email AS submitter_email
    FROM reimbursements r
    JOIN users u ON u.id = r.user_id
    WHERE ${where}
    ORDER BY datetime(r.created_at) DESC
    LIMIT ? OFFSET ?
  `);
  dataStmt.bind([...params, safeLimit, offset]);
  const rows = [];
  while (dataStmt.step()) {
    rows.push(dataStmt.getAsObject());
  }
  dataStmt.free();

  return { rows, total, page: safePage, limit: safeLimit };
}

function setReviewDecision(id, status, comment) {
  const database = getDb();
  const existing = findById(id);
  if (!existing) return null;
  if (existing.status !== 'Pending') {
    const err = new Error('Only pending requests can be reviewed');
    err.code = 'NOT_PENDING';
    throw err;
  }
  const text = comment != null ? String(comment).trim() : '';
  database.run(
    `UPDATE reimbursements
     SET status = ?, review_comment = ?, updated_at = datetime('now')
     WHERE id = ? AND status = 'Pending'`,
    [status, text, Number(id)]
  );
  persist();
  return findById(id);
}

function taxBreakdownFromRow(row) {
  const base = row.amount != null ? row.amount : 0;
  const taxAmount = row.tax_amount != null ? row.tax_amount : 0;
  const total =
    row.total_amount != null ? row.total_amount : base + taxAmount;
  const rate = row.tax_rate != null ? row.tax_rate : 0;
  return {
    baseAmount: base,
    rate,
    ratePercent: Math.round(rate * 10000) / 100,
    taxAmount,
    totalAmount: total,
    label: row.tax_label || '—',
    rule: row.tax_rule || '—',
  };
}

function markAsPaid(id) {
  const database = getDb();
  const existing = findById(id);
  if (!existing) return null;
  if (existing.status !== 'Approved') {
    const err = new Error('Only approved requests can be marked as paid');
    err.code = 'NOT_APPROVED';
    throw err;
  }
  database.run(
    `UPDATE reimbursements
     SET status = 'Paid', paid_at = datetime('now'), updated_at = datetime('now')
     WHERE id = ?`,
    [Number(id)]
  );
  persist();
  return findById(id);
}

function toApi(row) {
  if (!row) return null;
  const base = {
    id: row.id,
    amount: row.amount,
    category: row.category,
    date: row.bill_date,
    description: row.description,
    status: row.status,
    comment: row.review_comment != null ? row.review_comment : '',
    taxBreakdown: taxBreakdownFromRow(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.submitter_name != null) {
    base.submittedBy = {
      id: row.user_id,
      name: row.submitter_name,
      email: row.submitter_email,
    };
  }
  return base;
}

module.exports = {
  create,
  findById,
  listByUserId,
  listAllWithSubmitter,
  setReviewDecision,
  markAsPaid,
  toApi,
};
