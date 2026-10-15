const crypto = require('crypto');

const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghjkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SPECIALS = '!@#$&*-_+=';

function secureRandomInt(max) {
  return crypto.randomInt(0, max);
}

function pickFrom(set, length) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += set[secureRandomInt(set.length)];
  }
  return result;
}

function shuffle(str) {
  const chars = str.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function generateTemporaryPassword() {
  const core = pickFrom(LOWERCASE + UPPERCASE + DIGITS + SPECIALS, 8);
  const parts = [
    pickFrom(UPPERCASE, 1),
    pickFrom(LOWERCASE, 1),
    pickFrom(DIGITS, 1),
    pickFrom(SPECIALS, 1),
  ].join('');
  return `TEMP-${shuffle(parts + core)}`;
}

function isValidTemporaryPassword(password) {
  if (!password || typeof password !== 'string') return false;
  return /^TEMP-/.test(password)
    && password.length >= 12
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /[0-9]/.test(password)
    && /[!@#$%^&*(),.?":{}|<>]/.test(password);
}

module.exports = {
  generateTemporaryPassword,
  isValidTemporaryPassword,
};
