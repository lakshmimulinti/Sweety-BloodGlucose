const pool = require('../db/pool');

const ALLOWED_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

// Helper to get today's date in YYYY-MM-DD
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Validation logic for creating or updating a reading
async function validateReadingData(userId, { date, slot, value }, excludeReadingId = null) {
  // 1. Value is required
  if (value === undefined || value === null || value === '') {
    return { valid: false, error: 'Please enter a glucose value.' };
  }

  // 2. Value must be a whole number between 40 and 600
  const numVal = Number(value);
  if (!Number.isInteger(numVal) || numVal < 40 || numVal > 600) {
    return { valid: false, error: 'Value must be between 40 and 600 mg/dl.' };
  }

  // Check slot is valid
  if (!slot || !ALLOWED_SLOTS.includes(slot)) {
    return {
      valid: false,
      error: `Invalid time slot. Allowed slots: ${ALLOWED_SLOTS.join(', ')}.`
    };
  }

  // Date format check
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { valid: false, error: 'Please provide a valid date in YYYY-MM-DD format.' };
  }

  // 3. Date cannot be in the future
  const today = getTodayDateString();
  if (date > today) {
    return { valid: false, error: 'Date cannot be in the future.' };
  }

  // 4. Only one reading per slot per day
  let slotQuery = 'SELECT id FROM readings WHERE user_id = $1 AND date = $2 AND slot = $3';
  let slotParams = [userId, date, slot];
  if (excludeReadingId) {
    slotQuery += ' AND id != $4';
    slotParams.push(excludeReadingId);
  }
  const existingSlot = await pool.query(slotQuery, slotParams);
  if (existingSlot.rows.length > 0) {
    return { valid: false, error: `You already have an ${slot} reading for this date.` };
  }

  // 5. Maximum 4 readings per day (relevant when inserting new reading or changing date)
  if (!excludeReadingId) {
    const countRes = await pool.query(
      'SELECT COUNT(*)::int as count FROM readings WHERE user_id = $1 AND date = $2',
      [userId, date]
    );
    if (countRes.rows[0].count >= 4) {
      return { valid: false, error: 'You can add only 4 readings per day.' };
    }
  }

  return { valid: true, sanitizedValue: numVal };
}

// POST /api/readings - Add reading
async function addReading(req, res) {
  try {
    const { date, slot, value, notes } = req.body;
    const userId = req.user.id;

    const validation = await validateReadingData(userId, { date, slot, value });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const insertRes = await pool.query(
      `INSERT INTO readings (user_id, date, slot, value, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, TO_CHAR(date, 'YYYY-MM-DD') as date, slot, value, notes, created_at`,
      [userId, date, slot, validation.sanitizedValue, notes ? notes.trim() : null]
    );

    return res.status(201).json({
      message: 'Reading added successfully!',
      reading: insertRes.rows[0]
    });
  } catch (err) {
    console.error('addReading error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: `You already have an ${req.body.slot} reading for this date.` });
    }
    return res.status(500).json({ error: 'Server error while adding reading.' });
  }
}

// GET /api/readings - View readings with optional pagination and filters
async function getReadings(req, res) {
  try {
    const userId = req.user.id;
    const { page, limit, date, month, slot } = req.query;

    let whereClauses = ['user_id = $1'];
    let params = [userId];
    let paramIndex = 2;

    if (date) {
      whereClauses.push(`date = $${paramIndex}`);
      params.push(date);
      paramIndex++;
    }

    if (month) {
      // month format: YYYY-MM
      whereClauses.push(`TO_CHAR(date, 'YYYY-MM') = $${paramIndex}`);
      params.push(month);
      paramIndex++;
    }

    if (slot && ALLOWED_SLOTS.includes(slot)) {
      whereClauses.push(`slot = $${paramIndex}`);
      params.push(slot);
      paramIndex++;
    }

    const whereSQL = whereClauses.join(' AND ');

    // Total count for pagination
    const countRes = await pool.query(
      `SELECT COUNT(*)::int as total FROM readings WHERE ${whereSQL}`,
      params
    );
    const total = countRes.rows[0].total;

    let querySQL = `
      SELECT id, user_id, TO_CHAR(date, 'YYYY-MM-DD') as date, slot, value, notes, created_at
      FROM readings
      WHERE ${whereSQL}
      ORDER BY date DESC, id DESC
    `;

    // Bonus task: Pagination on GET /readings (?page=1&limit=20)
    let pageNum = null;
    let limitNum = null;
    if (page || limit) {
      pageNum = Math.max(1, parseInt(page || '1', 10));
      limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
      const offset = (pageNum - 1) * limitNum;
      querySQL += ` LIMIT ${limitNum} OFFSET ${offset}`;
    }

    const result = await pool.query(querySQL, params);

    return res.status(200).json({
      readings: result.rows,
      pagination: pageNum ? {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      } : null
    });
  } catch (err) {
    console.error('getReadings error:', err);
    return res.status(500).json({ error: 'Server error retrieving readings.' });
  }
}

// PUT /api/readings/:id - Edit reading
async function updateReading(req, res) {
  try {
    const readingId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { date, slot, value, notes } = req.body;

    // Check reading belongs to user
    const existing = await pool.query(
      'SELECT id FROM readings WHERE id = $1 AND user_id = $2',
      [readingId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    const validation = await validateReadingData(userId, { date, slot, value }, readingId);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const updateRes = await pool.query(
      `UPDATE readings
       SET date = $1, slot = $2, value = $3, notes = $4
       WHERE id = $5 AND user_id = $6
       RETURNING id, user_id, TO_CHAR(date, 'YYYY-MM-DD') as date, slot, value, notes, created_at`,
      [date, slot, validation.sanitizedValue, notes ? notes.trim() : null, readingId, userId]
    );

    return res.status(200).json({
      message: 'Reading updated successfully!',
      reading: updateRes.rows[0]
    });
  } catch (err) {
    console.error('updateReading error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: `You already have an ${req.body.slot} reading for this date.` });
    }
    return res.status(500).json({ error: 'Server error updating reading.' });
  }
}

// DELETE /api/readings/:id - Delete reading
async function deleteReading(req, res) {
  try {
    const readingId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id',
      [readingId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found or unauthorized.' });
    }

    return res.status(200).json({ message: 'Reading deleted successfully.', id: readingId });
  } catch (err) {
    console.error('deleteReading error:', err);
    return res.status(500).json({ error: 'Server error deleting reading.' });
  }
}

module.exports = {
  addReading,
  getReadings,
  updateReading,
  deleteReading,
  ALLOWED_SLOTS
};
