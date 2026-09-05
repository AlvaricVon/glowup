export interface AllocationRule {
  name: string;
  percentage: number;
  color: string;
}

export interface Allocation extends AllocationRule {
  amount: number;
}

export const ALLOCATION_RULES: readonly AllocationRule[] = [
  { name: 'BTC & ETH Indodax', percentage: 10, color: '#f7931a' },
  { name: 'Pasar Uang Bibit', percentage: 20, color: '#4f46e5' },
  { name: 'Emas Pluang', percentage: 25, color: '#f59e0b' },
  { name: 'Bisnis BCA', percentage: 30, color: '#003399' },
  { name: 'Dana Darurat BSI', percentage: 15, color: '#10b981' },
];

export function calculateAllocation(amount: number): Allocation[] {
  return ALLOCATION_RULES.map((rule) => ({
    ...rule,
    amount: Math.round(amount * (rule.percentage / 100)),
  }));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}