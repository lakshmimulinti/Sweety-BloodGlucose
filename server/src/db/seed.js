const bcrypt = require('bcryptjs');
const pool = require('./pool');
const { createTablesQuery } = require('./migrate');

async function seed() {
  try {
    console.log('Ensuring tables exist...');
    await pool.query(createTablesQuery);

    console.log('Seeding demo user and blood glucose readings...');

    const demoEmail = 'demo@sweety.com';
    const demoPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(demoPassword, 10);

    // Upsert demo user
    let userRes = await pool.query('SELECT * FROM users WHERE email = $1', [demoEmail]);
    let userId;

    if (userRes.rows.length === 0) {
      const insertUser = await pool.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        ['Lakshmi Demo Patient', demoEmail, passwordHash]
      );
      userId = insertUser.rows[0].id;
      console.log(`Created demo user ID: ${userId}`);
    } else {
      userId = userRes.rows[0].id;
      console.log(`Demo user already exists (ID: ${userId})`);
    }

    // Clean existing readings for this demo user to make seed repeatable
    await pool.query('DELETE FROM readings WHERE user_id = $1', [userId]);

    const slots = [
      'Morning (fasting)',
      'After breakfast',
      'After lunch',
      'After dinner'
    ];

    // Seed readings for the last 45 days up to today
    const now = new Date();
    let totalInserted = 0;

    for (let dayOffset = 45; dayOffset >= 0; dayOffset--) {
      const d = new Date(now);
      d.setDate(d.getDate() - dayOffset);
      const dateStr = d.toISOString().split('T')[0];

      // Give 2 to 4 readings per day
      const numReadings = dayOffset === 0 ? 3 : (dayOffset % 2 === 0 ? 4 : 3);

      for (let s = 0; s < numReadings; s++) {
        const slot = slots[s];
        // Generate realistic glucose values:
        // Fasting: 85-115, Post-meal: 110-165
        let base = slot.includes('fasting') ? 95 : 135;
        let jitter = Math.floor(Math.sin(dayOffset + s) * 20);
        let val = Math.max(70, Math.min(220, base + jitter));

        await pool.query(
          `INSERT INTO readings (user_id, date, slot, value, notes)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, date, slot) DO UPDATE SET value = EXCLUDED.value`,
          [userId, dateStr, slot, val, `Sample entry for ${slot}`]
        );
        totalInserted++;
      }
    }

    console.log(`Seeding complete! Inserted ${totalInserted} readings for demo user.`);
    console.log(`Demo login: ${demoEmail} / ${demoPassword}`);
  } catch (err) {
    console.error('Seed script error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;

