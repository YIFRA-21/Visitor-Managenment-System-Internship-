# Visitor & External Appointment Management System

A full-stack digital platform for scheduling, approving, managing, and monitoring external visitor appointments.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Recharts
- **Backend:** Node.js, Express, Socket.io
- **Database:** MySQL

## Features

- Public appointment booking portal with multi-step wizard
- Multi-level approval workflow
- QR code visitor passes and reference tracking
- Real-time reception desk with live visitor board
- Check-in / check-out management
- Role-based dashboards (Admin, Manager, Employee, Reception, Security)
- Analytics, reporting, and audit logs
- Blacklist and security verification
- In-app notifications

## Prerequisites

- Node.js 18+
- MySQL 8+ (or MariaDB)

## Setup

### 1. Database

Create the database and seed demo data:

```bash
cd Backend
npm install
cp .env.example .env
# Edit .env with your MySQL credentials
npm run db:setup
```

### 2. Backend

```bash
cd Backend
npm run dev
```

API runs at `http://localhost:5000`

### 3. Frontend

```bash
cd Frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

## Demo Accounts

Password for all accounts: **Password123!**

| Email                 | Role      |
| --------------------- | --------- |
| admin@visitor.com     | Admin     |
| michael.c@visitor.com | Employee  |
| lisa.t@visitor.com    | Reception |
| robert.g@visitor.com  | Security  |

## Project Structure

```
Visitor/
├── Frontend/        # React frontend
├── Backend/         # Express API
├── database/        # SQL schema & seed
└── README.md
```

## API Endpoints

| Method | Endpoint                      | Description         |
| ------ | ----------------------------- | ------------------- |
| POST   | /api/auth/login               | Staff login         |
| GET    | /api/departments              | List departments    |
| POST   | /api/appointments             | Book appointment    |
| GET    | /api/appointments/track       | Track by reference  |
| PATCH  | /api/appointments/:id/approve | Approve appointment |
| POST   | /api/checkin/scan             | Check-in visitor    |
| GET    | /api/reports/dashboard        | Analytics data      |
| GET    | /api/checkin/live-board       | Reception board     |

## License

MIT
