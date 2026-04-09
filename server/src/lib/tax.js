/**
 * Basic GST/VAT-style tax rules by category keyword.
 * amount = pre-tax base; tax is added on top (additive model).
 */
const MAX_AMOUNT = 10_000_000;

function round2(n) {
  return Math.round(n * 100) / 100;
}

function normalizeCategory(category) {
  return String(category || '')
    .trim()
    .toLowerCase();
}

/**
 * @param {number} amount - non-negative base amount
 * @param {string} category - free-text category
 * @returns {{ baseAmount: number, rate: number, ratePercent: number, taxAmount: number, totalAmount: number, label: string, rule: string }}
 */
function calculateTax(amount, category) {
  const baseAmount = round2(Number(amount));
  if (Number.isNaN(baseAmount) || baseAmount < 0) {
    throw Object.assign(new Error('Invalid amount'), { code: 'INVALID_AMOUNT' });
  }
  if (baseAmount > MAX_AMOUNT) {
    throw Object.assign(new Error('Amount exceeds maximum allowed'), { code: 'AMOUNT_TOO_LARGE' });
  }

  const cat = normalizeCategory(category);
  let rate = 0.1;
  let label = 'Standard VAT 10%';
  let rule = 'default_vat_10';

  if (!cat) {
    rate = 0.1;
    label = 'Standard VAT 10% (no category)';
    rule = 'default_vat_10';
  } else if (/(meal|food|restaurant|dining|catering)/.test(cat)) {
    rate = 0.05;
    label = 'GST 5% (Food & meals)';
    rule = 'gst_food_5';
  } else if (/(travel|flight|hotel|lodging|taxi|uber|transport)/.test(cat)) {
    rate = 0.12;
    label = 'GST 12% (Travel & transport)';
    rule = 'gst_travel_12';
  } else if (/(software|hardware|equipment|it|computer|license)/.test(cat)) {
    rate = 0.18;
    label = 'GST 18% (Software & equipment)';
    rule = 'gst_equipment_18';
  } else if (/(medical|health|pharma)/.test(cat)) {
    rate = 0.05;
    label = 'GST 5% (Medical)';
    rule = 'gst_medical_5';
  }

  const taxAmount = round2(baseAmount * rate);
  const totalAmount = round2(baseAmount + taxAmount);
  const ratePercent = round2(rate * 100);

  return {
    baseAmount,
    rate,
    ratePercent,
    taxAmount,
    totalAmount,
    label,
    rule,
  };
}

module.exports = { calculateTax, MAX_AMOUNT };
