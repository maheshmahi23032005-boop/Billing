const { getDb, persist } = require('./init');

function insert({ userId, action, entityType = null, entityId = null, metadata = null }) {
  const database = getDb();
  const meta =
    metadata != null && typeof metadata === 'object'
      ? JSON.stringify(metadata)
      : metadata != null
        ? String(metadata)
        : null;
  database.run(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [userId || null, action, entityType, entityId, meta]
  );
  persist();
}

function list({ page = 1, limit = 25, action = null }) {
  const database = getDb();
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 25));
  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safeLimit;

  let where = '1=1';
  const params = [];
  if (action && String(action).trim()) {
    where += ' AND a.action = ?';
    params.push(String(action).trim());
  }

  const countStmt = database.prepare(`SELECT COUNT(*) AS c FROM audit_logs a WHERE ${where}`);
  countStmt.bind(params);
  countStmt.step();
  const total = countStmt.getAsObject().c;
  countStmt.free();

  const dataStmt = database.prepare(`
    SELECT a.id, a.user_id, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at,
           u.name AS user_name, u.email AS user_email
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE ${where}
    ORDER BY datetime(a.created_at) DESC
    LIMIT ? OFFSET ?
  `);
  dataStmt.bind([...params, safeLimit, offset]);
  const rows = [];
  while (dataStmt.step()) {
    rows.push(dataStmt.getAsObject());
  }
  dataStmt.free();

  return {
    logs: rows.map(toApi),
    total,
    page: safePage,
    limit: safeLimit,
  };
}

function toApi(row) {
  let metadata = null;
  if (row.metadata) {
    try {
      metadata = JSON.parse(row.metadata);
    } catch {
      metadata = row.metadata;
    }
  }
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || null,
    userEmail: row.user_email || null,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata,
    createdAt: row.created_at,
  };
}

module.exports = { insert, list };
