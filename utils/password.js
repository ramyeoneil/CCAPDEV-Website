const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false;
  if (hash.startsWith('$2')) return bcrypt.compare(plain, hash);
  return plain === hash;
}

module.exports = { hashPassword, verifyPassword };
