import type { MortgageInput, MortgageResult } from './types';

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

/**
 * The repayment of a fixed-rate annuity loan, compounded monthly:
 *
 *   loan     = price − downPayment            (down payment clamped to 0…price)
 *   r        = annualRate / 100 / 12
 *   n        = years × 12
 *   monthly  = loan × r / (1 − (1 + r)^−n)    (loan / n at a 0% rate)
 *
 * Totals follow from the instalment: `totalRepaid = monthly × n`,
 * `totalInterest = totalRepaid − loan`, `totalCost = downPayment + totalRepaid`.
 * Nothing is rounded — format for display. An ESTIMATE: no fees, taxes,
 * insurance or rate changes.
 */
export function computeMortgage({ price, downPayment, years, annualRate }: MortgageInput): MortgageResult {
  const safePrice = Math.max(0, finite(price));
  const down = Math.min(safePrice, Math.max(0, finite(downPayment)));
  const loanAmount = safePrice - down;
  const payments = Math.max(0, Math.round(finite(years) * 12));
  const r = Math.max(0, finite(annualRate)) / 100 / 12;

  let monthlyPayment = 0;
  if (payments > 0 && loanAmount > 0) {
    monthlyPayment = r === 0 ? loanAmount / payments : (loanAmount * r) / (1 - Math.pow(1 + r, -payments));
  }
  const totalRepaid = monthlyPayment * payments;
  const totalInterest = payments > 0 ? Math.max(0, totalRepaid - loanAmount) : 0;
  return {
    loanAmount,
    monthlyPayment,
    payments,
    totalRepaid,
    totalInterest,
    totalCost: down + totalRepaid,
  };
}

/** Rounded, grouped digits without a currency: 1234567.8 → "1,234,568". */
export function formatPlainAmount(value: number): string {
  const rounded = Math.round(finite(value));
  const sign = rounded < 0 ? '-' : '';
  return sign + String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** "250,000" / "€ 250.000" → 250000; anything without digits → 0. */
export function parseAmount(text: string): number {
  const digits = text.replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

/** "3,5" / "3.5 %" → 3.5; unparseable → 0. */
export function parseRate(text: string): number {
  const cleaned = text.replace(',', '.').replace(/[^\d.]/g, '');
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}
