const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const { createTablesQuery } = require('../src/db/migrate');

let tokenUserA = '';
let tokenUserB = '';
let userAId = null;
let userBId = null;

beforeAll(async () => {
  await pool.query(createTablesQuery);
  // Clean up any test users
  await pool.query("DELETE FROM users WHERE email IN ('test_user_a@test.com', 'test_user_b@test.com')");

  // Register User A
  const resA = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'User A',
      email: 'test_user_a@test.com',
      password: 'password123'
    });
  tokenUserA = resA.body.token;
  userAId = resA.body.user.id;

  // Register User B
  const resB = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'User B',
      email: 'test_user_b@test.com',
      password: 'password123'
    });
  tokenUserB = resB.body.token;
  userBId = resB.body.user.id;
});

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email IN ('test_user_a@test.com', 'test_user_b@test.com')");
  await pool.end();
});

describe('Authentication API', () => {
  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test_user_a@test.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid email or password/i);
  });

  it('should login successfully with correct password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test_user_a@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test_user_a@test.com');
  });

  it('should prevent registering with existing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User A Duplicate', email: 'test_user_a@test.com', password: 'password123' });
    expect(res.status).toBe(409);
  });
});

describe('Reading Validation Rules (Kenpath Requirements)', () => {
  const testDate = '2026-10-15'; // A past date for test stability

  it('Rule 1: Value is required -> "Please enter a glucose value."', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ date: testDate, slot: 'Morning (fasting)', value: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Please enter a glucose value.');
  });

  it('Rule 2: Value must be between 40 and 600 -> "Value must be between 40 and 600 mg/dl."', async () => {
    const resLow = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ date: testDate, slot: 'Morning (fasting)', value: 35 });
    expect(resLow.status).toBe(400);
    expect(resLow.body.error).toBe('Value must be between 40 and 600 mg/dl.');

    const resHigh = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ date: testDate, slot: 'Morning (fasting)', value: 650 });
    expect(resHigh.status).toBe(400);
    expect(resHigh.body.error).toBe('Value must be between 40 and 600 mg/dl.');
  });

  it('Rule 5: Date cannot be in the future -> "Date cannot be in the future."', async () => {
    const futureDate = '2099-01-01';
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ date: futureDate, slot: 'Morning (fasting)', value: 100 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Date cannot be in the future.');
  });

  it('Rule 3: Only one reading per slot per day -> "You already have an After lunch reading for this date."', async () => {
    // Add After lunch first
    const firstRes = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ date: testDate, slot: 'After lunch', value: 130 });
    expect(firstRes.status).toBe(201);

    // Try adding After lunch again on same date
    const dupRes = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ date: testDate, slot: 'After lunch', value: 140 });
    expect(dupRes.status).toBe(400);
    expect(dupRes.body.error).toBe('You already have an After lunch reading for this date.');
  });

  it('Rule 4: Maximum 4 readings per day -> "You can add only 4 readings per day."', async () => {
    // We already have 'After lunch' (1). Add the other 3 slots:
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ date: testDate, slot: 'Morning (fasting)', value: 95 });

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ date: testDate, slot: 'After breakfast', value: 120 });

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ date: testDate, slot: 'After dinner', value: 145 });

    // Try adding a 5th (simulating a request if slots allowed or duplicate attempt)
    const fifthRes = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ date: testDate, slot: 'After dinner', value: 150 });

    expect(fifthRes.status).toBe(400);
  });
});

describe('User Isolation & Reports', () => {
  it('User B should not see User A readings', async () => {
    const resB = await request(app)
      .get('/api/readings?date=2026-10-15')
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect(resB.status).toBe(200);
    expect(resB.body.readings.length).toBe(0);
  });

  it('Daily report should return accurate metrics and slot list for selected date', async () => {
    const resA = await request(app)
      .get('/api/reports?date=2026-10-15')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(resA.status).toBe(200);
    const daily = resA.body.reports.daily;
    expect(daily.metrics.count).toBe(4);
    expect(daily.metrics.lowest).toBe(95);
    expect(daily.metrics.highest).toBe(145);
    expect(daily.readings.length).toBe(4);
  });
});

