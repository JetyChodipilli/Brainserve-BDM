// scripts/validateEnv.js
const path = require('path');
// Resolve the TS file via ts-node/register if needed, but we can require compiled JS.
// For simplicity, use dynamic import with ts-node if present.
(async () => {
  try {
    // Register ts-node to handle .ts files
    require('ts-node').register({ transpileOnly: true });
    const { validateEnv } = require(path.resolve(__dirname, '../src/server/startup/validateEnv'));
    validateEnv();
    console.log('Environment validation passed');
  } catch (err) {
    console.error('Environment validation failed:', err.message);
    process.exit(1);
  }
})();
