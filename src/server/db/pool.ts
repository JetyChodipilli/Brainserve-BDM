// src/server/db/pool.ts
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bdm_platform';

// Singleton pool instance for server runtime
declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

export const pool: Pool =
  global.__pgPool ||
  new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__pgPool = pool;
}

export async function query<R extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<R>> {
  const start = Date.now();
  const res = await pool.query<R>(text, params);
  const duration = Date.now() - start;
  if (duration > 500) {
    console.warn(`⚠️ Slow query (${duration}ms): ${text.substring(0, 100)}...`);
  }
  return res;
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
