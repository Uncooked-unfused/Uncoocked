# 🛡️ UNCOOKED Platform - Super Admin Operations & Security Manual

> **Authoritative Team Reference & Operations Guide**  
> **Platform**: Uncooked Campus Event Platform (`https://uncooked.in`)  
> **Target Audience**: Core Engineering Team, Operations Leads, Security Auditors  
> **Last Updated**: August 2026  

---

## 1. Executive Summary & Overview

The **Super Admin** role represents the highest authorization tier within the **Uncooked** enterprise platform. Super Admins possess unrestricted management, moderation, configuration, and audit capabilities across all campus events, user profiles, application workflows, and runtime infrastructure settings.

* **Production URL**: `https://uncooked.in/admin/dashboard`
* **Local Development URL**: `http://localhost:3000/admin/dashboard`
* **Authorization Protocol**: Server-side Policy-Based Access Control (PBAC) with live PostgreSQL user role validation on every request.

---

## 2. Super Admin Credentials & Access Instructions

### 🔑 Active Credentials for Team Access
* **Admin Login URL**: [`https://uncooked.in/login`](https://uncooked.in/login)
* **Super Admin Email**: `unfusedz.admin@gmail.com`
* **Password Policy**: Minimum 8 characters, requiring at least one letter and one number.

### 👁️ Authentication Experience
* Both `/login` and `/signup` feature interactive **Show / Hide Password** toggles for seamless access.
* Upon successful authentication, Super Admin accounts are automatically redirected to `/admin/dashboard`.

---

## 3. Administrative Console Modules

The Enterprise Operations Console is accessible via top header navigation tabs:

```
[ Dashboard ]  [ Users ]  [ Events ]  [ Applications ]  [ Analytics ]  [ Config ]  [ Audit Logs ]
```

### Module Breakdown

#### 1. 📊 Dashboard (`/admin/dashboard`)
* Real-time metrics overview: Active Users, Total Campus Events, Pending Host Applications, Ticket Sales & Revenue, and System Health.
* Quick action shortcuts for instant moderation and pending application reviews.

#### 2. 👥 User Management (`/admin/users` & `/admin/manage-users`)
* **Directory Search & Filter**: Search by full name, email, or filter by role (`USER`, `STAFF`, `SUPER_ADMIN`).
* **Role Promotion / Demotion**: Grant or revoke `STAFF` or `SUPER_ADMIN` privileges.
* **Blacklist & Unblacklist Workflow**: Blacklist abusive accounts to revoke access while preserving audit history; restore accounts with role memory.
* **Account Termination**: Hard-delete or soft-disable user accounts.

#### 3. 🎟️ Event Management (`/admin/events`)
* Full oversight of all campus events across categories.
* Status management: Approve pending submissions, suspend inappropriate events, or flag for compliance review.
* Capacity adjustments, ticket tier validation, and host attribution.

#### 4. 📝 Host Applications & Batch Review (`/admin/applications`)
* Review organizer/staff applications for hosting campus events.
* Multi-select batch review action to bulk-approve or bulk-reject applications.

#### 5. 📈 Growth Analytics & BI (`/admin/analytics`)
* Conversion funnels, registration trends, active user retention tracking, and event attendance metrics.

#### 6. ⚙️ Runtime Configuration (`/admin/config`)
* Feature flags (e.g., Enable/Disable Public Signups, Maintenance Mode).
* Rate limit configurations and email notification template toggles.

#### 7. 📜 Audit Logs (`/admin/audit-logs`)
* Immutable trail of all administrative actions taken on the platform.
* Records timestamp, admin User ID, IP address, target entity, and action type (`ROLE_PROMOTION`, `USER_BLACKLIST`, `EVENT_DELETION`, etc.).

---

## 4. Security & PBAC Architecture

### Live Database PBAC Validation
Every administrative API route under `/api/admin/*` and every UI route under `/admin/*` is protected by `verifySuperAdmin` guards (`src/server/auth/guards.js`).

```javascript
// Verification Flow
1. NextAuth Session Token Validation
2. Live PostgreSQL query: prisma.user.findUnique({ where: { id: session.user.id } })
3. Verify user.role === "SUPER_ADMIN"
4. Block access (403 Forbidden / 401 Unauthorized) if role condition is not met
```

### Safeguards & Anti-Abuse
* **Anti-Lockout Protection**: Prevents demoting or deleting the primary Super Admin account if it would result in zero active Super Admins.
* **Canonical Domain Resolver**: All email verification and password reset links dynamically resolve to `https://uncooked.in` using request origin headers.
* **Rate-Limiting**: IP-based rate limiting on sensitive endpoints to prevent brute-force attacks.

---

## 5. Developer Guide: How to Promote a Super Admin via CLI

To grant `SUPER_ADMIN` privileges to any existing account in the database, run the following command in the workspace terminal:

```bash
node -e '
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function promote(email) {
  const user = await prisma.user.update({
    where: { email },
    data: { role: "SUPER_ADMIN" }
  });
  console.log("Successfully promoted:", user.email, "->", user.role);
}
promote("user@example.com");
'
```

---

## 6. Environment Variables Reference Checklist

Ensure the following environment variables are set in production (Netlify/Vercel):

```env
# Server Domain
NEXTAUTH_URL="https://uncooked.in"
NEXT_PUBLIC_APP_URL="https://uncooked.in"

# PostgreSQL Database (Supabase Pooler)
DATABASE_URL="postgresql://postgres.dixvabzhelffozvcpyfg:adminacess%40unfusedZ2026@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.dixvabzhelffozvcpyfg:adminacess%40unfusedZ2026@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# NextAuth Secret
NEXTAUTH_SECRET="<YOUR_SECURE_NEXTAUTH_SECRET>"

# SMTP / Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="uncooked.official@gmail.com"
SMTP_PASS="<YOUR_APP_PASSWORD>"
```

---

*This document is maintained by the Uncooked Core Engineering Team. For questions or emergency administrative assistance, contact `unfusedz.admin@gmail.com`.*
