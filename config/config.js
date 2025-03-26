const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: path.resolve(
    process.cwd(),
    `.env.${process.env.NODE_ENV || 'development'}`
  ),
});

module.exports = {
  ADD_EVENT_API_URL: process.env.ADD_EVENT_API_URL,
  circuitBreaker: {
    failureThreshold: Number(process.env.FAILURE_THRESHOLD || 3),
    failureWindow: Number(process.env.FAILURE_WINDOW || 30000),
    initialBackoff: Number(process.env.INITIAL_BACKOFF || 2000),
    maxBackoff: Number(process.env.MAX_BACKOFF || 30000),
  },
};
