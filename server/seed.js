const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'sweety_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || undefined,
});

const createTablesSQL = `
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

const ALLOWED_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

async function runSeed() {
  const client = await pool.connect();
  try {
    console.log('--- Sweety Database Seed Script ---');
    console.log('1. Setting up tables (users, readings)...');
    await client.query(createTablesSQL);
    console.log('   ✓ Tables and indexes verified.');

    // 2. Create Demo User
    const demoEmail = 'demo@kenpath.com';
    const demoPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(demoPassword, 10);

    console.log(`2. Setting up demo user: ${demoEmail}...`);

    let userRes = await client.query('SELECT id FROM users WHERE email = $1', [demoEmail]);
    let userId;

    if (userRes.rows.length === 0) {
      const insertUser = await client.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        ['Lakshmi (Kenpath Evaluator)', demoEmail, passwordHash]
      );
      userId = insertUser.rows[0].id;
      console.log(`   ✓ Created new user (ID: ${userId})`);
    } else {
      userId = userRes.rows[0].id;
      // Update password hash to guarantee match
      await client.query('UPDATE users SET password_hash = $1, name = $2 WHERE id = $3', [
        passwordHash,
        'Lakshmi (Kenpath Evaluator)',
        userId
      ]);
      console.log(`   ✓ Existing demo user verified (ID: ${userId})`);
    }

    // Also support demo@sweety.com for convenience
    const altEmail = 'demo@sweety.com';
    let altRes = await client.query('SELECT id FROM users WHERE email = $1', [altEmail]);
    if (altRes.rows.length === 0) {
      await client.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)',
        ['Lakshmi Demo Patient', altEmail, passwordHash]
      );
    }

    // 3. Clean old readings for the demo user for idempotent seeding
    console.log('3. Populating 45 days of realistic clinical glucose readings...');
    await client.query('DELETE FROM readings WHERE user_id = $1', [userId]);

    const now = new Date();
    let insertedCount = 0;

    // Generate 45 days of entries backwards from today
    for (let dayOffset = 45; dayOffset >= 0; dayOffset--) {
      const d = new Date(now);
      d.setDate(d.getDate() - dayOffset);
      const dateStr = d.toISOString().split('T')[0];

      // On today, log 3 slots so 1 slot is pending; on other days log 3 or 4 slots
      const slotsForDay = dayOffset === 0 ? 3 : (dayOffset % 3 === 0 ? 3 : 4);

      for (let sIndex = 0; sIndex < slotsForDay; sIndex++) {
        const slot = ALLOWED_SLOTS[sIndex];

        // Realistic clinical values:
        // Fasting: 85-110 mg/dL, Post-meal: 115-165 mg/dL
        let baseValue = slot.includes('fasting') ? 92 : 132;
        let variation = Math.round(Math.sin((dayOffset + sIndex) * 1.5) * 22);
        let value = Math.max(68, Math.min(210, baseValue + variation));

        const sampleNotes = [
          'Felt energetic, light walking',
          'Sourdough toast and eggs',
          'Brown rice and grilled chicken',
          'Light dinner, 20-min post-meal walk',
          'Fasting morning baseline',
          'High fiber salad with olive oil'
        ];
        const note = sampleNotes[(dayOffset + sIndex) % sampleNotes.length];

        await client.query(
          `INSERT INTO readings (user_id, date, slot, value, notes)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, date, slot) DO UPDATE SET value = EXCLUDED.value`,
          [userId, dateStr, slot, value, `${note} (Time: 08:30 AM)`]
        );
        insertedCount++;
      }
    }

    console.log(`   ✓ Successfully inserted ${insertedCount} readings.`);
    console.log('========================================================');
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log(`Demo Account Credentials:`);
    console.log(`  Email:    ${demoEmail}`);
    console.log(`  Password: ${demoPassword}`);
    console.log('========================================================');
  } catch (err) {
    console.error('❌ Error during database seeding:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();

