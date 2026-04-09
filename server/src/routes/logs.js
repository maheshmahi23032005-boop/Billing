const express = require('express');
const auditLogs = require('../db/auditLogs');
const { requireRoles } = require('../middleware/rbac');

const router = express.Router();

router.get('/logs', ...requireRoles('admin', 'manager'), (req, res) => {
  try {
    const result = auditLogs.list({
      page: req.query.page,
      limit: req.query.limit,
      action: req.query.action,
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to load audit logs' });
  }
});

module.exports = router;
