# Sweety – Blood Glucose Tracker 🩸
> **Full Stack Diabetes Tracking Application** built with Node.js, Express.js, PostgreSQL, and React.js.  
> Developed for the **Junior Full Stack Developer – JavaScript & AI** assignment at **Kenpath**.

---

## 📑 Table of Contents
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
  - [1. Authentication & Security](#1-authentication--security)
  - [2. Readings CRUD & Protocol Slots](#2-readings-crud--protocol-slots)
  - [3. Strict Validation Engine](#3-strict-validation-engine)
  - [4. Clinical Reports & Health Overview](#4-clinical-reports--health-overview)
  - [5. AI Assistant & Pattern Recognition](#5-ai-assistant--pattern-recognition)
  - [6. Interactive Visualizations](#6-interactive-visualizations)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
  - [Step 1: Clone Repository](#step-1-clone-repository)
  - [Step 2: Database Setup & Environment Variables](#step-2-database-setup--environment-variables)
  - [Step 3: Database Seeding](#step-3-database-seeding)
  - [Step 4: Start Backend Server](#step-4-start-backend-server)
  - [Step 5: Start Frontend Client](#step-5-start-frontend-client)
- [Running Automated Tests](#-running-automated-tests)
- [Docker Deployment](#-docker-deployment)
- [Technical Notes & Assumptions](#-technical-notes--assumptions)

---

## 🔍 Project Overview

**Sweety** is a specialized, patient-centric web application designed for diabetes management. It allows patients to record up to **4 blood glucose readings per day** across standardized physiological intervals, view dynamic daily and monthly analytical reports, and receive automated glycemic pattern insights.

The solution is architected with a decoupled **Express.js REST API** powered by a relational **PostgreSQL** database and a modern **React.js + TypeScript** client.

---

## ✨ Key Features

### 1. Authentication & Security
- **Registration & Login**: Secure user onboarding with full name, email, and password.
- **Bcrypt Password Hashing**: Passwords are salted and hashed using `bcrypt` (10 rounds) — zero plain-text storage.
- **Stateless JWT Authorization**: Secured via `Authorization: Bearer <token>` middleware.
- **Patient Isolation**: Row-level query isolation (`WHERE user_id = req.user.id`) ensures users strictly see only their own clinical records.
- **Dual Sliding Panel UI**: Responsive dual-mode authentication card with real-time per-field error validation and a celebratory registration pop-up modal.

### 2. Readings CRUD & Protocol Slots
- Exactly 4 clinical time slots per day:
  1. `Morning (fasting)`
  2. `After breakfast`
  3. `After lunch`
  4. `After dinner`
- **Daily 4-Slot Tracker**: Visual cards displaying which daily slots are logged (with value, status tag, and edit/delete actions) vs pending slots with quick-log triggers.

### 3. Strict Validation Engine
The application enforces Kenpath's exact business rules both programmatically on the client and with ACID constraints on the backend:

| Validation Rule | Exact Error Message |
|---|---|
| **Value is required** | `"Please enter a glucose value."` |
| **Value between 40 and 600** | `"Value must be between 40 and 600 mg/dl."` |
| **Only one reading per slot per day** | `"You already have an [Slot] reading for this date."` |
| **Maximum 4 readings per day** | `"You can add only 4 readings per day."` |
| **Date cannot be in the future** | `"Date cannot be in the future."` |

*Client form uses custom JavaScript validation (native HTML5 tooltips removed) to ensure error banners display cleanly within the modal without closing prematurely.*

### 4. Clinical Reports & Health Overview
- **Symmetrical 4-Card Overview**:
  - **Average Glucose**: Formatted and rounded to 1 decimal place.
  - **Glucose Range & Spread**: Peak, Nadir, and absolute fluctuation variation (`±mg/dL`).
  - **Total Readings**: Count of logged readings within the selected window.
  - **Time in Range (TIR)**: Multi-segment bar illustrating percentage breakdown (Low `<70`, In-Range `70–140`, High `>140 mg/dL`).
- **3 Clinical Report Windows**:
  - **Daily**: Selected calendar date, listing individual readings with time slots.
  - **Month-to-Date (MTD)**: 1st of the active month to the selected reference date.
  - **Monthly**: Complete prior calendar month (e.g., 1 Sep – 30 Sep when Oct is selected).
- **Friendly Empty State**: Informative placeholder when no records exist for the specified date range.

### 5. AI Assistant & Pattern Recognition (Role Highlight)
- Evaluates glucose readings for clinical patterns:
  - **Dawn Phenomenon**: Flags repeated morning fasting elevations (`>125 mg/dL`).
  - **Post-Prandial Glycemic Surges**: Detects post-lunch or post-dinner spikes (`>160 mg/dL`).
  - **Hypoglycemia Alerts**: Warns when readings drop below `70 mg/dL`.
  - **Estimated HbA1c (eHbA1c)**: Calculated via clinical formula `(Average + 46.7) / 28.7`.

### 6. Interactive Visualizations
- Interactive **Recharts** trend line visualizing blood sugar fluctuations over time against an optimal shaded target band (`70–140 mg/dL`).

---

## 🛠️ Architecture & Tech Stack

```
Sweety-BloodGlucose/
├── server/                   # Backend Express & PostgreSQL API
│   ├── src/
│   │   ├── controllers/      # authController, readingController, reportController
│   │   ├── db/               # pool.js, migrate.js
│   │   ├── middleware/       # auth.js (JWT validation)
│   │   ├── routes/           # authRoutes, readingRoutes, reportRoutes
│   │   ├── app.js            # Express application setup
│   │   └── server.js         # Server entry point (bound to 0.0.0.0:5000)
│   ├── tests/                # api.test.js (10 Jest & Supertest integration tests)
│   ├── seed.js               # Database seeding script
│   ├── package.json
│   └── Dockerfile
├── sweetybloodtest/          # Frontend React.js + TypeScript
│   ├── src/
│   │   ├── components/       # AuthCard, KPICards, DailySlotsTracker, ReadingModal,
│   │   │                     # LogsTable, ReportsView, GlucoseChart, AIInsights
│   │   ├── services/         # api.ts (REST client & auth storage)
│   │   ├── App.tsx           # Main application state & tab coordinator
│   │   └── App.css           # Custom healthcare design system
│   ├── vite.config.ts        # Vite configuration & backend proxy
│   └── package.json
├── docker-compose.yml        # Docker composition for PostgreSQL & Backend
├── .env.example              # Root environment template
└── README.md
```

---

## 📦 Prerequisites

Before running the application, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v14.0 or higher) running locally or via Docker
- [Git](https://git-scm.com/)

---

## 🚀 Installation & Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/<your-username>/Sweety-BloodGlucose.git
cd Sweety-BloodGlucose
```

---

### Step 2: Database Setup & Environment Variables

1. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE sweety_db;
   ```

2. Create a `.env` file inside the `server/` directory (you can copy `.env.example`):
   ```bash
   cp .env.example server/.env
   ```

3. Configure your database credentials in `server/.env`:
   ```env
   PORT=5000
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_NAME=sweety_db
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   JWT_SECRET=sweety_blood_glucose_tracker_jwt_secret_key_2026
   NODE_ENV=development
   ```

---

### Step 3: Database Seeding

Run the seed script to automatically verify tables, create the demo account, and populate **45 days of realistic clinical readings**:

```bash
cd server
npm install
node seed.js
```

**Pre-configured Evaluator Demo Credentials:**
- **Email:** `demo@kenpath.com` *(or `demo@sweety.com`)*
- **Password:** `Password123!`

*(Note: On the login screen, clicking the **"Fill Kenpath Demo Patient (1-Click)"** button will auto-fill these credentials for instant evaluation.)*

---

### Step 4: Start Backend Server

From the `server/` directory:
```bash
npm start
```
The backend API starts on **`http://127.0.0.1:5000`** (Health check: `http://localhost:5000/api/health`).

---

### Step 5: Start Frontend Client

In a new terminal window:
```bash
cd sweetybloodtest
npm install
npm run dev
```
*(Alternatively, you can run `npm start`)*.  
Open your browser and navigate to **`http://localhost:3000`**.

---

## 🧪 Running Automated Tests

A comprehensive integration test suite verifies authentication, user isolation, all 5 validation rules, and mathematical report accuracy:

```bash
cd server
npm test
```

**Test Coverage Highlights:**
- `√ should reject login with wrong password`
- `√ should login successfully with correct password`
- `√ should prevent registering with existing email`
- `√ Rule 1: Value is required -> "Please enter a glucose value."`
- `√ Rule 2: Value must be between 40 and 600 -> "Value must be between 40 and 600 mg/dl."`
- `√ Rule 3: Only one reading per slot per day -> "You already have an After lunch reading for this date."`
- `√ Rule 4: Maximum 4 readings per day -> "You can add only 4 readings per day."`
- `√ Rule 5: Date cannot be in the future -> "Date cannot be in the future."`
- `√ User B should not see User A readings`
- `√ Daily report should return accurate metrics and slot list for selected date`

---

## 🐳 Docker Deployment (Optional Bonus)

To launch the PostgreSQL database and backend service in isolated Docker containers:

```bash
docker-compose up --build
```
This spins up PostgreSQL on port `5432` and the Node.js API on port `5000`.

---

## 📝 Technical Notes & Assumptions

1. **Date & Timezone Normalization**:
   - Blood glucose dates are stored as ISO `DATE` (`YYYY-MM-DD`) in PostgreSQL to avoid UTC-offset timezone shifts across client machines.
   - Future date comparisons evaluate against the patient's local calendar day (`todayStr = YYYY-MM-DD`).

2. **Database Integrity & Concurrency**:
   - In addition to express middleware checks, a composite unique constraint `CONSTRAINT unique_user_date_slot UNIQUE (user_id, date, slot)` exists at the database level to prevent race conditions from inserting duplicate slot entries.

3. **Previous Month Date Math**:
   - The Monthly report dynamically identifies the entire calendar month prior to the reference date (e.g., reference date `15 Oct 2026` targets `1 Sep – 30 Sep 2026`), handling leap years and variable month lengths via `new Date(year, month - 1, 0).getDate()`.

4. **Clinical eHbA1c Estimation Formula**:
   - Average blood glucose is translated to estimated HbA1c using the established American Diabetes Association (ADA) linear relationship:
     $$\text{eHbA1c (\%)} = \frac{\text{Average Glucose (mg/dL)} + 46.7}{28.7}$$

5. **Future Scope & Enhancements**:
   - Continuous Glucose Monitoring (CGM) API integrations (Dexcom / Abbott FreeStyle Libre).
   - Redis caching for multi-month aggregates with automatic invalidation on reading mutations.
   - Multi-tenant Practitioner/Doctor portal for assigning and reviewing patient cohorts.
