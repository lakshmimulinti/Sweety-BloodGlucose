const app = require('./app');
const pool = require('./db/pool');
const { createTablesQuery } = require('./db/migrate');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Auto-migrate tables on boot if not already present
    await pool.query(createTablesQuery);
    console.log('Database tables verified/migrated.');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Sweety Server is running on http://127.0.0.1:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start Sweety server:', err);
    process.exit(1);
  }
}

start();

