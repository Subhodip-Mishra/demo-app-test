'use strict';

const { calculateFee, processPayment, processPaymentWithDiscount } = require('../src/payments/payment.service');
const { clearDatabase } = require('../src/database/connection');

beforeEach(() => {
  clearDatabase();
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateFee
// Formula: (amount × 2.9%) + $0.30
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateFee', () => {
  test('returns correct fee for a $100 transaction — expected $3.20', () => {
    // 2.9% of $100 = $2.90  +  $0.30 fixed  =  $3.20
    // 👁️  HUMAN-ERROR CATCH: if this fails with 290.30, PLATFORM_FEE_RATE is a whole number (2.9) not a decimal (0.029)
    const fee = calculateFee(100);
    expect(fee).toBe(3.20);
  });

  test('returns correct fee for a $50 transaction — expected $1.75', () => {
    // 2.9% of $50  = $1.45  +  $0.30 fixed  =  $1.75
    const fee = calculateFee(50);
    expect(fee).toBe(1.75);
  });

  test('returns correct fee for a $200 transaction — expected $6.10', () => {
    // 2.9% of $200 = $5.80  +  $0.30 fixed  =  $6.10
    const fee = calculateFee(200);
    expect(fee).toBe(6.10);
  });

  test('throws when amount is zero', () => {
    expect(() => calculateFee(0)).toThrow('Amount must be greater than 0');
  });

  test('throws when amount is negative', () => {
    expect(() => calculateFee(-25)).toThrow('Amount must be greater than 0');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// processPayment
// ─────────────────────────────────────────────────────────────────────────────
describe('processPayment', () => {
  test('processes a $100 payment and returns correct fee and net amount', async () => {
    const payment = await processPayment(1, 100, 'usd', 'Test charge');
    expect(payment.status).toBe('completed');
    expect(payment.amount).toBe(100);
    expect(payment.fee).toBe(3.20);        // 👁️  if this is 290.30 → PLATFORM_FEE_RATE is 2.9 not 0.029
    expect(payment.netAmount).toBe(96.80);  // 👁️  if this is negative → fee rate is wrong (human error)
  });

  test('attaches userId and description to payment record', async () => {
    const payment = await processPayment(7, 100, 'usd', 'Subscription fee');
    expect(payment.userId).toBe(7);
    expect(payment.description).toBe('Subscription fee');
  });

  test('throws for negative amount', async () => {
    await expect(processPayment(1, -50)).rejects.toThrow('Invalid payment amount');
  });

  test('throws for zero amount', async () => {
    await expect(processPayment(1, 0)).rejects.toThrow('Invalid payment amount');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// processPaymentWithDiscount
// Fee must be calculated on the *discounted* amount, not the original.
// ─────────────────────────────────────────────────────────────────────────────
describe('processPaymentWithDiscount', () => {
  test('10% discount on $100 — fee is charged on $90, not $100', async () => {
    // $100 − 10% = $90 (discountedAmount)
    // fee on $90 : (90 × 0.029) + 0.30 = 2.61 + 0.30 = $2.91
    // netAmount  : 90 − 2.91 = $87.09
    const payment = await processPaymentWithDiscount(1, 100, 10, 'usd', 'Promo deal');
    expect(payment.amount).toBe(90.00);    // stored as discounted price
    expect(payment.fee).toBe(2.91);        // fee on $90 — FAILS if fee uses original $100
    expect(payment.netAmount).toBe(87.09);
  });

  test('20% discount on $200 — fee is charged on $160, not $200', async () => {
    // $200 − 20% = $160
    // fee on $160: (160 × 0.029) + 0.30 = 4.64 + 0.30 = $4.94
    // netAmount  : 160 − 4.94 = $155.06
    const payment = await processPaymentWithDiscount(2, 200, 20, 'usd', 'Flash sale');
    expect(payment.fee).toBe(4.94);        // fee on $160 — FAILS if fee uses original $200
    expect(payment.netAmount).toBe(155.06);
  });

  test('0% discount behaves like a normal payment', async () => {
    const payment = await processPaymentWithDiscount(3, 100, 0, 'usd', 'No discount');
    expect(payment.amount).toBe(100.00);
    expect(payment.fee).toBe(3.20);
    expect(payment.netAmount).toBe(96.80);
  });

  test('throws when discount is out of range', async () => {
    await expect(processPaymentWithDiscount(1, 100, 110))
      .rejects.toThrow('Discount must be between 0 and 100');
  });

  test('throws for invalid amount', async () => {
    await expect(processPaymentWithDiscount(1, -50, 10))
      .rejects.toThrow('Invalid payment amount');
  });
});