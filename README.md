# Hostel Asset Management System (HAMS)
### Modern Web Technologies (MWT) Full Stack College Project

[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%206-61DAFB?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%204-339933?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20%7C%20Mongoose%208-47A248?logo=mongodb)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20Bcrypt-orange?logo=jsonwebtokens)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 1. Project Overview & Problem Statement
Hostels across universities and educational institutions manage thousands of physical inventory assets—including beds, study tables, chairs, ceiling fans, electrical appliances, computers, and cupboards. Traditional paper registers or standalone spreadsheets cause severe discrepancies:
- Untracked damaged, broken, or missing equipment.
- Inability to hold residents accountable for room-assigned property.
- Lack of an immutable audit trail when rooms change hands across semesters.
- Absence of real-time search, multi-condition filtering, and backend pagination.
- Tedious manual data entry lacking bulk CSV import/export capabilities.

**Hostel Asset Management System (HAMS)** is a modern, responsive, full-stack web application developed to demonstrate core **Modern Web Technologies (MWT)** concepts. It delivers complete asset lifecycle tracking, role-based access control (Admin/Warden and Student/Resident), JWT authentication, server-side pagination, dynamic search, multi-filter sorting, CSV bulk import/export, and audit history logging.

---

## 2. Technology Stack & Modern Web Technologies (MWT) Concepts

| Layer | Technologies & Tools | MWT Concepts Demonstrated |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18, Vite 6 | Functional Components, Custom Hooks, State & Context Management, Virtual DOM |
| **Routing & Protection** | React Router DOM v6 | Nested Layouts, Client-Side SPA Routing, Protected Routes (`ProtectedRoute`, `AdminRoute`, `UserRoute`) |
| **Styling & UI Design** | Vanilla CSS Design System | Responsive Flexbox/Grid, CSS Custom Properties (Tokens), Classic Dashboard Aesthetics, Status Badges, Modals |
| **Icons & Assets** | Lucide React | Semantic SVG UI Icons, Accessible Micro-interactions |
| **HTTP Client** | Axios 1.7 | REST API Integration, JWT Request Interceptor, 401 Auto-Redirect Response Interceptor |
| **Backend Runtime** | Node.js (v18+) | Asynchronous Non-blocking Event Loop, Streams, Native Buffer Operations |
| **Backend Framework** | Express.js 4.21 | RESTful Route Handlers, Custom Middleware (`authMiddleware`, `adminMiddleware`, `errorMiddleware`), CORS |
| **File Processing** | Multer & CSV-Parser | Multi-part Form Data Parsing, In-Memory File Streams, CSV Parsing, Row Validation |
| **Database & ODM** | MongoDB & Mongoose 8 | Schema Validation, BSON Storage, Compound & Single Indexing, Population, Aggregation Pipelines |
| **Security & Auth** | JSON Web Tokens (JWT) & bcryptjs | One-way Password Hashing (Salt Rounds: 10), Bearer Token Generation & Verification |

---

## 3. System Architecture & Authentication Flow

### JWT Authentication Flow
```text
1. CLIENT (Browser)             2. EXPRESS BACKEND                3. MONGODB
       |                                |                             |
       |--- POST /api/auth/login ------>|                             |
       |    { email, password }         |--- User.findOne({email}) -->|
       |                                |<-- User doc with hash ------|
       |                                |                             |
       |                                |-- bcrypt.compare(pass, hash)|
       |                                |-- jwt.sign({ id }, secret)  |
       |<-- { token, user, success } ---|                             |
       |                                |                             |
  Store token in localStorage           |                             |
       |                                |                             |
  Subsequent API Request:               |                             |
       |--- GET /api/assets ----------->|                             |
       |    Headers: Authorization:     |                             |
       |    Bearer <token>              |-- jwt.verify(token, secret) |
       |                                |-- req.user = user           |
       |                                |-- Check req.user.role       |
       |                                |--- Query Database --------->|
       |                                |<-- Return matching data ----|
       |<-- { success: true, data } ----|                             |
```

---

## 4. Key Functional Features

### 🏢 Warden / Admin Capabilities
1. **Interactive Dashboard Metrics:** Real-time KPI counters tracking Total, Available, Assigned, Damaged, Lost, and Under Maintenance assets alongside student numbers and pending requisitions.
2. **Asset Allocation Distribution:** Visual percentage bar showing live inventory status proportions.
3. **Server-Side Pagination:** `GET /api/assets?page=1&limit=10` preventing memory overload.
4. **Multi-Condition Search & Filters:** Search by asset name, code, category, hostel block, room number, or status.
5. **Backend Sorting:** Sort by Newest First, Oldest First, Name (A-Z), Name (Z-A), Price (Low to High), and Price (High to Low).
6. **Bulk CSV Import:** Upload `.csv` spreadsheet; backend parses every row, detects duplicate asset codes in DB and CSV, validates required fields, inserts valid records into MongoDB, and generates an error report with row numbers for failed rows.
7. **Filtered CSV Export:** Export current filtered catalog with a single click as a standard RFC-4180 CSV document.
8. **Student Requisition Approvals:** Review room equipment requests with automatic conflict prevention (prevents allocating an asset already assigned).
9. **Damage & Loss Incident Management:** Review student defect reports, change state to 'Under Maintenance', and restore assets upon repair.
10. **Resident Account Management:** Create, inspect assigned inventory, and remove student accounts.
11. **Immutable Audit Trail:** Chronological log tracking who created, assigned, modified, or repaired each asset.

### 🎓 Student / Resident Capabilities
1. **Student Portal Dashboard:** Overview of assigned room assets and ticket status.
2. **Room Assets View:** Detailed listing of all equipment allocated to the resident's room.
3. **Asset Requisition:** Submit requisitions with justification for needed room amenities.
4. **Defect & Loss Reporting:** Report damaged or missing equipment with severity classification (Minor, Moderate, Severe, Total Loss).
5. **Personal Activity History:** Chronological audit timeline of all personal requests and reported tickets.
6. **Profile Settings:** Update contact phone number and account credentials.

---

## 5. REST API Documentation

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new resident account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token |
| `POST` | `/api/auth/logout` | Private | Logout user session |
| `GET` | `/api/auth/me` | Private | Retrieve current authenticated user profile |
| `PUT` | `/api/auth/profile` | Private | Update user phone number or password |

### Assets Routes (`/api/assets`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/assets` | Private | Paginated list with search, filter, and sort (`page`, `limit`, `search`, `category`, `status`, `sort`, `order`) |
| `GET` | `/api/assets/export` | Admin | Bulk CSV export respecting active filter query parameters |
| `POST` | `/api/assets/import` | Admin | Bulk CSV import via multipart form data (`file`) |
| `GET` | `/api/assets/stats/overview`| Private | Summary counts, distribution aggregation, and recent feeds |
| `GET` | `/api/assets/my-assets` | Student | Paginated list of assets assigned to logged-in student |
| `GET` | `/api/assets/:id` | Private | Single asset details with asset history audit trail |
| `POST` | `/api/assets` | Admin | Register new asset in inventory store |
| `PUT` | `/api/assets/:id` | Admin | Update asset specifications |
| `DELETE`| `/api/assets/:id` | Admin | Permanently delete asset and record audit trail |
| `PUT` | `/api/assets/:id/assign` | Admin | Assign asset to student resident |
| `PUT` | `/api/assets/:id/unassign` | Admin | Return asset to Available status |

### User Routes (`/api/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Admin | Paginated list of users (`page`, `limit`, `role`, `search`) |
| `POST` | `/api/users` | Admin | Create new student or warden account |
| `GET` | `/api/users/:id` | Admin | User profile with currently assigned inventory assets |
| `PUT` | `/api/users/:id` | Admin | Update user account details |
| `DELETE`| `/api/users/:id` | Admin | Remove user and free their assigned assets |

### Requisitions & Incidents (`/api/requests`, `/api/damage`, `/api/history`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/requests` | Admin | Paginated requisition queue (`page`, `limit`, `status`, `search`) |
| `GET` | `/api/requests/my` | Student | Requisitions submitted by logged-in student |
| `POST` | `/api/requests` | Student | Submit new asset requisition |
| `PUT` | `/api/requests/:id` | Admin | Approve or reject requisition with stock allocation |
| `GET` | `/api/damage` | Admin | Paginated damage/loss incident reports |
| `GET` | `/api/damage/my` | Student | Damage/loss incident reports by logged-in student |
| `POST` | `/api/damage` | Private | Report broken or lost asset |
| `PUT` | `/api/damage/:id` | Admin | Update incident status & synchronize asset condition |
| `GET` | `/api/history` | Private | Paginated audit trail events (`page`, `limit`, `search`, `action`) |

---

## 6. Project Directory Structure

```text
HostelOps/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── controllers/
│   │   ├── assetController.js    # Asset CRUD, Pagination, Search, CSV Import/Export
│   │   ├── authController.js     # JWT register, login, logout, profile
│   │   ├── damageController.js   # Incident reporting & asset synchronization
│   │   ├── requestController.js  # Requisition workflow & duplicate allocation check
│   │   └── userController.js     # User management & audit log retrieval
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification & RBAC authorization
│   │   └── errorMiddleware.js    # Centralized 404 & error handler
│   ├── models/
│   │   ├── Asset.js              # Asset schema with indexes
│   │   ├── AssetHistory.js       # Immutable audit log schema
│   │   ├── AssetRequest.js       # Student requisition schema
│   │   ├── DamageReport.js       # Damage & loss incident schema
│   │   └── User.js               # User schema with bcrypt password hashing
│   ├── routes/
│   │   ├── assetRoutes.js        # Asset endpoints with multer upload
│   │   ├── authRoutes.js         # Authentication endpoints
│   │   ├── damageRoutes.js       # Incident endpoints
│   │   ├── historyRoutes.js      # Audit log endpoint
│   │   ├── requestRoutes.js      # Requisition endpoints
│   │   └── userRoutes.js         # User management endpoints
│   ├── seed/
│   │   └── seedData.js           # Database seeder with demo accounts
│   ├── package.json
│   └── server.js                 # Express server bootstrap
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Modal.jsx         # Accessible modal dialog
│   │   │   ├── Navbar.jsx        # Top header with user pill & logout
│   │   │   ├── Pagination.jsx    # Reusable server-side pagination component
│   │   │   ├── ProtectedRoute.jsx# Auth & RBAC route guard
│   │   │   ├── Sidebar.jsx       # Classic navy navigation sidebar
│   │   │   ├── StatCard.jsx      # Metrics card with custom accent icons
│   │   │   └── StatusBadge.jsx   # Pill badge for Available, Assigned, Damaged, Lost
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global React context for auth state & token storage
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Public landing page with 1-click viva demo login
│   │   │   ├── admin/
│   │   │   │   ├── AdminDamageReports.jsx # Damage & loss resolution view
│   │   │   │   ├── AdminDashboard.jsx     # Warden metrics & distribution progress
│   │   │   │   ├── AdminRequests.jsx      # Requisition approval & allocation
│   │   │   │   ├── AssetHistoryView.jsx   # System audit trail logs
│   │   │   │   ├── ManageAssets.jsx       # Asset CRUD, Bulk CSV Import/Export
│   │   │   │   └── ManageUsers.jsx        # Resident & admin accounts directory
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx              # UNTOUCHED classic login page design
│   │   │   │   └── Register.jsx           # Student registration page
│   │   │   └── user/
│   │   │       ├── MyAssets.jsx           # Student's assigned room assets
│   │   │       ├── ReportIssue.jsx        # Defect/Loss submission form
│   │   │       ├── RequestAsset.jsx       # Equipment requisition form
│   │   │       ├── UserDashboard.jsx      # Student dashboard & quick actions
│   │   │       ├── UserHistory.jsx        # Personal activity timeline
│   │   │       └── UserProfile.jsx        # Account contact settings
│   │   ├── services/
│   │   │   └── api.js            # Axios client with JWT interceptors & 401 redirect
│   │   ├── App.jsx               # React Router routes setup
│   │   ├── index.css             # Design tokens & custom CSS rules
│   │   └── main.jsx              # Vite entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 7. How to Run Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Community Server installed locally and running on default port `27017`

### Step 1: Start MongoDB
Ensure MongoDB service is running:
```powershell
# Verify MongoDB service status
Get-Service MongoDB
```

### Step 2: Run the Backend
```powershell
cd backend
npm install
node server.js
```
The server will start on port `5000`:
- REST API URL: `http://localhost:5000/api`
- Health Check: `http://localhost:5000/api/health`
- *Note:* If the database is empty, the server automatically populates demo data!

### Step 3: Run the Frontend
In a second terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 8. Demo Accounts for College Viva / Demonstration

| Role | Account Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Chief Warden (Admin)** | Dr. Ramesh Kumar | `admin1@hostel.edu` | `password123` |
| **Assistant Warden (Admin)** | Ms. Sunita Sharma | `admin2@hostel.edu` | `password123` |
| **Student Resident 1** | Rahul Verma (Room A-101) | `rahul@hostel.edu` | `password123` |
| **Student Resident 2** | Priya Nair (Room B-204) | `priya@hostel.edu` | `password123` |

*Tip:* Both the **Login Page** and the **Landing Page** include 1-click demo login buttons so you can demonstrate the complete workflow during examination without typing credentials manually.

---

## 9. MWT College Examination Viva Questions & Answers

**Q1: What is JWT and how does it protect routes in this project?**
> A: JSON Web Token is a compact, URL-safe token containing a signed JSON payload (`{ id: user._id }`). Upon successful login, the server generates the token using `jwt.sign()` and a secret key. The frontend stores it in `localStorage` and includes it in the `Authorization: Bearer <token>` header of every Axios request. Backend middleware (`authMiddleware`) decodes the token with `jwt.verify()`, fetches the user, and validates their role before allowing route execution.

**Q2: How is server-side pagination implemented and why is it preferred over frontend pagination?**
> A: Server-side pagination uses query parameters `page` and `limit` in Mongoose queries via `.skip((page - 1) * limit).limit(limit)`. This ensures that only the requested slice of documents is retrieved from MongoDB and transmitted over the network. Frontend pagination transfers all records at once, which degrades performance and memory as the database grows to thousands of records.

**Q3: How does the Bulk CSV Import feature work and how are invalid rows handled?**
> A: The admin uploads a `.csv` file via multipart form data (`multer.memoryStorage()`). The backend converts the file buffer into a readable stream and pipes it into `csv-parser`. Each row is sanitized and checked for mandatory fields (`assetName`, `assetCode`, `category`). The system verifies that the asset code is unique in the CSV and does not already exist in MongoDB. Valid records are inserted in bulk via `Asset.insertMany()`, while failed rows are collected into an array with row numbers and exact rejection reasons displayed in the UI.

**Q4: How does the Requisition Approval prevent assigning the same asset twice?**
> A: In `requestController.js`, when a warden approves a requisition, the controller queries the asset and verifies `if (asset.status !== 'Available')`. If another warden or user already claimed that asset, the transaction is rejected with an HTTP 400 error message, preventing race conditions and duplicate allocations.

**Q5: How does the application maintain state across page reloads?**
> A: Through `AuthContext.jsx`. On initial load, a `useEffect` hook reads `hams_token` and `hams_user` from browser `localStorage`. If present, it populates React state so the user remains authenticated without logging in repeatedly. If an API request returns HTTP 401 (token expired), the Axios response interceptor clears `localStorage` and redirects the user to `/login`.
