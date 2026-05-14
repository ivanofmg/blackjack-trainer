export type TableHandSize = 'md' | 'lg';

export type TableAction = 'hit' | 'stand' | 'double' | 'split' | 'surrender';

export type ActionButtonConfig = Readonly<{
  action: TableAction;
  label: string;
}>;

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
