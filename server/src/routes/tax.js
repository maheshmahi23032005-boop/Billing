const express = require('express');
const { calculateTax } = require('../lib/tax');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

/** GET /tax/preview?amount=&category= — employees (live form preview) */
router.get(
  '/tax/preview',
  requireAuth,
  requireRole('employee'),
  (req, res) => {
    try {
      const { amount, category } = req.query;
      if (amount === undefined || amount === '') {
        return res.status(400).json({ error: 'amount query parameter is required' });
      }
      const num = Number(amount);
      if (Number.isNaN(num) || num < 0) {
        return res.status(400).json({ error: 'amount must be a non-negative number' });
      }
      const breakdown = calculateTax(num, category || '');
      res.json({ breakdown });
    } catch (err) {
      if (err.code === 'INVALID_AMOUNT' || err.code === 'AMOUNT_TOO_LARGE') {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: 'Tax calculation failed' });
    }
  }
);

module.exports = router;
