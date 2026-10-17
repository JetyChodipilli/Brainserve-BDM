// scripts/clean-db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bdm_platform',
});

async function clean() {
  const client = await pool.connect();
  try {
    console.log('🧹 Purging all demo user accounts, deals, tasks, and sessions for clean real-world registration...');
    await client.query('BEGIN');

    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM hr_tasks');
    await client.query('DELETE FROM deal_status_history');
    await client.query('DELETE FROM deal_versions');
    await client.query('DELETE FROM deals');
    await client.query('DELETE FROM user_sessions');
    await client.query('DELETE FROM password_resets');
    await client.query('DELETE FROM business_targets');
    await client.query('DELETE FROM users');
    await client.query('DELETE FROM audit_logs');

    await client.query('COMMIT');
    console.log('✨ Database is completely clean! Zero dummy/seeded user accounts remain.');
    console.log('👉 First user can now register as CEO at /register.');
    console.log('👉 Subsequent users can register as HR or BDM at /register.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to clean database:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

clean();
