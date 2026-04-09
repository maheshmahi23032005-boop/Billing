const MAX_DESC = 5000;
const MAX_CATEGORY = 120;

/**
 * Validates reimbursement POST body. Attaches req.validatedReimbursement or returns 400.
 */
function validateReimbursementBody(req, res, next) {
  const body = req.body || {};
  const errors = [];

  const categoryRaw = body.category;
  const category =
    categoryRaw === undefined || categoryRaw === null ? '' : String(categoryRaw).trim();
  if (!category) errors.push('category is required');
  else if (category.length > MAX_CATEGORY) errors.push(`category must be at most ${MAX_CATEGORY} characters`);

  const amountRaw = body.amount;
  if (amountRaw === undefined || amountRaw === null || amountRaw === '') {
    errors.push('amount is required');
  } else {
    const num = Number(amountRaw);
    if (Number.isNaN(num)) errors.push('amount must be a valid number');
    else if (num < 0) errors.push('amount cannot be negative');
    else if (!Number.isFinite(num)) errors.push('amount must be finite');
  }

  const dateRaw = body.date;
  if (!dateRaw) {
    errors.push('date is required');
  } else {
    const d = new Date(dateRaw);
    if (Number.isNaN(d.getTime())) errors.push('date must be a valid date');
    const now = new Date();
    const farFuture = new Date();
    farFuture.setFullYear(now.getFullYear() + 1);
    if (d.getTime() > farFuture.getTime()) errors.push('date cannot be more than one year in the future');
    const farPast = new Date();
    farPast.setFullYear(now.getFullYear() - 10);
    if (d.getTime() < farPast.getTime()) errors.push('date cannot be more than 10 years in the past');
  }

  let description = '';
  if (body.description != null) {
    description = String(body.description).trim();
    if (description.length > MAX_DESC) {
      errors.push(`description must be at most ${MAX_DESC} characters`);
    }
  }

  if (errors.length) {
    return res.status(400).json({ error: 'Validation failed', errors });
  }

  const numAmount = Number(amountRaw);
  const billDate = new Date(dateRaw);

  req.validatedReimbursement = {
    amount: numAmount,
    category,
    billDateIso: billDate.toISOString(),
    description,
  };
  next();
}

module.exports = { validateReimbursementBody };
