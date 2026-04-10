const express = require('express');
const { requireRoles } = require('../middleware/rbac');
const { getUserCount, getActiveUserCount } = require('../db/users');
const { getTodaysApprovedCount, getPendingReviewCount, getReadyForPaymentCount } = require('../db/reports');

const router = express.Router();

router.get('/admin', ...requireRoles('admin'), (req, res) => {
  res.json({
    role: 'admin',
    title: 'Admin dashboard',
    summary: {
      totalUsers: '—',
      pendingReimbursements: '—',
      monthlySpend: '—',
    },
    message: 'Manage users, policies, and org-wide billing settings.',
  });
});

router.get('/employee', ...requireRoles('employee'), (req, res) => {
  res.json({
    role: 'employee',
    title: 'Employee dashboard',
    summary: {
      myPendingClaims: '—',
      approvedThisMonth: '—',
    },
    message: 'Submit expenses and track your reimbursement status.',
  });
});

router.get('/reviewer', ...requireRoles('reviewer'), (req, res) => {
  res.json({
    role: 'reviewer',
    title: 'Reviewer dashboard',
    summary: {
      queueCount: '—',
      overdueReviews: '—',
    },
    message: 'Review and approve team reimbursement requests.',
  });
});

router.get('/manager', ...requireRoles('manager'), (req, res) => {
  try {
    const userCount = getActiveUserCount();
    const pendingReview = getPendingReviewCount();
    const approvedToday = getTodaysApprovedCount();
    const readyForPayment = getReadyForPaymentCount();

    res.json({
      role: 'manager',
      title: 'Manager dashboard',
      userCount,
      pendingReview,
      approvedToday,
      readyForPayment,
      summary: {
        pendingReimbursements: pendingReview,
        approvedThisMonth: approvedToday,
      },
      message: 'Manage team reimbursements and approve/reject requests.',
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

module.exports = router;
