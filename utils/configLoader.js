const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const NODE_ENV = process.env.NODE_ENV || 'development';
const envFile = path.resolve(__dirname, '../config', `.env.${NODE_ENV}`);

if (!fs.existsSync(envFile)) {
  console.error(`❌ Environment file not found: ${envFile}`);
  process.exit(1);
}

const result = dotenv.config({ path: envFile });

if (result.error) {
  console.error(`❌ Failed to load environment: ${NODE_ENV}`, result.error);
  process.exit(1);
}

console.log(`✅ Loaded config from ${envFile}`);
