const { requireAuth, requireRole } = require('./auth');

/**
 * Run authentication, then enforce one of the allowed roles.
 * Usage: router.get('/admin-only', ...requireRoles('admin'), handler)
 */
function requireRoles(...allowedRoles) {
  return [requireAuth, requireRole(...allowedRoles)];
}

module.exports = {
  requireAuth,
  requireRole,
  requireRoles,
};
