const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const environment = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: (process.env.CLIENT_URL || 'https://visitor-managenment-system-internsh-rho.vercel.app').replace(/\/+$/, ''),
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: parseInt(process.env.DB_PORT || '3306', 10),
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || '',
    NAME: process.env.DB_NAME || 'visitor_db',
  },
  JWT: {
    SECRET: process.env.JWT_SECRET || 'visitor-management-secret-key-change-in-production',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'visitor-management-refresh-secret-key-change-in-production',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  // Temporary credentials issued when an administrator registers an employee.
  // The employee must change their password within this window on first login.
  TEMP_PASSWORD_EXPIRATION_HOURS: parseInt(process.env.TEMP_PASSWORD_EXPIRATION_HOURS || '24', 10),
};

module.exports = environment;
