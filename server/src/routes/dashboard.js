const express = require('express');
const { requireRoles } = require('../middleware/rbac');

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
  res.json({
    role: 'manager',
    title: 'Manager dashboard',
    userCount: 0,
    summary: {
      pendingReimbursements: '—',
      approvedThisMonth: '—',
    },
    message: 'Manage team reimbursements and approve/reject requests.',
  });
});

module.exports = router;
