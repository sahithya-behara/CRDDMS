# CRDDMS — College Records Digitalization & Document Management System

A production-ready, full-stack university ERP-style platform for digitizing academic and administrative records with OCR, compliance management, and role-based access control.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **Docker Desktop** ([docker.com](https://docker.com)) — for PostgreSQL

---

### Step 1 — Start the Database

```bash
docker compose up -d
```

This starts PostgreSQL on port 5432 and automatically runs the schema + seed data.

---

### Step 2 — Start the Backend

```bash
cd backend
npm install          # (already done if you followed setup)
npm run dev
```

Backend runs at: **http://localhost:5000**

---

### Step 3 — Start the Frontend

Open a new terminal:

```bash
cd frontend
npm install          # (already done)
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔐 Account Roles & Access Provisioning

Initial institutional accounts are seeded into the database for role-based governance. Passwords must be set securely via the database migration or retrieved/reset using the integrated institutional **Forgot Password** recovery workflow.

| Role | Default Email Identifier | Access Tier |
|------|--------------------------|-------------|
| Super Admin | `superadmin@crddms.edu` | Full System Governance |
| Admin | `admin@crddms.edu` | Institutional Administration |
| Dept Head | `ravi@crddms.edu` | Department Management |
| Faculty | `priya@crddms.edu` | Academic Record Submissions |
| Staff | `suresh@crddms.edu` | Operational Document Entry |
| Compliance Reviewer | `naac@crddms.edu` | NAAC/NBA Regulatory Oversight |

---

## 📁 Project Structure

```
clgproject/
├── frontend/                  # React + Vite + Tailwind CSS
│   └── src/
│       ├── pages/             # 13 page components
│       ├── components/        # Shared UI (Sidebar, Modal, Badge…)
│       ├── layouts/           # MainLayout (sidebar + topbar)
│       ├── context/           # AuthContext (JWT state)
│       ├── routes/            # ProtectedRoute
│       └── services/          # api.js (Axios + interceptors)
│
├── backend/                   # Node.js + Express REST API
│   ├── controllers/           # Business logic (1 file per resource)
│   ├── routes/                # Express routers (1 file per resource)
│   ├── middleware/            # auth.js, upload.js, errorHandler.js
│   ├── services/              # ocr.service.js, audit.service.js
│   ├── config/                # db.js (pg Pool)
│   ├── db/                    # schema.sql, seed.sql
│   └── uploads/               # Uploaded files (organized by dept/year)
│
└── docker-compose.yml         # PostgreSQL 15
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | JWT login |
| POST | `/api/auth/register` | Create user |
| GET | `/api/departments` | List all departments |
| POST | `/api/documents/upload` | Upload a document |
| GET | `/api/documents` | List documents (with filters) |
| GET | `/api/documents/:id` | Get document details |
| PUT | `/api/documents/:id` | Update document |
| POST | `/api/ocr/process/:id` | Run OCR on document |
| GET | `/api/ocr/:id` | Get OCR result |
| GET | `/api/search` | Full-text + filter search |
| GET | `/api/compliance` | List compliance records |
| POST | `/api/compliance` | Map document to compliance |
| GET | `/api/archive` | List archives |
| POST | `/api/archive` | Archive a document |
| GET | `/api/audit` | Audit logs |
| GET | `/api/users` | List users (admin only) |
| GET | `/api/reports` | Full analytics |
| GET | `/api/reports/dashboard` | Dashboard stats |

---

## 🎨 UI Pages

1. **Login** — University-style professional login
2. **Dashboard** — Stats + 3 charts + recent uploads
3. **Department Vault** — Folder-browser by department
4. **Upload Document** — Drag-and-drop + metadata form
5. **Search Documents** — Full-text + OCR search
6. **OCR Results** — Text extraction viewer with confidence score
7. **Compliance Center** — NAAC/NBA/AICTE/UGC tabs with progress
8. **Approval Workflow** — Review/Approve/Reject documents
9. **Archive Center** — Historical records
10. **Audit Logs** — Immutable activity trail
11. **User Management** — RBAC user CRUD
12. **Reports & Analytics** — 4 Chart.js charts + KPIs
13. **Profile Settings** — Name + password change

---

## 🔒 Security Features

- JWT Bearer token authentication
- Role-Based Access Control (6 roles)
- Helmet.js HTTP security headers
- Rate limiting (200 req/15min)
- File type + size validation
- SQL injection protection (parameterized queries)
- CORS configured for frontend origin only

---

## 🗄️ Database Tables

`departments` · `users` · `students` · `faculty` · `uploaded_documents` · `ocr_extracted_text` · `accreditation_records` · `archive_records` · `audit_logs`

---

## ⚙️ Environment Variables & Database Connectivity

CRDDMS supports **Dual-Mode Database Architecture**: seamless operation with either the **Online Cloud Database (Neon PostgreSQL)** or a **Local PostgreSQL** instance, with automated diagnostics and graceful fallback.

### 🌐 Option A: Online Cloud Database (Neon PostgreSQL) — Default & Ready

The system comes pre-configured to connect to the institutional Neon Cloud PostgreSQL database with SSL encryption. No local database installation is needed.

**backend/.env** (and root `.env`):
```env
PORT=5000
NODE_ENV=development

# Database Mode: 'online' | 'local' | 'auto'
DB_MODE=online

# Online Neon Cloud PostgreSQL Connection String
DATABASE_URL=postgresql://neondb_owner:npg_TIPGfuD4JKc0@ep-wispy-bar-aepcgkbs-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require

# JWT Configuration
JWT_SECRET=crddms_jwt_secret_key_2026
JWT_EXPIRES_IN=24h

# File Upload Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=26214400

# CORS Allowed Origin
FRONTEND_URL=http://localhost:5173
```

---

### 💻 Option B: Local PostgreSQL Database (Docker or Native)

For local offline development without internet access:

1. Start your local PostgreSQL server or Docker container:
   ```bash
   docker-compose up -d
   ```
2. Update `backend/.env` (or set `DB_MODE=local`):
   ```env
   DB_MODE=local
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=crddms_db
   DB_USER=crddms_user
   DB_PASSWORD=crddms_pass
   ```
3. Run the migration to initialize local tables and seed data:
   ```bash
   npm run migrate
   ```

---

### 🚀 Running the Platform Locally

From the root repository directory:

```bash
# Terminal 1: Start Backend Server (runs on http://localhost:5000)
npm run server

# Terminal 2: Start Frontend Dev Server (runs on http://localhost:5173)
npm run dev:frontend
```

> [!NOTE]
> The Vite development server automatically proxies all `/api` and `/uploads` requests from port `5173` to backend port `5000`. You can also verify system health and database connectivity at any time via:
> - `http://localhost:5000/api/health`
> - `http://localhost:5000/api/db-status`

---

## 📧 Real-Time Email Delivery & Sample SMTP Credentials

The JNTU-GV CRDDMS portal supports live, real-time SMTP email delivery for:
1. **Institutional Registration Email Verification** (24-hour cryptographic single-use token).
2. **Account Security Password Recovery & Reset Links** (15-minute cryptographic single-use token).
3. **Super Admin Approval & Rejection Notifications**.

### Sample SMTP Credentials Configured (Ethereal Email)

The application is pre-configured with active sample SMTP credentials for real-time delivery testing:

```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=csnyxw7sbxi256io@ethereal.email
SMTP_PASS=tSQ5ShxhNfx537W2N1
EMAIL_FROM="JNTU-GV CRDDMS Portal" <support.crddms@jntugv.edu.in>
```

### How to View Real-Time Emails:
- **Instant Browser Link**: When submitting a registration or password reset request, the UI provides a one-click button:
  `🔗 Open Real-Time Email in Browser (Live Test Inbox) ↗`
  Clicking it opens the exact HTML email delivered to the SMTP inbox in a new tab, complete with official JNTU-GV institutional header, formatted message, and working verification/reset buttons.
- **Terminal Console**: The backend console logs clickable Ethereal preview URLs whenever an email is dispatched:
  `📨 [Live Email Preview URL]: https://ethereal.email/message/...`


