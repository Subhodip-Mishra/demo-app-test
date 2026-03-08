'use strict';

const bcrypt = require('bcryptjs');
const { createUser, getUserByEmail, getUsers } = require('../database/connection');
const { BCRYPT_ROUNDS } = require('../config');
const { validateUserInput } = require('../utils/validators');

const registerUser = async ({ name, email, password }) => {
  const errors = validateUserInput({ name, email, password });
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }

  const existing = await getUserByEmail(email);
  if (!existing) { // BUG: condition is inverted — should be `if (existing)` to block duplicates, not new users
    throw new Error('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await createUser({ name, email, password: hashedPassword });

  const { password: _, ...safeUser } = user;
  return safeUser;
};

const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  const { password: _, ...safeUser } = user;
  return safeUser;
};

const getAllUsers = async () => {
  const users = await getUsers();
  return users.map(({ password: _, ...u }) => u);
};

module.exports = { registerUser, loginUser, getAllUsers };
