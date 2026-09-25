# HostelOps — Hostel Asset & Lifecycle Management System

An enterprise-grade, full-stack Hostel Asset Management and Lifecycle Management System designed for educational institutions, university residential hostels, and facility operations. Built with a modern **React 19 + Redux Toolkit** frontend and an **Express 5 + MongoDB / Mongoose** backend.

---

## 📌 Problem Statement

Hostel residential management requires precise accounting of thousands of physical assets across hundreds of student rooms, common halls, mess facilities, and maintenance stores. Manual ledgers or simple ticketing apps suffer from:
- Stale inventory records and missing equipment during semester room check-outs.
- Incorrect transfer history when items move between hostel rooms.
- Lack of physical verification and QR telemetry.
- Uncalculated financial depreciation and absence of certified disposal write-offs.
- Insecure endpoints, privilege escalation risks, and client-side authentication bypasses.

**HostelOps** resolves these operational challenges by providing complete end-to-end lifecycle tracking: procurement register, allocation, room-to-room transfers, return check-in, maintenance tickets, QR code generation/scanning, physical room audits, and certified disposal.

---

## 🚀 Key Features

- **End-to-End Asset Lifecycle Tracking:**
  - **Asset Register:** Procurement logs with original purchase cost, straight-line depreciation rate, supplier details, warranty expiration, and unique asset tags.
  - **Room Allocation:** Assignment of in-store inventory to specific hostel rooms and student residents with digital audit logs.
  - **Transfer History (Fixed):** Atomic inter-room/block transfers tracking exact source (`from_location`, `from_student`) and destination (`to_location`, `to_student`).
  - **Return & Check-in:** Semester vacation returns with condition inspection and optional penalty assessment.
  - **Maintenance Work Orders:** Reporting of broken equipment, priority level triage, technician assignment, repair cost recording, and resolution tracking.
  - **Physical Room Audits:** Fast barcode/QR scanning verification against room register to instantly detect discrepancies and flag missing equipment.
  - **Certified Disposal:** Scrap write-off authorization, salvage value recovery, and digital certificate generation preventing duplicate disposals.
  - **Student Requisition Portal:** Direct student requests for study equipment or furniture with admin approval workflow.
- **Enterprise Security & Real Authentication:**
  - Salted and hashed password storage using `bcryptjs` (passwords never stored or returned in plaintext).
  - Secure, signed JSON Web Tokens (JWT) with configurable expiration.
  - Strict Role-Based Access Control (RBAC) middleware (`authenticate`, `requireRole`, `requireAdminType`) protecting all admin operations on the backend.
  - Student self-registration strictly forced to user role with prevention of privilege escalation.
  - Centralized API interceptors injecting `Authorization: Bearer <token>` and handling 401 token expirations gracefully.
  - Persistent session management: `sessionStorage` for temporary sessions, `localStorage` for "Remember Session".
- **Dynamic Real-Time Analytics:**
  - MongoDB aggregation of physical counts (assigned, available, under maintenance, missing, disposed).
  - Live financial metrics: total purchase valuation, current depreciated value, and salvage recovered.
  - Dynamic category and block distribution graphs.
- **Physical QR Tag Operations:**
  - High-resolution printable QR labels for every physical asset tag.
  - Live QR scanner simulation with real-time asset tag lookup and condition status indicators.

---

## 👥 User Roles & Access Matrix

| Role | Portal / Scope | Key Permissions |
|---|---|---|
| **Super Admin** (`admin` / `superadmin`) | Central Operations & Admin Block | Full asset lifecycle, user administration, system settings, global reports, audit logs. |
| **Asset Admin** (`admin` / `assetadmin`) | Logistics & Stores | Asset register, allocation, transfers, returns, maintenance, physical audits, disposals, requisition review. |
| **Student Resident** (`user` / `student`) | Student Portal | View room assets, report damaged equipment, submit asset requisitions, view notifications. |
| **Technician / Staff** (`staff` / `technician`) | Field & Maintenance | View assigned maintenance work orders, update repair status, complete physical audits. |

---

## 💻 Technology Stack

- **Frontend:**
  - React 19
  - Vite 8
  - Redux Toolkit & React Redux
  - Native Vanilla CSS (CSS variables, glassmorphism, responsive themes)
- **Backend:**
  - Node.js (ES Modules)
  - Express 5
  - MongoDB Atlas & Local MongoDB Fallback
  - Mongoose 9 (Models, Transactions, Pre-save bcrypt hooks)
  - `bcryptjs` & `jsonwebtoken` (JWT)
  - `cors` & `dotenv`

---

## 🏗️ Architecture & Project Structure

```text
HostelOps/
├── frontend/
│   ├── src/
│   │   ├── components/       # Dashboards, lifecycle modals, QR scanner, login
│   │   ├── redux/            # ticketSlice.js, assetOpsSlice.js, store.js
│   │   ├── services/         # Centralized API service with Bearer auth injection
│   │   ├── utils/            # authStorage.js, translations.js, audioFx.js
│   │   ├── App.jsx           # Main viewport, role-switcher, connection banner
│   │   ├── main.jsx          # React DOM entrypoint
│   │   └── index.css         # Design tokens, theme variables, glassmorphism
│   ├── public/               # Static assets & icons
│   ├── package.json
│   ├── vite.config.js        # Vite dev proxy configuration (/api -> :5000)
│   └── eslint.config.js      # ESLint configuration
├── backend/
│   ├── db/
│   │   └── database.js       # MongoDB connection, auto-fallback, idempotent seed
│   ├── middleware/
│   │   └── auth.js           # authenticate, requireRole, requireAdminType
│   ├── models/
│   │   ├── Asset.js          # Asset, Category, Maintenance, Transfer, Audit, Disposal, Request
│   │   ├── User.js           # User schema with bcrypt pre-save hook & safe JSON export
│   │   ├── Worker.js         # Maintenance technician records
│   │   ├── Notification.js   # Standardized notifications with camelCase isRead
│   │   ├── AuditLog.js       # System audit logs
│   │   └── index.js          # Centralized Mongoose models export
│   ├── routes/
│   │   ├── auth.js           # Login, registration, profile updates, user management
│   │   ├── assets.js         # Asset register, allocate, return, transfer, audit, disposal
│   │   ├── analytics.js      # Dynamic live database aggregations & valuations
│   │   ├── notifications.js  # Notification endpoints with isRead support
│   │   ├── audit.js          # Audit logs retrieval
│   │   └── workers.js        # Staff & worker directory
│   ├── .env.example          # Clean environment variable template (no credentials)
│   ├── package.json          # Server dependencies & test script
│   ├── test_system.js        # 39-step automated integration & security test suite
│   └── server.js             # Express application entrypoint & health checks
├── .gitignore
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)
- **MongoDB** (MongoDB Atlas connection string or local MongoDB running at `mongodb://127.0.0.1:27017`)

---

### 1. Backend Setup

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your settings:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/hostelops
   JWT_SECRET=hostelops_super_secret_jwt_key_2026
   CORS_ORIGIN=http://localhost:5173
   SEED_DATABASE=false
   ```
   > **Note:** If `MONGODB_URI` points to MongoDB Atlas and network access times out, the backend automatically connects to the local MongoDB fallback at `127.0.0.1:27017`.

4. Start the backend server:
   ```bash
   npm run start
   ```
   The backend server runs at `http://localhost:5000` with the health endpoint available at `http://localhost:5000/api/health`.

---

### 2. Frontend Setup

1. Open a separate terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🔑 Predefined Accounts (For College Presentation & Testing)

| Username | Password | Role | Description |
|---|---|---|---|
| `superadmin` | `admin@123` | `admin` (Super Admin) | Campus Executive & Directorate |
| `assetadmin` | `admin@123` | `admin` (Asset Admin) | Central Stores & Logistics Manager |
| `student1` | `user@123` | `user` (Student) | Resident (Room 204, Block A) |
| `student2` | `user@123` | `user` (Student) | Resident (Room 102, Block B) |
| `staff1` | `user@123` | `staff` (Technician) | Maintenance Workshop Staff |

> **Quick Fill:** The login screen provides 1-click quick-fill buttons for demo accounts. All accounts authenticate via genuine bcrypt verification on the server.

---

## 📡 API Overview

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticate user, verify bcrypt hash, return JWT token and safe user profile.
- `POST /api/auth/register` — Public student self-registration (strictly forces `role: 'user'`).
- `POST /api/auth/users` — Super Admin creation of administrator accounts.
- `PATCH /api/auth/profile` — Self-update permitted profile fields (phone, room, block, avatar).
- `GET /api/auth/users` — Fetch directory of users (Admins & staff).

### Asset Lifecycle (`/api/assets`)
- `GET /api/assets` — Query asset registry with filters (status, category, block, condition, search).
- `GET /api/assets/:tag` — Retrieve full lifecycle history and telemetry for a specific tag.
- `POST /api/assets` — Register new procured asset (`admin` required).
- `POST /api/assets/allocate` — Allocate asset to room & student (`admin` required).
- `POST /api/assets/transfer` — Transfer asset with verified pre-mutation audit trail (`admin` required).
- `POST /api/assets/return` — Check-in return from student back to store (`admin`/`staff` required).
- `POST /api/assets/maintenance` — Report broken asset and open repair ticket (Students & Admins).
- `PATCH /api/assets/maintenance/:id` — Update maintenance ticket status and repair costs.
- `POST /api/assets/audit` — Record physical room verification and flag missing equipment.
- `POST /api/assets/disposal` — Authorize scrap write-off and record salvage value recovery (`admin` required).
- `POST /api/assets/requests` — Submit student requisition for new study equipment.
- `PATCH /api/assets/requests/:id` — Approve or reject student requisition.

### Analytics & System
- `GET /api/analytics` — Dynamic live metrics, valuation, depreciation, and distributions computed from DB.
- `GET /api/health` — Backend and MongoDB connection status.
- `GET /api/notifications` — Notification feed with standardized camelCase `isRead` property.

---

## 🧪 Testing & Verification

### Running the Test Suite
The backend includes an automated 39-step integration and security test suite validating health checks, authentication, privilege escalation blocks, asset state transitions, transfer history integrity, and analytics.

To run the test suite:
```bash
cd backend
npm test
```

### Production Build Verification
To verify the frontend builds cleanly without lint or compilation errors:
```bash
cd frontend
npm run lint
npm run build
```

---

## 🔒 Security Notes
- Database credentials must **never** be committed to source control. Always use environment variables in `.env` files.
- Real Atlas credentials previously exposed in development repositories must be rotated in the MongoDB Atlas console.
- Backend routes strictly enforce authorization via JWT payload claims; hidden UI buttons or client modifications cannot bypass server-side role validation.
