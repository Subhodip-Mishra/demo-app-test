'use strict';

const { savePayment, getPaymentsByUser } = require('../database/connection');

// Fee structure (mirrors Stripe's pricing model)
const STRIPE_FIXED_FEE = 0.30; // $0.30 flat fee per transaction

// ⚠️  HUMAN-ERROR WATCH: This MUST be a decimal (0.029), NOT a whole number (2.9).
// Writing 2.9 here makes every fee 100× too large — e.g. $100 → fee $290.30 instead of $3.20.
// Formula: 2.9% == 2.9 / 100 == 0.029
const PLATFORM_FEE_RATE = 0.029;

/**
 * Calculate the platform processing fee for a transaction.
 * Formula: (amount * 2.9%) + $0.30
 *
 * @param {number} amount - Transaction amount in USD
 * @returns {number} Fee in USD rounded to 2 decimal places
 */
const calculateFee = (amount) => {
  if (typeof amount !== 'number' || amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  const percentageFee = amount * PLATFORM_FEE_RATE;
  return parseFloat((percentageFee + STRIPE_FIXED_FEE).toFixed(2));
};

/**
 * Process a payment for a user.
 *
 * @param {number} userId
 * @param {number} amount - Amount in USD
 * @param {string} currency
 * @param {string} description
 */
const processPayment = async (userId, amount, currency = 'usd', description = '') => {
  if (typeof amount !== 'number' || amount <= 0 || !isFinite(amount)) {
    throw new Error('Invalid payment amount');
  }

  const fee = calculateFee(amount);
  const netAmount = parseFloat((amount - fee).toFixed(2));

  if (netAmount <= 0) {
    throw new Error('Amount too small to process after fees');
  }

  const payment = await savePayment({
    userId,
    amount,
    fee,
    netAmount,
    currency,
    description,
    status: 'completed',
  });

  return payment;
};

const getPaymentHistory = async (userId) => {
  return getPaymentsByUser(userId);
};

/**
 * Process a payment with a promotional discount applied before fee calculation.
 *
 * @param {number} userId
 * @param {number} amount       - Original amount in USD
 * @param {number} discountPercent - Discount percentage (0–100)
 * @param {string} currency
 * @param {string} description
 */
const processPaymentWithDiscount = async (
  userId,
  amount,
  discountPercent = 0,
  currency = 'usd',
  description = ''
) => {
  if (typeof amount !== 'number' || amount <= 0 || !isFinite(amount)) {
    throw new Error('Invalid payment amount');
  }
  if (typeof discountPercent !== 'number' || discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount must be between 0 and 100');
  }

  const discountAmount   = parseFloat((amount * discountPercent / 100).toFixed(2));
  const discountedAmount = parseFloat((amount - discountAmount).toFixed(2));

  // Fee applied to the discounted price so the customer pays less
  const fee       = calculateFee(amount);   // BUG: should be calculateFee(discountedAmount)
  const netAmount = parseFloat((discountedAmount - fee).toFixed(2));

  if (netAmount <= 0) {
    throw new Error('Amount too small to process after fees');
  }

  const payment = await savePayment({
    userId,
    amount: discountedAmount,
    originalAmount: amount,
    discountPercent,
    fee,
    netAmount,
    currency,
    description,
    status: 'completed',
  });

  return payment;
};

module.exports = { calculateFee, processPayment, getPaymentHistory, processPaymentWithDiscount };
