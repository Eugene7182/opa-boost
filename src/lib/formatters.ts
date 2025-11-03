/**
 * Format number as Kazakhstani Tenge currency
 * Example: 123456 → ₸ 123 456
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₸ 0';
  
  return '₸ ' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Format number with thousands separator
 * Example: 123456 → 123 456
 */
export function formatNumber(num: number | string): string {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(value)) return '0';
  
  return value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Format percentage
 * Example: 0.8534 → 85.3%
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return (value * 100).toFixed(decimals) + '%';
}