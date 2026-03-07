'use strict';

const { savePayment, getPaymentsByUser } = require('../database/connection');

// Fee structure (mirrors Stripe's pricing model)
const STRIPE_FIXED_FEE = 0.30; // $0.30 flat fee per transaction

// BUG: Developer wrote the percentage as a whole number instead of a decimal.
// Should be 0.029 (i.e. 2.9 / 100). This makes every fee calculation 100x too large.
const PLATFORM_FEE_RATE = 2.9;

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

module.exports = { calculateFee, processPayment, getPaymentHistory };
