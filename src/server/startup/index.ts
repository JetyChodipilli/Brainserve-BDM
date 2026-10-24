// src/server/startup/index.ts
/**
 * Bootstrap entry point for production.
 * Performs early environment validation before starting the Next.js server.
 */
// src/server/startup/index.ts
/**
 * Bootstrap entry point for production.
 * Performs early environment validation before starting the Next.js server.
 */
// Register ts-node to allow importing TypeScript files at runtime
require('ts-node').register({ transpileOnly: true });
const { validateEnv } = require('./validateEnv');
// Abort immediately if required env vars are missing.
validateEnv();

const next = require('next');
const http = require('http');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const port = parseInt(process.env.PORT ?? '3000', 10);
  http.createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const port = parseInt(process.env.PORT ?? '3000', 10);
  http.createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
