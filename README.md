# Sweety – Blood Glucose Tracker 🩸
> Full-Stack Diabetes Management Web Application (Node.js + Express + PostgreSQL + React + TypeScript)  
> Submission for **Kenpath** – Junior Full Stack Developer (JavaScript & AI)

---

## 📋 Features Overview

### 1. User Authentication (Sign up & Log in)
- User registration with `name`, `email`, and `password`.
- Passwords securely hashed with **bcrypt** (cost factor 10) — zero plain-text storage.
- JWT-based authorization (`Bearer <token>`).
- Strict user data isolation: each patient can only view, edit, and report on their own readings.
- Modern dual sliding auth container with 1-click **Demo Account** pre-fill for fast evaluation.

### 2. Blood Glucose Readings (CRUD + Strict Validations)
- Tracks blood glucose readings with 4 standardized slots:
  - `Morning (fasting)`
  - `After breakfast`
  - `After lunch`
  - `After dinner`
- **Validation Rules & Exact Error Messages**:
  | Rule | Enforced Error Message |
  |---|---|
  | Value is required | `"Please enter a glucose value."` |
  | Integer between 40 and 600 | `"Value must be between 40 and 600 mg/dl."` |
  | Only one reading per slot per day | `"You already have an [Slot] reading for this date."` |
  | Maximum 4 readings per day | `"You can add only 4 readings per day."` |
  | Date cannot be in the future | `"Date cannot be in the future."` |
- Reading actions: **Add Reading**, **View Glucose Logs**, **Edit Reading**, and **Delete Reading**.

### 3. Clinical Reports
- Statistical summary displaying:
  - **Highest Reading**
  - **Lowest Reading**
  - **Average Reading** (rounded to 1 decimal place)
  - **Number of Readings**
  - Friendly empty state when no data exists for the selected window.
- Three standardized report ranges:
  - **Daily**: The selected date (e.g. 15 Oct 2026), listing each reading with its slot.
  - **Month-to-date**: 1st of the month up to the selected date (e.g. 1 Oct – 15 Oct 2026).
  - **Monthly**: The entire previous month (e.g. 1 Sep – 30 Sep 2026).

### 4. Standout Features & Bonuses
- **AI Health Assistant / Insights** (Specialized for JavaScript & AI role): Pattern recognition detecting Dawn Phenomenon, post-meal glycemic surges, and consistency ratios.
- **Interactive Recharts Trend Line**: Visualizes glucose fluctuations with a green reference zone (70–140 mg/dL).
- **Time in Range (TIR) Bar**: Multi-segment percentage breakdown (Low, In Range, High).
- **Pagination**: Backend API supports `GET /api/readings?page=1&limit=20`.
- **Automated Tests**: Comprehensive test suite using Jest and Supertest verifying authentication, all 5 validation rules, user isolation, and report metrics.
- **Docker Compose**: Containerized PostgreSQL and Node API.
- **Database Seed Script**: Pre-loads demo user with 160 realistic clinical readings.

---

## 🏗️ Architecture & Tech Stack

- **Backend**: Node.js, Express, `pg` (PostgreSQL client pool), `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`.
- **Database**: PostgreSQL 16+ with ACID transactions, unique constraints `(user_id, date, slot)`, and composite indexes.
- **Frontend**: React 19, TypeScript, Vite, `recharts`, `lucide-react`.
- **Testing**: Jest, Supertest.

```
Sweety-BloodGlucose/
├── server/
│   ├── src/
│   │   ├── controllers/      # authController, readingController, reportController
│   │   ├── db/               # pool.js, migrate.js, seed.js
│   │   ├── middleware/       # auth.js (JWT authentication)
│   │   ├── routes/           # authRoutes, readingRoutes, reportRoutes
│   │   ├── app.js            # Express app configuration
│   │   └── server.js         # Server entry point
│   ├── tests/                # api.test.js (10 Jest & Supertest suites)
│   ├── Dockerfile
│   └── package.json
├── sweetybloodtest/          # React + Vite Frontend
│   ├── src/
│   │   ├── components/       # AuthCard, ReadingModal, LogsTable, KPICards, ReportsView, GlucoseChart, AIInsights
│   │   ├── services/         # api.ts (REST client & localStorage auth manager)
│   │   ├── App.tsx           # Main application state & tabs
│   │   └── App.css           # Custom healthcare design system
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/) (v14+) running on port 5432 or Docker

---

### Step 1: Database Setup

1. Open PostgreSQL (`psql` or pgAdmin) and create the database:
   ```sql
   CREATE DATABASE sweety_db;
   ```

2. Configure environment variables in `server/.env` (or copy from `.env.example`):
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=sweety_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=sweety_blood_glucose_tracker_jwt_secret_key_2026
   NODE_ENV=development
   ```

---

### Step 2: Install & Seed Backend

1. Navigate to the `server/` directory:
   ```bash
   cd server
   npm install
   ```

2. Run the database seed script:
   ```bash
   npm run seed
   ```
   *This automatically creates tables, registers the demo user, and populates 45 days of realistic glucose readings.*

   **Demo User Credentials:**
   - **Email:** `demo@sweety.com`
   - **Password:** `Password123!`

---

### Step 3: Run Backend Tests

Verify that all authentication, 5 validation rules, user isolation, and report calculations pass:
```bash
npm test
```
*Expected output: `10 passed, 10 total`.*

---

### Step 4: Start the Backend Server

```bash
npm start
# Server starts on http://localhost:5000
```

---

### Step 5: Start the Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd sweetybloodtest
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm start
   # Frontend opens on http://localhost:3000
   ```

3. Open your browser at `http://localhost:3000/`. You can click **"Fill Kenpath Demo Patient (1-Click)"** on the sign-in screen to log in immediately!

---

## 🐳 Running with Docker (Bonus Task)

To run PostgreSQL and the Node.js backend with Docker Compose:
```bash
docker-compose up --build
```

---

## 📝 Notes & Assumptions

1. **Date Storage & Timezones**:
   - Dates are stored as `DATE` (`YYYY-MM-DD`) in PostgreSQL to guarantee date consistency across differing timezones.
   - Future date validation compares the input date string with the server's local date.

2. **Strict Daily Slot Uniqueness**:
   - The database enforces a `UNIQUE(user_id, date, slot)` constraint in addition to API-level validation, preventing any race condition or duplicate slot entries.

3. **Previous Month Report Calculation**:
   - As per the specification example (selected date 15 Oct 2026 -> 1 Sep – 30 Sep 2026), the monthly report dynamically calculates the entire preceding calendar month, adjusting leap years and month boundaries accurately.

4. **Future Improvements with More Time**:
   - **Continuous Glucose Monitoring (CGM) Integration**: Webhook/Bluetooth sync with Dexcom or FreeStyle Libre.
   - **Doctor Portal / Role-based Access**: A specialized `/doctor` route where healthcare practitioners can review patient cohorts and export PDF clinical summaries.
   - **Redis Caching**: Cache expensive multi-month aggregate queries with automatic cache invalidation upon reading creation/modification.
   - **Push/WhatsApp Notification Reminders**: Reminding patients who have logged fewer than 4 readings before 9 PM.
