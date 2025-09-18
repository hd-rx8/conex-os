/**
 * Utility functions for handling proposal data and calculations
 */

/**
 * Safely converts a value to a number, returning 0 if invalid
 */
export const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

/**
 * Normalize numeric fields after fetching from Supabase
 * Supabase returns NUMERIC fields as strings or null, causing NaN in calculations
 */
export const normalizeProposal = (p: any) => {
  const n = (x: any) => Number(x ?? 0);
  
  return {
    ...p,
    amount: n(p.amount),
    cash_discount_percentage: n(p.cash_discount_percentage),
    installment_number: n(p.installment_number),
    installment_value: n(p.installment_value),
    manual_installment_total: n(p.manual_installment_total),
  };
};

/**
 * Compute totals for a normalized proposal
 */
export const computeTotals = (p: any) => {
  const n = (x: any) => Number(x ?? 0);
  
  const base = n(p.amount);
  const discount = n(p.cash_discount_percentage);
  const totalCash = +(base * (1 - discount / 100)).toFixed(2);

  const nInst = n(p.installment_number);
  const perInst = n(p.installment_value);
  const manual = n(p.manual_installment_total);

  const totalInstallment = +(manual > 0
    ? manual
    : (perInst > 0 && nInst > 0 ? perInst * nInst : base)).toFixed(2);

  return { totalCash, totalInstallment };
};

/**
 * Safely gets a price value, preferring custom price over base price
 */
export const getServicePrice = (customPrice: any, basePrice: any): number => {
  const custom = safeNumber(customPrice);
  const base = safeNumber(basePrice);
  
  // If custom price is valid and greater than 0, use it
  if (custom > 0) {
    return custom;
  }
  
  // Otherwise use base price
  return base;
};

/**
 * Calculates the total for a single service
 */
export const calculateServiceTotal = (
  customPrice: any,
  basePrice: any,
  quantity: any,
  discount: any
): number => {
  const price = getServicePrice(customPrice, basePrice);
  const qty = safeNumber(quantity) || 1;
  const disc = safeNumber(discount);
  
  const total = (price * qty) - disc;
  return Math.max(0, total); // Ensure non-negative
};

/**
 * Reconstructs service data from database with safe defaults
 */
export const reconstructService = (ps: any) => {
  return {
    id: ps.service_id,
    name: ps.name || 'Serviço',
    description: ps.description || '',
    basePrice: safeNumber(ps.base_price),
    category: ps.category || 'Geral',
    icon: ps.icon || '✨',
    features: Array.isArray(ps.features) ? ps.features : [],
    quantity: safeNumber(ps.quantity) || 1,
    customPrice: ps.custom_price && safeNumber(ps.custom_price) > 0 ? safeNumber(ps.custom_price) : undefined,
    discount: safeNumber(ps.discount),
    discountPercentage: safeNumber(ps.discount_percentage),
    discountType: ps.discount_type || 'percentage',
    customFeatures: Array.isArray(ps.features) ? ps.features : [],
    isCustom: Boolean(ps.is_custom),
    billing_type: ps.billing_type || 'one_time',
  };
};

/**
 * Calculates totals for services by billing type
 */
export const calculateServiceTotals = (services: any[]) => {
  const oneTimeTotal = services
    .filter(s => s.billing_type === 'one_time')
    .reduce((sum, s) => {
      const total = calculateServiceTotal(s.customPrice, s.basePrice, s.quantity, s.discount);
      return sum + total;
    }, 0);

  const monthlyTotal = services
    .filter(s => s.billing_type === 'monthly')
    .reduce((sum, s) => {
      const total = calculateServiceTotal(s.customPrice, s.basePrice, s.quantity, s.discount);
      return sum + total;
    }, 0);

  return { oneTimeTotal, monthlyTotal };
};

/**
 * Format currency using Intl.NumberFormat for consistent display
 */
export const formatCurrencySafe = (value: any, locale = 'pt-BR', currency = 'BRL'): string => {
  const numValue = safeNumber(value);
  if (isNaN(numValue)) {
    return 'R$ 0,00';
  }
  
  try {
    return new Intl.NumberFormat(locale, { 
      style: 'currency', 
      currency: currency 
    }).format(numValue);
  } catch (error) {
    // Fallback to simple formatting if Intl.NumberFormat fails
    return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
  }
};
