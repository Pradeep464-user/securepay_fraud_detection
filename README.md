# SecurePay: Fintech Payment Platform & Rule-Based Behavioral Fraud Detection System

> **Notice:** SecurePay uses a rule-based behavioural detection engine and does not use machine learning.

SecurePay is a complete, full-stack digital banking and payment application designed with a transparent, highly auditable **Rule-Based Fraud Detection Engine**. It simulates real-world electronic fund transfers, evaluates every outbound transfer across behavioural parameters (historical volume baseline, transaction velocity/bursts, and diurnal timing anomalies), and flags suspicious activity for administrator review with escrow protection.

---

## 1. Project Title & Description
**SecurePay** is an enterprise-grade fintech banking simulation and transaction surveillance platform. It bridges standard consumer digital wallet functions (account management, peer-to-peer transfers, real-time balance tracking, and ledger history) with a security compliance surveillance backend.

## 2. Problem Statement
Digital financial fraud continues to surge with rapid consumer adoption of instant peer-to-peer (P2P) transfers. While complex machine learning models are frequently proposed, in regulated financial institutions, **black-box ML models introduce severe compliance risks, opacity in audit trails, explainability failures, and unpredictable drift**. 

Financial regulators require:
- Complete transparency in decision justification.
- Instant, deterministic reason codes for flagged or halted transactions.
- Zero reliance on intrusive external tracking (such as device fingerprinting, GPS geolocation, or telemetry scraping).

SecurePay solves this challenge by deploying a **deterministic, rule-based behavioral fraud surveillance engine** that inspects internal transaction telemetry alone, calculating a composite risk score (0–100) and enforcing real-time transactional holds.

## 3. Objectives
1. **Autonomous Financial Surveillance:** Calculate amount, frequency, and timing risk scores for each transfer in real time.
2. **Deterministic Risk Stratification:** Categorize transactions into `LOW` (0–39), `MEDIUM` (40–69), and `HIGH` (70–100) risk tiers.
3. **Escrow & Fund Protection:** Instantly complete normal transfers while holding high-risk transfers in escrow pending analyst review.
4. **Analyst Investigation Console:** Provide security compliance officers with comprehensive behavioral profiling (user average transfer size, historical volume, past flags, velocity spikes) and administrative actions (`APPROVE`, `FLAG AS FRAUD`, `KEEP UNDER REVIEW`).
5. **Full Balance Reconciliation:** Guarantee that flagged transactions refunded by analysts restore the sender's account balance, while approved transactions credit the recipient.

---

## 4. User Roles & Capabilities

### Normal User (`role: 'user'`)
- **Login Experience:** Clean, glassmorphic login card over the dedicated payment background (`login-background.webp`) accessible at `http://127.0.0.1:5500/index.html`.
- **Registration:** Instant account creation with unique account number generation (`SP` + 8 digits) and customizable initial demonstration balance.
- **Account Dashboard:** Live balance display, inbound/outbound transfer metrics, security hold monitor.
- **Send Money:** Peer-to-peer transfer with email or account number lookup, real-time balance validation, preset test triggers (Normal $150, High Value $18k, Night Hours 3 AM, Combined High Risk $24k).
- **Transaction History:** Filterable ledger with real-time status (`COMPLETED`, `MONITORED`, `UNDER_REVIEW`, `FRAUD`), risk badges, and click-to-view intelligence modal.

### Security Analyst / Administrator (`role: 'admin'`)
- **Admin Portal:** Accessible at `/` via Admin Switch with credentials (`admin@securepay.com` / `Admin@123`).
- **Surveillance Dashboard:** System-wide metrics (total settled volume, active transaction count, risk tier breakdown, open alert queue).
- **Suspicious Transaction Review Queue:** Filterable queue prioritizing `UNDER_REVIEW` and high-risk transactions.
- **Fraud Alerts Queue:** List of open, investigated, and resolved fraud incidents with automated reason codes.
- **Investigation Console:** In-depth modal detailing sender behavioral profile, deviation from historical average, velocity in last 2 minutes, timing score, and decision actions (`Approve`, `Flag as Fraud`, `Keep Under Review`) with audit notes.
- **User Directory:** Audit overview of all registered customer balances and accounts.

---

## 5. Technology Stack

- **Frontend:**
  - React 18 (Vite Bundler)
  - Vanilla CSS3 Design System (Glassmorphism, High Contrast Dark Mode, Plus Jakarta Sans, JetBrains Mono)
  - Lucide React (Fintech UI Icons)
  - Vite Proxy (Port 5500 proxying `/api` requests to Port 5000)
- **Backend:**
  - Node.js (v18+) & Express.js
  - MongoDB & Mongoose ORM
  - JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
  - CORS & Dotenv
- **Surveillance Engine:**
  - Deterministic Rule-Based Behavioral Engine (`backend/services/fraudDetection.js`)

---

## 6. Architecture & System Flow

```
[ React 18 Frontend ] (Port 5500)
       │  HTTP /api/
       ▼
[ Express.js REST API ] (Port 5000)
       │
       ├─► [ Auth Middleware & Admin Guard ]
       ├─► [ MongoDB Database ] (Users, Transactions, FraudAlerts)
       │
       ▼
[ Rule-Based Fraud Detection Engine ]
       │
       ├─► 1. Amount Analysis (Historical mean deviation & absolute tiers)
       ├─► 2. Velocity Analysis (Bursts in <25s, 2-min & 10-min rolling count)
       ├─► 3. Timing Analysis (Anomalous night hours: 01:00 AM - 05:00 AM)
       │
       ▼
[ Composite Risk Score (0 - 100) ]
       ├─► LOW (0-39)      --> Status: COMPLETED (Immediate settlement)
       ├─► MEDIUM (40-69)  --> Status: MONITORED (Settled with audit flag)
       └─► HIGH (70-100)   --> Status: UNDER_REVIEW (Funds held in Escrow)
                                   │
                                   ▼
                            [ Fraud Alert Created ]
                                   │
                                   ▼
                            [ Admin Investigation ]
                                   │
                ┌──────────────────┼──────────────────┐
                ▼                  ▼                  ▼
          [ APPROVE ]       [ FLAG FRAUD ]    [ UNDER REVIEW ]
       (Credit Receiver)   (Refund Sender)   (Keep Hold Active)
```

---

## 7. Database Schemas (Mongoose)

### 1. User (`backend/models/User.js`)
- `name`: String
- `email`: String (Unique, Lowercase)
- `password`: String (Bcrypt Hash, 10 salt rounds)
- `role`: `'user'` | `'admin'`
- `balance`: Number
- `accountNumber`: String (Unique, e.g. `SP84920193`)
- `createdAt`: Date

### 2. Transaction (`backend/models/Transaction.js`)
- `transactionId`: String (Unique, e.g. `TX-MUB0W0Y4-JTRB`)
- `sender`: ObjectId -> `User`
- `receiver`: ObjectId -> `User`
- `senderEmail`: String
- `receiverEmail`: String
- `amount`: Number
- `status`: `'COMPLETED'` | `'MONITORED'` | `'UNDER_REVIEW'` | `'FRAUD'` | `'REJECTED'`
- `riskScore`: Number (0–100)
- `riskLevel`: `'LOW'` | `'MEDIUM'` | `'HIGH'`
- `breakdown`:
  - `amountScore`: Number (0–100)
  - `frequencyScore`: Number (0–100)
  - `timingScore`: Number (0–100)
  - `reasons`: Array of Strings
  - `historicalAverage`: Number
  - `recentCount`: Number
  - `timingHour`: Number
- `adminDecision`:
  - `decision`: `'APPROVED'` | `'FLAGGED_FRAUD'` | `'UNDER_REVIEW'` | `'NONE'`
  - `decidedBy`: ObjectId -> `User`
  - `decidedAt`: Date
  - `notes`: String

### 3. FraudAlert (`backend/models/FraudAlert.js`)
- `alertId`: String (Unique, e.g. `ALT-MUB0W0Y4-K3L9`)
- `transaction`: ObjectId -> `Transaction`
- `sender`: ObjectId -> `User`
- `riskScore`: Number
- `riskLevel`: String
- `reasons`: Array of Strings
- `status`: `'OPEN'` | `'INVESTIGATING'` | `'RESOLVED'` | `'DISMISSED'`
- `notes`: String
- `resolvedBy`: ObjectId -> `User`
- `resolvedAt`: Date

---

## 8. Fraud Detection Rules & Risk Scoring

The engine operates strictly on deterministic rules:
- **No machine learning.**
- **No location or GPS tracking.**
- **No device fingerprinting.**
- **No external Python services.**

### Rule 1: Amount Analysis (`amountScore` 0–100)
1. **Behavioral Deviation:** If the user has prior transactions, calculate the historical mean.
   - If `amount >= 8 * mean`: `+55` points.
   - If `amount >= 4 * mean`: `+40` points.
   - If `amount >= 2.5 * mean`: `+25` points.
2. **Absolute Thresholds:**
   - If `amount >= $50,000`: `+55` points.
   - If `amount >= $20,000`: `+40` points.
   - If `amount >= $10,000`: `+25` points.

### Rule 2: Velocity / Frequency Analysis (`frequencyScore` 0–100)
1. **Rapid Burst:** If a previous transaction by the same user occurred within the last 25 seconds: `+45` points.
2. **2-Minute Velocity:**
   - If `>= 4` transactions within 2 minutes: `+55` points.
   - If `>= 2` transactions within 2 minutes: `+35` points.
3. **10-Minute Velocity:**
   - If `>= 6` transactions within 10 minutes: `+30` points.

### Rule 3: Transaction Timing Analysis (`timingScore` 0–100)
1. **Critical Dormant Night Hours (01:00 AM – 04:59 AM):** `+55` points.
2. **Late-Night Shoulder Hours (23:00 PM – 00:59 AM, 05:00 AM):** `+25` points.
3. **Standard Day / Business Hours:** `0` points.

### Composite Score & Escalation Logic
- **Weighted Baseline:** `(0.45 * amountScore) + (0.35 * frequencyScore) + (0.20 * timingScore)`
- **Escalation Rules:**
  - Compound Anomaly (`amountScore >= 45` AND `frequencyScore >= 45`): Escalates to `85`.
  - Night High Value (`amountScore >= 50` AND `timingScore >= 50`): Escalates to `75`.
  - Single Metric Crisis (`amountScore >= 80` OR `frequencyScore >= 80`): Escalates to `75`.
- **Classification:**
  - **LOW (0–39):** Status `COMPLETED`. Normal transfer.
  - **MEDIUM (40–69):** Status `MONITORED`. Settled with surveillance flag.
  - **HIGH (70–100):** Status `UNDER_REVIEW`. Held in escrow, Fraud Alert generated.

---

## 9. API Endpoints

### Authentication (`/api/auth`)
- `POST /register` — Register a new account (`name`, `email`, `password`, `initialBalance`).
- `POST /login` — Authenticate and receive JWT token + user payload.
- `GET /me` — Retrieve current authenticated user profile & updated balance (Protected).

### Transactions (`/api/transactions`)
- `POST /send` — Execute P2P transfer (`receiverIdentifier`, `amount`, `customHour`).
- `GET /my-transactions` — Retrieve authenticated user transaction ledger (Protected).
- `GET /:id` — Retrieve detailed intelligence for single transaction (Protected).

### Administration (`/api/admin` — Admin Guard)
- `GET /metrics` — Retrieve system aggregate stats, risk distribution, volume, and open alerts.
- `GET /transactions` — Filter transactions by status or risk tier.
- `GET /transactions/:id` — Full investigation data: behavioral baseline profile + alert + rules.
- `POST /transactions/:id/decision` — Submit action: `APPROVE`, `FLAG_FRAUD`, `KEEP_UNDER_REVIEW` + audit notes.
- `GET /alerts` — List all open/resolved fraud alerts.
- `GET /users` — List registered users and balances.

---

## 10. Installation & Setup

### Prerequisites
- Node.js (v18 or v20+)
- MongoDB (Running locally on `127.0.0.1:27018` or `127.0.0.1:27017`)

### Environment Configuration
The backend uses `backend/.env` (a template is provided at `backend/.env.example`):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27018/securepay
JWT_SECRET=securepay_jwt_secret_key_super_secure_2026
CLIENT_URL=http://127.0.0.1:5500
```

### Running Backend
```bash
cd backend
npm install
node server.js
```
The backend initializes on `http://127.0.0.1:5000` and seeds:
- Default Admin: `admin@securepay.com` / `Admin@123`
- Demo Recipient: `alex.smith@example.com` / `User@123`

### Running Frontend
```bash
cd frontend
npm install
npm run dev
```
The React frontend starts at `http://127.0.0.1:5500/` and is accessible at `http://127.0.0.1:5500/index.html`.

---

## 11. End-to-End Automated Testing

A test suite verifying all 22 required test cases is included in `backend/test_api.js`:
```bash
cd backend
node test_api.js
```
**Test Coverage:**
1. Health Check Endpoint
2. User Registration
3. Duplicate Email Prevention
4. Invalid Password Handling
5. Valid Login & JWT Verification
6. User Profile `/me` Endpoint
7. Self-Transfer Prevention
8. Nonexistent Receiver Handling
9. Insufficient Balance Handling
10. Normal Low Risk Transfer (`COMPLETED`)
11. High Amount Anomaly Scoring
12. Rapid Burst Velocity Detection
13. Unusual Timing Detection (3:00 AM)
14. Combined High Risk Escalation (`UNDER_REVIEW`)
15. User Transaction History Retrieval
16. Admin Authentication
17. Unauthorized Admin Access Rejection (403)
18. Admin Surveillance Metrics API
19. Admin Fraud Alerts Queue
20. Admin Behavioral Profile Investigation
21. Admin Decision: Keep Under Review
22. Admin Decision: Approve Transaction

A dedicated fraud refund verification test is also included:
```bash
cd backend
node test_fraud_decision.js
```

---

## 12. Complete Live Demo Scenario

1. **User Sign In:**
   - Open browser at `http://127.0.0.1:5500/index.html`.
   - View the normal user login card over the exact attached background image (`login-background.webp`).
   - Click **"Demo User Fill"** (`alex.smith@example.com` / `User@123`) or register a new customer account.
   - Click **Sign In**.

2. **Normal Low-Risk Transfer:**
   - In the User Dashboard, click **Send Money**.
   - Select the preset **"Normal ($150)"** to `alex.smith@example.com`.
   - Click **Execute Transfer**.
   - Result: Risk Level `LOW`, Status `COMPLETED`. Balance updates instantly.

3. **High-Risk Combined Transfer (Anomalous Volume + 3 AM Hour):**
   - Click **Send Money**.
   - Click the preset **"Combined High Risk ($24k + 3 AM)"**.
   - Click **Execute Transfer**.
   - Result: Rule-Based Engine calculates risk score `>= 70` (`HIGH`), flags transaction as `UNDER_REVIEW`, debits sender into escrow, and generates a `FraudAlert`.

4. **Security Analyst Investigation:**
   - Click **Sign Out** or navigate to Admin switch (`admin@securepay.com` / `Admin@123`).
   - Access the **Admin Dashboard** (displays dark navy surveillance console).
   - In the **Suspicious Queue**, locate the flagged transaction.
   - Click **Investigate** to review the sender's baseline deviation, triggered rule reasons, and velocity metrics.
   - Enter analyst notes and click **Flag as Fraud** (or **Approve**).
   - Result: The transaction status updates to `FRAUD`, the associated `FraudAlert` is resolved, and the held funds are refunded back to the user!
