const express = require('express');
const { getSummary } = require('../db/reports');
const { requireRoles } = require('../middleware/rbac');

const router = express.Router();

router.get('/reports/summary', ...requireRoles('admin', 'manager'), (req, res) => {
  try {
    res.json(getSummary());
  } catch {
    res.status(500).json({ error: 'Failed to load reports' });
  }
});

module.exports = router;
