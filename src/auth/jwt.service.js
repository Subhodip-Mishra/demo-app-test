'use strict';

const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET + '-v2'); // BUG: '-v2' suffix not added to generateToken — secret mismatch
};

module.exports = { generateToken, verifyToken };
