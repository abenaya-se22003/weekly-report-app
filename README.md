# 🚀 Weekly Report Generator & Team Dashboard

A modern, full-stack enterprise web application for engineering teams to submit structured weekly progress reports, track deliverables, manage workload velocity, and provide executive review workflows with an integrated **AI Assistant** powered by Claude.

---

## 📑 Table of Contents
1. [Tech Stack](#-tech-stack)
2. [Database Schema & ER Diagram](#-database-schema--er-diagram)
3. [Prerequisites](#-prerequisites)
4. [Step-by-Step Setup Guide](#-step-by-step-setup-guide)
   - [1. Database Setup & Prisma Migrations](#1-database-setup--prisma-migrations)
   - [2. Backend Setup & Run](#2-backend-setup--run)
   - [3. Frontend Setup & Run](#3-frontend-setup--run)
   - [4. AI Assistant Configuration](#4-ai-assistant-configuration)
5. [Demo User Credentials](#-demo-user-credentials)
6. [Role-Based Access Control (RBAC) Architecture](#-role-based-access-control-rbac-architecture)
7. [REST API Documentation](#-rest-api-documentation)

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Recharts, React Router DOM
- **Backend**: Node.js, Express.js, Prisma ORM, JSON Web Tokens (JWT), Bcrypt
- **Database**: PostgreSQL (`weekly_reports_db`)
- **AI Integration**: Anthropic Claude API (`@anthropic-ai/sdk`) with server-side context privacy filtering
- **Testing**: Jest + Supertest (Automated RBAC security suite)

---

## 📊 Database Schema & ER Diagram

```mermaid
erDiagram
    USER ||--o{ REPORT : "submits"
    USER ||--o{ REPORT_REVIEW : "reviews as manager"
    PROJECT ||--o{ REPORT : "categorizes"
    REPORT ||--|{ REPORT_VERSION : "has historical snapshots"
    REPORT ||--o{ REPORT_REVIEW : "receives feedback"
    REPORT_VERSION ||--|{ TASK_ENTRY : "contains"
    REPORT_VERSION ||--o{ REPORT_REVIEW : "reviewed on"

    USER {
        string id PK "cuid / uuid"
        string name "Full Name"
        string email UK "Unique work email"
        string passwordHash "Bcrypt hash"
        enum role "TEAM_MEMBER | MANAGER"
        datetime createdAt "Timestamp"
    }

    PROJECT {
        string id PK "cuid / uuid"
        string name UK "Project title"
        string description "Goals & Scope"
        boolean isActive "Active toggle"
        datetime createdAt "Timestamp"
        datetime updatedAt "Timestamp"
    }

    REPORT {
        string id PK "cuid / uuid"
        string userId FK "Author User ID"
        string projectId FK "Project ID"
        date weekStartDate "Monday start date"
        date weekEndDate "Friday end date"
        enum status "DRAFT | SUBMITTED | NEEDS_CORRECTION | APPROVED"
        int version "Current version counter"
        datetime createdAt "Timestamp"
        datetime updatedAt "Timestamp"
    }

    REPORT_VERSION {
        string id PK "cuid / uuid"
        string reportId FK "Parent Report ID"
        int versionNum "Snapshot version (1, 2, ...)"
        json content "Blockers, achievements, notes, hours"
        datetime submittedAt "Snapshot timestamp"
    }

    TASK_ENTRY {
        string id PK "cuid / uuid"
        string reportVersionId FK "Version snapshot ID"
        string taskName "Task summary"
        enum priority "LOW | MEDIUM | HIGH | CRITICAL"
        int plannedPercent "Target completion %"
        int actualPercent "Actual completion %"
        enum status "NOT_STARTED | IN_PROGRESS | COMPLETED | BLOCKED | DEFERRED"
        float timePlanned "Planned hours"
        float timeSpent "Logged hours"
        string deliverable "PR URL or artifact link"
    }

    REPORT_REVIEW {
        string id PK "cuid / uuid"
        string reportId FK "Target Report ID"
        string reviewerId FK "Manager User ID"
        string reportVersionId FK "Reviewed Version ID"
        enum action "APPROVED | REQUEST_CHANGES"
        string comment "Manager feedback"
        datetime createdAt "Timestamp"
    }
```

---

## ⚙️ Prerequisites

Before getting started, ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or later ([Download Node.js](https://nodejs.org/))
- **PostgreSQL**: v14.0 or later running on `localhost:5432`
- **npm** or **pnpm** / **yarn**

---

## 🚀 Step-by-Step Setup Guide

### 1. Database Setup & Prisma Migrations

1. Ensure PostgreSQL is active locally:
   ```sql
   -- Run in psql or pgAdmin:
   CREATE DATABASE weekly_reports_db;
   ```

2. Navigate into `/backend` and configure `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```
   *Edit `.env` with your PostgreSQL username and password:*
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/weekly_reports_db"
   PORT=3001
   JWT_SECRET="weekly_report_jwt_super_secret_key_2026"
   JWT_EXPIRES_IN="7d"
   ANTHROPIC_API_KEY="your_anthropic_api_key_here" # Optional
   ```

3. Run database migrations to construct tables:
   ```bash
   npx prisma migrate dev --name init
   ```

4. Populate realistic multi-status sample data:
   ```bash
   npm run db:seed
   ```
   *(Creates 7 users, 4 active projects, 30 weekly reports spanning 6 weeks, 38 version snapshots, 150 task entries, and 23 manager review logs).*

---

### 2. Backend Setup & Run

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Run automated RBAC test suite:
   ```bash
   npm test
   ```

3. Start the Express API server:
   ```bash
   npm run dev
   ```
   *The backend will boot on [http://localhost:3001](http://localhost:3001) with health diagnostics available at `/api/health`.*

---

### 3. Frontend Setup & Run

1. Open a second terminal and navigate to `/frontend`:
   ```bash
   cd frontend
   npm install
   ```

2. Start the Vite React development server:
   ```bash
   npm run dev
   ```

3. Open your browser at [http://localhost:5173](http://localhost:5173).

---

### 4. AI Assistant Configuration

The app includes a floating **Claude AI Assistant** widget (Manager-only) that allows executive queries over team reports (*"What did the design team work on last week?"*, *"Are there any critical blockers?"*).

- To connect directly to Anthropic Claude 3.5:
  1. Add your key to `backend/.env`:
     ```env
     ANTHROPIC_API_KEY="sk-ant-api03-..."
     ```
  2. Restart the backend server.
- **Privacy First**: The backend never sends raw database dumps to the LLM. It extracts, sanitizes, and aggregates high-density context summaries server-side before prompt injection.
- **Offline / Test Mode**: If no API key is provided, the backend falls back to an intelligent semantic database synthesizer, ensuring the widget functions seamlessly during evaluations.

---

## 🔑 Demo User Credentials

All seed accounts share the default password: **`password123`**  
*(You can also use the **1-Click Quick Demo Login** buttons on the `/login` screen).*

| Name | Role | Email | Best Used For |
| :--- | :--- | :--- | :--- |
| **Sarah Johnson** | `MANAGER` | `sarah.johnson@company.com` | Dashboard, Recharts Analytics, AI Assistant, Review Queue, Team Directory |
| **Michael Torres** | `MANAGER` | `michael.torres@company.com` | Project Management, Approving & Requesting Revisions |
| **Alice Chen** | `TEAM_MEMBER` | `alice.chen@company.com` | Creating reports, Task table editing, Resubmitting correction requests |
| **Bob Martinez** | `TEAM_MEMBER` | `bob.martinez@company.com` | Tracking personal submission history, Viewing version snapshots |
| **Charlie Kim** | `TEAM_MEMBER` | `charlie.kim@company.com` | Mobile App development reports & deliverables |

---

## 🛡️ Role-Based Access Control (RBAC) Architecture

| Feature / Endpoint | `TEAM_MEMBER` | `MANAGER` | Security Enforcement |
| :--- | :---: | :---: | :--- |
| **Login & Profile** (`/api/auth/*`) | ✅ | ✅ | Validates JWT token on all protected requests |
| **Create Report Draft** (`POST /api/reports`) | ✅ | ✅ | Sets `userId = req.user.id` |
| **Edit Report** (`PUT /api/reports/:id`) | ✅ *(Own only)* | ❌ | **IDOR Guard**: Only report owner can edit; locked once `APPROVED` or `SUBMITTED` |
| **Submit Report** (`POST /api/reports/:id/submit`) | ✅ *(Own only)* | ❌ | Automatically creates incremented `ReportVersion` on resubmissions |
| **View Own Reports** (`GET /api/reports/mine`) | ✅ | ✅ | Scoped strictly to `req.user.id` |
| **View Any Report Detail** (`GET /api/reports/:id`) | ✅ *(Own only)* | ✅ | Team members forbidden (403) from viewing other members' reports |
| **Review / Approve Reports** (`POST /api/reports/:id/review`) | ❌ | ✅ | Manager-only guard (`requireRole('MANAGER')`) |
| **Executive Dashboard & Charts** (`GET /api/dashboard/*`) | ❌ | ✅ | Manager-only guard |
| **Project CRUD** (`POST/PUT/DELETE /api/projects`) | ❌ | ✅ | Manager-only guard; Soft-archives projects with existing reports |
| **AI Claude Assistant** (`POST /api/ai/chat`) | ❌ | ✅ | Manager-only guard; Server-side privacy context filtering |

---

## 📡 REST API Documentation

### Auth Endpoints
- `POST /api/auth/register` — Register a new account (`name`, `email`, `password`, `role`).
- `POST /api/auth/login` — Authenticate and receive JWT token (`email`, `password`).
- `GET /api/auth/me` — Retrieve profile of currently authenticated user.

### Team Member Endpoints
- `GET /api/reports/mine` — Paginated list of current user's weekly reports (`status`, `projectId`, `page`, `limit`).
- `POST /api/reports` — Create draft weekly report with tasks, blockers, achievements, and hours breakdown.
- `PUT /api/reports/:id` — Update draft or needs-correction report.
- `POST /api/reports/:id/submit` — Submit report for review (creates new version snapshot on revision).
- `GET /api/reports/:id/versions` — View all version snapshots and review trails.

### Manager Endpoints
- `GET /api/reports` — View all team reports with filtering by member, project, status, and dates.
- `GET /api/reports/:id` — Full report detail view.
- `POST /api/reports/:id/review` — Submit review (`action: 'APPROVED' | 'REQUEST_CHANGES'`, `comment`).
- `GET /api/dashboard/summary` — Real-time KPI cards (submissions, compliance rate, blockers).
- `GET /api/dashboard/charts` — Datasets for Recharts (velocity trend, member status breakdown, workload, time allocation).
- `POST /api/ai/chat` — Query Claude AI Assistant with report context.
- `POST /api/projects` | `PUT /api/projects/:id` | `DELETE /api/projects/:id` — Project lifecycle management.
