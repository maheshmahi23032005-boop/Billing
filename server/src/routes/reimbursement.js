const express = require('express');
const reimbursements = require('../db/reimbursements');
const auditLogs = require('../db/auditLogs');
const { calculateTax } = require('../lib/tax');
const { requireRoles } = require('../middleware/rbac');
const { validateReimbursementBody } = require('../middleware/validateReimbursement');

const router = express.Router();
const reviewerOrAdmin = requireRoles('reviewer', 'admin', 'manager', 'financial');

function parseListQuery(req) {
  return {
    page: req.query.page,
    limit: req.query.limit,
    status: req.query.status || undefined,
    q: req.query.q || req.query.search || undefined,
  };
}

/** POST /reimbursement — employees only */
router.post(
  '/reimbursement',
  ...requireRoles('employee'),
  validateReimbursementBody,
  async (req, res) => {
    try {
      const { amount, category, billDateIso, description } = req.validatedReimbursement;
      const tax = calculateTax(amount, category);
      const row = reimbursements.create({
        userId: req.user.id,
        amount: tax.baseAmount,
        category,
        billDateIso,
        description,
        taxAmount: tax.taxAmount,
        taxRate: tax.rate,
        taxLabel: tax.label,
        taxRule: tax.rule,
        totalAmount: tax.totalAmount,
      });
      auditLogs.insert({
        userId: req.user.id,
        action: 'REIMBURSEMENT_SUBMIT',
        entityType: 'reimbursement',
        entityId: row.id,
        metadata: {
          category,
          baseAmount: tax.baseAmount,
          taxAmount: tax.taxAmount,
          totalAmount: tax.totalAmount,
        },
      });
      res.status(201).json({ reimbursement: reimbursements.toApi(row) });
    } catch (err) {
      if (err.code === 'INVALID_AMOUNT' || err.code === 'AMOUNT_TOO_LARGE') {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: 'Failed to create reimbursement' });
    }
  }
);

/** GET /reimbursement/user — employees */
router.get('/reimbursement/user', ...requireRoles('employee'), async (req, res) => {
  try {
    const { rows, total, page, limit } = reimbursements.listByUserId(
      req.user.id,
      parseListQuery(req)
    );
    res.json({
      reimbursements: rows.map((d) => reimbursements.toApi(d)),
      total,
      page,
      limit,
    });
  } catch {
    res.status(500).json({ error: 'Failed to load reimbursements' });
  }
});

/** GET /reimbursement/all — reviewers & admins */
router.get('/reimbursement/all', ...reviewerOrAdmin, async (req, res) => {
  try {
    const { rows, total, page, limit } = reimbursements.listAllWithSubmitter(
      parseListQuery(req)
    );
    res.json({
      reimbursements: rows.map((d) => reimbursements.toApi(d)),
      total,
      page,
      limit,
    });
  } catch {
    res.status(500).json({ error: 'Failed to load reimbursements' });
  }
});

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'Invalid reimbursement id' });
    return null;
  }
  return id;
}

function readComment(req) {
  const c = req.body && req.body.comment;
  return typeof c === 'string' ? c : c != null ? String(c) : '';
}

/** PUT /reimbursement/:id/approve */
router.put('/reimbursement/:id/approve', ...reviewerOrAdmin, async (req, res) => {
  try {
    const id = parseId(req, res);
    if (id == null) return;
    const comment = readComment(req);
    const row = reimbursements.setReviewDecision(id, 'Approved', comment);
    if (!row) {
      return res.status(404).json({ error: 'Reimbursement not found' });
    }
    auditLogs.insert({
      userId: req.user.id,
      action: 'REIMBURSEMENT_APPROVE',
      entityType: 'reimbursement',
      entityId: id,
      metadata: { comment: comment || null, submitterId: row.user_id },
    });
    res.json({ reimbursement: reimbursements.toApi(row) });
  } catch (err) {
    if (err.code === 'NOT_PENDING') {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to approve reimbursement' });
  }
});

/** PUT /reimbursement/:id/reject */
router.put('/reimbursement/:id/reject', ...reviewerOrAdmin, async (req, res) => {
  try {
    const id = parseId(req, res);
    if (id == null) return;
    const comment = readComment(req);
    const row = reimbursements.setReviewDecision(id, 'Rejected', comment);
    if (!row) {
      return res.status(404).json({ error: 'Reimbursement not found' });
    }
    auditLogs.insert({
      userId: req.user.id,
      action: 'REIMBURSEMENT_REJECT',
      entityType: 'reimbursement',
      entityId: id,
      metadata: { comment: comment || null, submitterId: row.user_id },
    });
    res.json({ reimbursement: reimbursements.toApi(row) });
  } catch (err) {
    if (err.code === 'NOT_PENDING') {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to reject reimbursement' });
  }
});

/** PUT /reimbursement/:id/payment — financial & admins */
router.put('/reimbursement/:id/payment', ...requireRoles('financial', 'admin'), async (req, res) => {
  try {
    const id = parseId(req, res);
    if (id == null) return;
    const row = reimbursements.markAsPaid(id);
    if (!row) {
      return res.status(404).json({ error: 'Reimbursement not found' });
    }
    auditLogs.insert({
      userId: req.user.id,
      action: 'REIMBURSEMENT_PAYMENT',
      entityType: 'reimbursement',
      entityId: id,
      metadata: { amount: row.total_amount, submitterId: row.user_id },
    });
    res.json({ reimbursement: reimbursements.toApi(row) });
  } catch (err) {
    if (err.code === 'NOT_APPROVED') {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

module.exports = router;
