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

App runs at `http://localhost:3000` (Local) and `http://<LAN-IP>:3000` (Network).

## LAN Development Access

The system is configured for multi-device network testing across your Local Area Network (LAN) / Wi-Fi.

### Step-by-Step Instructions

1. **Start the Backend server:**
   ```bash
   cd Backend
   npm run dev
   ```
   The backend binds to `0.0.0.0:5000` and displays:
   ```
   ➜ Local:   http://localhost:5000
   ➜ Network: http://<YOUR-IP>:5000
   ```

2. **Start the Frontend development server:**
   ```bash
   cd Frontend
   npm run dev
   ```
   Vite starts on `0.0.0.0:3000` and displays:
   ```
   ➜ Local:   http://localhost:3000/
   ➜ Network: http://<YOUR-IP>:3000/
   ```

3. **Find your active IPv4 Address on Windows:**
   Open PowerShell or Command Prompt and run:
   ```cmd
   ipconfig
   ```
   Look for your active network adapter (e.g., **Wireless LAN adapter Wi-Fi** or **Ethernet adapter**) and note the **IPv4 Address**:
   ```
   IPv4 Address. . . . . . . . . . . : 10.18.52.67
   ```
   *(Note: The IPv4 address is assigned dynamically by your router/DHCP and will change when you connect to a different Wi-Fi or router).*

4. **Access the application from another device:**
   Connect your second PC, laptop, Android phone, or iPhone to the **same Wi-Fi / LAN network**.
   Open any modern mobile or desktop web browser and navigate to:
   ```
   http://<YOUR-IPv4>:3000/
   ```
   *Example:*
   ```
   http://10.18.52.67:3000/
   ```

5. **Dynamic Backend & API Routing:**
   The frontend automatically detects `window.location.hostname`. When accessed from `10.18.52.67:3000`, API requests, WebSocket events, and image uploads route to `http://10.18.52.67:5000` without requiring manual `.env` file changes.

### Troubleshooting LAN Access

* **Windows Defender Firewall blocking incoming connections:**
  If a mobile device cannot open the site or hangs loading:
  1. Open Windows PowerShell as Administrator.
  2. Allow Frontend port 3000 and Backend port 5000:
     ```powershell
     New-NetFirewallRule -DisplayName "VMS Frontend (Port 3000)" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
     New-NetFirewallRule -DisplayName "VMS Backend (Port 5000)" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
     ```
  3. Alternatively, in Windows Firewall Settings, ensure Node.js is checked for Private Networks.

* **Different Wi-Fi Networks:**
  Ensure the development PC and test mobile device/laptop are connected to the exact same Wi-Fi SSID or LAN switch. Devices on cellular data (4G/5G) cannot communicate with private LAN IP addresses.

* **Guest Wi-Fi Isolation (AP Client Isolation):**
  Many public or corporate "Guest" Wi-Fi networks enable Access Point (AP) Isolation, preventing devices connected to the same Wi-Fi from talking to each other. Use a standard home Wi-Fi, private office network, or your phone's personal hotspot.

* **Backend not listening on `0.0.0.0`:**
  Verify `Backend/.env` has `HOST=0.0.0.0` and `PORT=5000`. If Node only listens on `127.0.0.1`, remote devices will receive `Connection Refused`.

* **CORS Errors:**
  The Express backend and Socket.io server automatically validate RFC 1918 private IPv4 ranges (`10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`) in development. If using a custom subnet, ensure your origin matches the development origin validator.

* **Port Already in Use:**
  If port 3000 or 5000 is occupied, stop existing node processes:
  ```powershell
  Get-Process node | Stop-Process -Force
  ```

## User Codes, Passwords & Demo Accounts

> 🔑 **Login Credentials & Password:**
> - **Primary System Password:** `Belay2123@#`
> - **Alternate Demo Password:** `Password123!`
> 
> *Both passwords are supported across all active accounts.*
> 
> 🪪 **Flexible Sign-In:** The login screen accepts any of the **3 identifier types**:
> 1. **User Code** (e.g., `ADM000001`, `EMP-2026-00001`, `SEC-2026-000002`, `REC-2026-000004`, `MGR-2026-000005`)
> 2. **Username** (e.g., `admin`, `shewerke21`, `belayyifra`, `yetmwerkmuluneh14`, `hghfewe512`, `visitor`)
> 3. **Email Address** (e.g., `admin@visitor.com`, `shewerke21@gmail.com`, etc.)

### 1. Active Database Accounts

These accounts are stored and active in the database:

| # | Full Name | User Code | Username | Email | Role | Password |
|---|-----------|-----------|----------|-------|------|----------|
| 1 | System Admin | `ADM000001` | `admin` | `admin@visitor.com` | System Admin (`admin`) | `Belay2123@#` / `Password123!` |
| 2 | Melkam Tesema | `EMP-2026-00001` | `shewerke21` | `shewerke21@gmail.com` | Employee / Host (`staff`) | `Belay2123@#` / `Password123!` |
| 3 | Behabitu Behailu Shewamene | `SEC-2026-000002` | `belayyifra` | `belayyifra@gmail.com` | Security Officer (`security_officer`) | `Belay2123@#` / `Password123!` |
| 4 | Sami Zeleke Ayele | `REC-2026-000004` | `yetmwerkmuluneh14` | `yetmwerkmuluneh412@gmail.com` | Receptionist (`receptionist`) | `Belay2123@#` / `Password123!` |
| 5 | Sishaw Kefene Elfagd | `MGR-2026-000005` | `hghfewe512` | `hghfewe512@gmail.com` | Department Manager (`manager`) | `Belay2123@#` / `Password123!` |
EMP-2026-000018    ..........`Belay2123@`
EMP-2026-0000189 .............. `Belay2123@#`
IS-2026-000008

### 2. Standard Role & Seed Accounts

Canonical role-based seed accounts available in the database:

| # | Role | Full Name | User Code | Username | Email | Password |
|---|------|-----------|-----------|----------|-------|----------|
| 1 | **System Admin** | System Admin | `ADM000001` | `admin` | `admin@visitor.com` | `Belay2123@#` / `Password123!` |
| 2 | **Department Manager** | Emily Davis | `MGR000001` | `emily.d` | `emily.d@visitor.com` | `Belay2123@#` / `Password123!` |
| 3 | **Receptionist** | Lisa Thompson | `REC000001` | `lisa.t` | `lisa.t@visitor.com` | `Belay2123@#` / `Password123!` |
| 4 | **Security Officer** | Robert Garcia | `SEC000001` | `robert.g` | `robert.g@visitor.com` | `Belay2123@#` / `Password123!` |
| 5 | **Employee / Host** | Sarah Johnson | `EMP000001` | `sarah.j` | `sarah.j@visitor.com` | `Belay2123@#` / `Password123!` |
| 6 | **Employee / Host** | Michael Chen | `EMP000002` | `michael.c` | `michael.c@visitor.com` | `Belay2123@#` / `Password123!` |
| 7 | **Employee / Host** | James Wilson | `EMP000003` | `james.w` | `james.w@visitor.com` | `Belay2123@#` / `Password123!` |
| 8 | **Employee / Host** | Amanda Foster | `EMP000004` | `amanda.f` | `amanda.f@visitor.com` | `Belay2123@#` / `Password123!` |
| 9 | **Employee / Host** | Kevin Park | `EMP000005` | `kevin.p` | `kevin.p@visitor.com` | `Belay2123@#` / `Password123!` |
| 10 | **Employee / Host** | Diana Ruiz | `EMP000006` | `diana.r` | `diana.r@visitor.com` | `Belay2123@#` / `Password123!` |
| 11 | **Employee / Host** | Thomas Wright | `EMP000007` | `thomas.w` | `thomas.w@visitor.com` | `Belay2123@#` / `Password123!` |
| 12 | **Visitor** | David Visitor | `VIS000001` | `visitor` | `visitor@visitor.com` | `Belay2123@#` / `Password123!` |
| 13 | **Visitor** | Yetmwerk Ayele | `VIS000002` | `yetmul8@gmail.com` | `yetmul8@gmail.com` | `Belay2123@#` / `Password123!` |

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
