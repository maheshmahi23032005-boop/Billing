const { getDb } = require('./init');

function firstExecRow(database, sql, params = []) {
  const stmt = database.prepare(sql);
  stmt.bind(params);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject();
  stmt.free();
  return row;
}

function execAll(database, sql, params = []) {
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function getSummary() {
  const database = getDb();

  const totals = firstExecRow(
    database,
    `SELECT
       COUNT(*) AS count,
       COALESCE(SUM(amount), 0) AS sum_base,
       COALESCE(SUM(tax_amount), 0) AS sum_tax,
       COALESCE(SUM(total_amount), 0) AS sum_total
     FROM reimbursements`
  );

  const byStatus = execAll(
    database,
    `SELECT status, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS sum_total
     FROM reimbursements GROUP BY status`
  );

  const monthly = execAll(
    database,
    `SELECT
       strftime('%Y-%m', created_at) AS month,
       SUM(CASE WHEN status = 'Approved' THEN total_amount ELSE 0 END) AS approved_total,
       SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_count,
       SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) AS rejected_count,
       COUNT(*) AS total_count
     FROM reimbursements
     GROUP BY strftime('%Y-%m', created_at)
     ORDER BY month DESC
     LIMIT 18`
  ).reverse();

  return {
    totals: {
      count: totals?.count ?? 0,
      sumBase: totals?.sum_base ?? 0,
      sumTax: totals?.sum_tax ?? 0,
      sumTotal: totals?.sum_total ?? 0,
    },
    byStatus: byStatus.map((r) => ({
      status: r.status,
      count: r.count,
      sumTotal: r.sum_total,
    })),
    monthly: monthly.map((r) => ({
      month: r.month,
      approvedTotal: r.approved_total,
      pendingCount: r.pending_count,
      rejectedCount: r.rejected_count,
      totalCount: r.total_count,
    })),
  };
}

module.exports = { getSummary };
