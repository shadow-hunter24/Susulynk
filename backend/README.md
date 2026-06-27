# Susulynk Backend API

Node.js + Express REST API backed by Neon PostgreSQL via Prisma ORM.

## Stack
- **Runtime**: Node.js 22
- **Framework**: Express 4
- **ORM**: Prisma 5
- **Database**: Neon PostgreSQL (serverless)
- **Auth**: JWT (jsonwebtoken) + bcryptjs

## Quick Start

```bash
# Install dependencies
npm install

# Push schema to Neon and generate Prisma client
npm run db:push

# Seed sample data
npm run db:seed

# Start dev server (with auto-reload)
npm run dev

# Start production server
npm start
```

Server runs on **http://localhost:3000**

## Environment Variables

Copy `.env.example` to `.env` and fill in your values.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | Token expiry e.g. `7d` |
| `PORT` | Server port (default: 3000) |

---

## API Reference

### Base URL
```
http://localhost:3000/api
```

All protected routes require:
```
Authorization: Bearer <token>
```

---

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | ❌ | Register new user |
| POST | `/login` | ❌ | Login, returns JWT |
| POST | `/forgot-password` | ❌ | Send OTP to phone |
| POST | `/verify-otp` | ❌ | Verify OTP, get reset token |
| POST | `/reset-password` | ❌ | Reset password with reset token |
| GET | `/me` | ✅ | Get current user profile |
| PATCH | `/profile` | ✅ | Update name/email/bio |
| PATCH | `/change-password` | ✅ | Change password |

**Register**
```json
POST /api/auth/register
{
  "fullName": "Kofi Mensah",
  "phone": "0241234567",
  "password": "secret123",
  "email": "kofi@example.com",     // optional
  "groupName": "Accra Susu Group", // optional — creates a group
  "groupRole": "admin"             // optional: admin | member
}
```

**Login**
```json
POST /api/auth/login
{ "phone": "0241234567", "password": "secret123" }
// Returns: { token, user }
```

---

### Groups — `/api/groups`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/` | ✅ | Any | Create a group |
| GET | `/mine` | ✅ | Any | My groups |
| GET | `/:groupId` | ✅ | Member | Group details |
| PATCH | `/:groupId` | ✅ | Admin | Update settings |
| PATCH | `/:groupId/archive` | ✅ | Admin | Archive group |

---

### Members — `/api/members`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/:groupId` | ✅ | Member | List members (search, filter) |
| GET | `/:groupId/:memberId` | ✅ | Member | Member detail + history |
| POST | `/:groupId` | ✅ | Admin | Add member by phone |
| PATCH | `/:groupId/:memberId` | ✅ | Admin | Change role/status |
| DELETE | `/:groupId/:memberId` | ✅ | Admin | Remove member |

---

### Contributions — `/api/contributions`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/:groupId` | ✅ | Member | List + summary (filter by cycle/status) |
| POST | `/:groupId` | ✅ | Admin | Record contribution |
| PATCH | `/:groupId/:id` | ✅ | Admin | Update status |
| DELETE | `/:groupId/:id` | ✅ | Admin | Delete |
| GET | `/:groupId/meta/cycles` | ✅ | Member | List distinct cycles |

---

### Loans — `/api/loans`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/:groupId` | ✅ | Member | List loans + summary |
| GET | `/:groupId/:loanId` | ✅ | Member | Loan detail + repayments |
| POST | `/:groupId` | ✅ | Admin | Create loan |
| PATCH | `/:groupId/:loanId` | ✅ | Admin | Approve / update status |
| POST | `/:groupId/:loanId/repayments` | ✅ | Admin | Record repayment |

---

### Payouts — `/api/payouts`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/:groupId` | ✅ | Member | Full rotation schedule |
| POST | `/:groupId` | ✅ | Admin | Create rotation schedule |
| PATCH | `/:groupId/:payoutId/pay` | ✅ | Admin | Mark payout as paid |
| PATCH | `/:groupId/reorder` | ✅ | Admin | Reorder rotation |

---

### Notifications — `/api/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✅ | My notifications (filter by groupId, unreadOnly) |
| PATCH | `/:id/read` | ✅ | Mark one as read |
| PATCH | `/read-all` | ✅ | Mark all as read |
| DELETE | `/:id` | ✅ | Delete notification |

---

### Reports — `/api/reports`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:groupId?cycle=June 2026` | ✅ | Monthly financial summary |
| GET | `/:groupId/meta/dashboard` | ✅ | Dashboard stats |

---

## Database Schema

```
User ──< GroupMember >── Group
GroupMember ──< Contribution
GroupMember ──< Loan ──< LoanRepayment
GroupMember ──< Payout
User ──< Notification
Group ──< Notification
```

## Seeded Test Account
- **Phone**: `0241234567`
- **Password**: `password123`
- **Role**: Admin of "Accra Women Susu"
