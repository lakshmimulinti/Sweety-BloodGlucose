const pool = require('./pool');

const createTablesQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot VARCHAR(50) NOT NULL,
    value INTEGER NOT NULL CHECK (value >= 40 AND value <= 600),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_date_slot UNIQUE (user_id, date, slot)
  );

  CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings (user_id, date);
`;

async function runMigrations() {
  try {
    console.log('Running database migrations for Sweety...');
    await pool.query(createTablesQuery);
    console.log('Migrations completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations, createTablesQuery };
