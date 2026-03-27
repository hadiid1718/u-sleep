const clampPercentage = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
};

export const calculateAnnualPrice = (monthlyPrice, annualDiscount = 0) => {
  const monthly = Number(monthlyPrice) || 0;
  if (monthly <= 0) return 0;

  const discount = clampPercentage(Number(annualDiscount));
  return Math.round(monthly * 12 * (1 - discount / 100));
};

export const getEffectiveAnnualPrice = (product) => {
  if (!product) return 0;

  const monthly = Number(product.monthlyPrice) || 0;
  const annual = Number(product.annualPrice) || 0;
  const discount = Number(product.annualDiscount) || 0;
  const calculated = calculateAnnualPrice(monthly, discount);

  if (annual <= 0) return calculated;

  if (monthly > 0 && annual < monthly * 2) {
    return calculated;
  }

  return annual;
};
