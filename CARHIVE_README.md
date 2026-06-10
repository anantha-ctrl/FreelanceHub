# 🚗 Car Hive Freelancer Platform

A modern, responsive, production-ready platform where freelancers post vehicle
advertisements, manage their listings, submit daily reports, and request new
file assignments — with email / SMS / WhatsApp / in-app notifications and a full
admin dashboard.

Built on **React + Tailwind CSS** (frontend), **Node.js + Express** (backend),
**MySQL + Sequelize** (database), and **JWT** authentication.

---

## ✨ Features

**Freelancer**
- Registration with full profile (name, username, DOB, email, mobile, address) + strong-password & uniqueness validation
- JWT login by username, *Remember Me*, password recovery, secure session handling
- Dashboard widgets: account status, total ads, current file assignment, recent activity, notifications, announcements
- Post advertisements for **New** or **Second-Hand** vehicles (full spec forms + confirmation)
- **My Ads** — search (Ad ID / batch / type), date filters, view, delete (with confirmation), **PDF download** & **print**
- **New File Request** — pick a range (1-150 … 4951-5000); company is emailed automatically
- **Daily Report Submit** — date, working file, forms today / till now
- Notification Center (email + SMS + WhatsApp + in-app)

**Admin**
- Dashboard analytics: total/active users, total ads, new vs used, reports today, file requests
- Manage advertisements, daily reports, file requests (approve/reject), announcements
- Broadcast notifications across any channel combination
- Activity logs, user management, support inbox

**Security**
- JWT auth · bcrypt password hashing · Helmet · xss-clean · rate limiting · role-based access control · server-side session validation · audit/activity logs

---

## 🏗️ Tech Stack & Structure

```
freelancehub/
├── backend/                     # Node + Express + Sequelize API
│   ├── config/                  # database, ensureSchema, seed
│   ├── controllers/             # adController, reportController, fileRequestController,
│   │                            #   notificationController, announcementController,
│   │                            #   dashboardController, carAdminController, authController
│   ├── models/                  # Advertisement, NewVehicleDetails, UsedVehicleDetails,
│   │                            #   DailyReport, FileRequest, Notification, Announcement, User …
│   ├── routes/                  # adRoutes, reportRoutes, fileRequestRoutes,
│   │                            #   notificationRoutes, announcementRoutes,
│   │                            #   dashboardRoutes, carAdminRoutes …
│   ├── services/                # notificationService (SMTP / SMS / WhatsApp / in-app)
│   ├── middleware/              # authMiddleware (protect, adminOnly)
│   └── server.js
├── frontend/                    # React (CRA) + Tailwind
│   └── src/
│       ├── pages/carhive/       # Dashboard, MyAds, PostAd, NewFileRequest,
│       │                        #   DailyReport, Notifications, AdminDashboard
│       ├── pages/auth/          # Landing (Car Hive home), Login, Register
│       ├── components/          # layout + common UI kit
│       └── utils/api.js         # typed API client
└── database/
    └── carhive_schema.sql       # reference schema (auto-created by Sequelize too)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Node 22 recommended — uses global `fetch` for SMS/WhatsApp)
- MySQL 8 / MariaDB (XAMPP works out of the box)

### 1. Backend
```bash
cd backend
npm install
# configure backend/.env (see below)
npm run dev          # or: npm start   (listens on :5001)
```
On first boot the API creates the database, syncs all tables, patches the
`users` table with the Car Hive columns, and seeds an admin + sample announcements.

### 2. Frontend
```bash
cd frontend
npm install
npm start            # http://localhost:3000  (proxies API to :5001)
```

### Default admin login
```
username: admin
password: Admin@123456
```

---

## ⚙️ Environment (`backend/.env`)

```env
PORT=5001
JWT_SECRET=change_me
JWT_EXPIRES_IN=5h

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=anantha
DB_NAME=freehub

ADMIN_EMAIL=admin@freelancehub.com
ADMIN_PASSWORD=Admin@123456

# ── Notifications (all optional; blank = log to console instead of sending) ──
SMTP_HOST=                 # e.g. smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Car Hive <no-reply@carhive.com>"
COMPANY_EMAIL=             # where New File Request emails go (defaults to ADMIN_EMAIL)

SMS_API_URL=               # generic JSON SMS gateway (Twilio-compatible)
SMS_API_KEY=
SMS_SENDER_ID=CARHIVE

WHATSAPP_API_URL=          # Meta WhatsApp Cloud API endpoint
WHATSAPP_TOKEN=
```

> The notification service **degrades gracefully**: with no provider configured,
> every email / SMS / WhatsApp is logged to the server console, so the whole
> platform is fully usable in development without external accounts.

---

## 🔌 API Reference (prefix `/api`)

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register (name, username, dob, email, mobile, address, password, confirmPassword) |
| POST | `/auth/login` | Login by `identifier` (username or email) + password |
| POST | `/auth/logout` | Logout |
| GET  | `/auth/me` | Current user |
| POST | `/auth/forgot-password` · `/auth/reset-password` | Password recovery |

### Advertisements
| Method | Endpoint | Description |
|---|---|---|
| POST | `/ads` | Create ad `{ batchNumber, carTitle, vehicleType, confirmed, details }` |
| GET  | `/ads/my` | My ads — `?q= &vehicleType= &from= &to=` |
| GET  | `/ads/:id` | Full ad with vehicle details |
| DELETE | `/ads/:id` | Delete ad |

### Reports / File Requests / Dashboard
| Method | Endpoint | Description |
|---|---|---|
| POST | `/reports` · GET `/reports/my` | Submit / list daily reports |
| GET  | `/file-requests/ranges` | Available ranges (1-150 … 4951-5000) |
| POST | `/file-requests` · GET `/file-requests/my` | Submit / list file requests |
| GET  | `/dashboard` | User dashboard widgets |

### Notifications / Announcements
| Method | Endpoint | Description |
|---|---|---|
| GET `/notifications` · PUT `/notifications/:id/read` · PUT `/notifications/read-all` | In-app center |
| GET  | `/announcements` | Active announcements (public) |
| POST/PUT/DELETE `/announcements/:id` · GET `/announcements/all` | Admin announcement CRUD |

### Admin (role: admin)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/car-admin/stats` | Dashboard analytics |
| GET/DELETE | `/car-admin/ads[/:id]` | Manage all ads |
| GET | `/car-admin/reports` | All daily reports |
| GET/PUT | `/car-admin/file-requests[/:id]` | List / approve / reject requests |
| POST | `/car-admin/broadcast` | Push notification to all freelancers |

---

## 🗄️ Database Tables

`users`, `advertisements`, `new_vehicle_details`, `used_vehicle_details`,
`daily_reports`, `file_requests`, `notifications`, `announcements`, `audit_logs`
— all with foreign keys, indexes, and constraints. See
[`database/carhive_schema.sql`](database/carhive_schema.sql) for the full DDL.

---

## 🚢 Deployment Notes
- Set `NODE_ENV=production`, a strong `JWT_SECRET`, and real DB + SMTP/SMS/WhatsApp credentials.
- Build the frontend: `cd frontend && npm run build` → serve the static `build/` (Nginx, `serve`, or behind the API).
- Run the API with a process manager (PM2 / systemd) behind a reverse proxy with HTTPS (cookies switch to `secure` automatically in production).
