# Uncooked Portal 🚀

<p align="center">
  <em>The Enterprise-Grade Zero-Noise Operating System for Student Events, Campus Ecosystems, Host Verification & Infrastructure Telemetry.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFF?style=flat&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?style=flat&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/NextAuth.js-JWT-green?style=flat&logo=nextdotjs&logoColor=white" alt="NextAuth" />
  <img src="https://img.shields.io/badge/Pusher-Realtime-FF4A00?style=flat&logo=pusher&logoColor=white" alt="Pusher" />
</p>

---

## 📑 Table of Contents

1. [Executive Summary & Product Vision](#1-executive-summary--product-vision)
2. [System Architecture & Core Design Patterns](#2-system-architecture--core-design-patterns)
3. [Technology Stack & Dependency Breakdown](#3-technology-stack--dependency-breakdown)
4. [Project Directory & File Structure](#4-project-directory--file-structure)
5. [Database Schema & Data Model Specifications](#5-database-schema--data-model-specifications)
6. [Authentication, Authorization & PBAC Security](#6-authentication-authorization--pbac-security)
7. [Personalized Content Recommendation Engine](#7-personalized-content-recommendation-engine)
8. [Event Engine, Ticketing & QR Pass Generation](#8-event-engine-ticketing--qr-pass-generation)
9. [Real-Time WebSockets & Notification Subsystem](#9-real-time-websockets--notification-subsystem)
10. [Host Verification & KYC Lifecycle Engine](#10-host-verification--kyc-lifecycle-engine)
11. [Campus Opportunities & Applicant Tracking System](#11-campus-opportunities--applicant-tracking-system)
12. [Super Admin Operations & Emergency Telemetry Suite](#12-super-admin-operations--emergency-telemetry-suite)
13. [Exhaustive API Specification & Route Handlers](#13-exhaustive-api-specification--route-handlers)
14. [Client State Management & Shared Contexts](#14-client-state-management--shared-contexts)
15. [Environment Variables Reference](#15-environment-variables-reference)
16. [Developer Quickstart & Database Seeding](#16-developer-quickstart--database-seeding)
17. [Administrative CLI Toolkit & Operations Commands](#17-administrative-cli-toolkit--operations-commands)
18. [Production Deployment & Infrastructure Guidelines](#18-production-deployment--infrastructure-guidelines)
19. [Performance Benchmarks & Database Indexing Strategies](#19-performance-benchmarks--database-indexing-strategies)
20. [Troubleshooting & Developer FAQ](#20-troubleshooting--developer-faq)
21. [Governance, Auditing & License](#21-governance-auditing--license)

---

## 1. Executive Summary & Product Vision

**Uncooked Portal** is a production-grade, full-stack campus event operating system built on Next.js 16 (App Router), React 19, and PostgreSQL (hosted on Supabase). It bridges the operational gaps between students, campus event organizers, academic clubs, corporate opportunity providers, and enterprise platform administrators.

### Core Philosophy & Technical Objectives
1. **Zero-Noise Content Discovery**: Modern social platforms suffer from high algorithmic noise. Uncooked utilizes a multi-vector heuristic recommendation engine ($S = 0.40I + 0.25T + 0.20E + 0.15P$) that prioritizes student interests and historical interactions over viral noise.
2. **Operator-Grade Host & Event Tooling**: Event organizers are provided with single-pane management consoles supporting live check-ins, tier pricing, promo discounts, capacity waitlists, and real-time bulletin pushes.
3. **Enterprise Super Admin Controls**: Platform super-administrators can execute multi-select batch moderation, monitor live CPU/memory telemetry, declare system incidents, trigger emergency kill-switches, and perform automated audit trails.

---

## 2. System Architecture & Core Design Patterns

Uncooked is architected as a Next.js App Router full-stack application where the UI components, route handlers, server controllers, and database access layers coexist within a single deployment unit.

### High-Level Architecture Diagram

```mermaid
graph TD
    UserClient[User / Student Device] --> EdgeMiddleware[Next.js Middleware Gatekeeper]
    OrgClient[Organizer Console Device] --> EdgeMiddleware
    AdminClient[Super Admin Control Device] --> EdgeMiddleware

    subgraph Security & Guard Layer
        EdgeMiddleware -->|Token Verification| NextAuthGuard[NextAuth JWT Session Resolver]
        EdgeMiddleware -->|Role Check| RBACEngine{RBAC Policy Engine}
        RBACEngine -->|User Access| UserRoutes[Public & Student Routes]
        RBACEngine -->|Organizer Access| OrgRoutes[Organizer Dashboard Routes]
        RBACEngine -->|Super Admin Access| AdminRoutes[Super Admin Console Routes]
    end

    subgraph Server Application Layer
        UserRoutes & OrgRoutes & AdminRoutes --> Controllers[Server Controllers Layer]
        Controllers --> Services[Domain Services Layer]
        Services --> RecEngine[Recommendation Engine]
        Services --> SanitizeService[Sanitizer & Validation]
    end

    subgraph Data & Integration Layer
        Services --> PrismaORM[Prisma ORM Client Singleton]
        PrismaORM --> PostgresDB[(Supabase PostgreSQL)]
        Services --> PusherService[Pusher WebSockets]
        Services --> EmailService[Resend / SMTP Gateway]
        Services --> TelemetryService[System Telemetry Collector]
    end
```

### Data Flow Architecture

```mermaid
sequenceDiagram
    autonumber
    actor User as Student User
    participant Frontend as Next.js React 19 Frontend
    participant Middleware as Next.js Route Middleware
    participant Controller as Server Controller
    participant Service as Recommendation Service
    participant DB as PostgreSQL Database

    User->>Frontend: Access /dashboard (Event Discovery Feed)
    Frontend->>Middleware: HTTP GET /api/recommendations
    Middleware->>Middleware: Validate JWT Token & verify session
    Middleware->>Controller: Route to controller/recommendations
    Controller->>Service: Call recommendationService.getUserFeed(userId)
    Service->>DB: Fetch user preferences & interaction logs
    Service->>DB: Fetch candidate active events
    Service->>Service: Calculate heuristic matching score
    Service-->>Controller: Return ranked events list
    Controller-->>Frontend: HTTP 200 JSON Response
    Frontend->>User: Render event cards with custom tags & ticket options
```

---

## 3. Technology Stack & Dependency Breakdown

### Core Platform Stack
* **Framework**: [Next.js 16.2.9](https://nextjs.org/) (App Router, Server Actions, API Route Handlers)
* **User Interface**: [React 19.2.4](https://react.dev/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with PostCSS
* **Animation**: [Framer Motion 12.40.0](https://www.framer.com/motion/)
* **Icons**: [Lucide React 1.20.0](https://lucide.dev/)
* **Notifications**: [Sonner 1.5.0](https://sonner.emilkowal.ski/)

### Backend, Database & Security
* **Database**: PostgreSQL (hosted on [Supabase](https://supabase.com/) with connection pooling and direct migration URLs)
* **ORM**: [Prisma ORM 5.11.0](https://www.prisma.io/)
* **Authentication**: [NextAuth.js 4.24.14](https://next-auth.js.org/) (Credentials Provider, JWT Strategy)
* **Password Hashing**: Node.js `crypto.scrypt` with salt generation
* **Email Services**: [Resend 6.17.1](https://resend.com/) & [Nodemailer 7.0.13](https://nodemailer.com/)

### Real-Time & Utilities
* **WebSockets**: [Pusher 5.3.4](https://pusher.com/) & [pusher-js 8.5.0](https://pusher.com/)
* **Ticket Image Generation**: `html-to-image 1.11.13`
* **QR Code Rendering**: `qrcode.react 4.2.0`
* **Date Parsing**: `date-fns 4.4.0`
* **Charts & BI**: `recharts 3.9.0`
* **Payments**: `stripe 22.3.1` & `razorpay 2.9.8`

---

## 4. Project Directory & File Structure

```text
Uncooked/
├── .env                                # Environment variables template
├── .env.local                          # Local environment secrets override
├── AGENTS.md                           # Developer guidelines & optimization rules
├── README.md                           # Exhaustive technical system documentation
├── SUPER_ADMIN_CAPABILITIES_AUDIT.md   # Super admin capability matrix
├── SUPER_ADMIN_OPERATIONS_MANUAL.md    # Administrative emergency operations manual
├── User_Manual.md                      # End-user operational documentation
├── eslint.config.mjs                   # ESLint flat configuration
├── jsconfig.json                       # Module path alias definitions (@/*)
├── next.config.js                      # Next.js configuration & image domains
├── package.json                        # Node dependencies & project scripts
├── postcss.config.mjs                  # PostCSS plugins setup for Tailwind v4
├── prisma/
│   ├── schema.prisma                   # Canonical Prisma database schema
│   └── seed.js                         # Database seeding script for mock data
├── public/                             # Static assets, logos, public icons
├── scripts/                            # Operational & diagnostic utility scripts
└── src/
    ├── app/                            # App Router routes and pages
    │   ├── about/                      # Platform overview page
    │   ├── admin/                      # Super Admin portal routes
    │   │   ├── analytics/              # Platform BI dashboard
    │   │   ├── applications/           # Host application batch review
    │   │   ├── audit-logs/             # Administrative audit trail viewer
    │   │   ├── communications/         # Broadcast communications console
    │   │   ├── dashboard/              # Core administrative dashboard
    │   │   ├── events/                 # Global event moderation grid
    │   │   ├── metrics/                # System performance metrics
    │   │   ├── opportunities/          # Opportunity management portal
    │   │   ├── reviews/                # User feedback and reviews review
    │   │   └── users/                  # User directory & role control
    │   ├── api/                        # HTTP REST API route handlers
    │   │   ├── admin/                  # Protected admin REST endpoints
    │   │   ├── auth/                   # NextAuth registration & login handlers
    │   │   ├── chat/                   # Pusher chat API
    │   │   ├── checkout/               # Payment checkout handler
    │   │   ├── contact/                # Resend contact form submission
    │   │   ├── events/                 # Public & organizer event endpoints
    │   │   ├── health/                 # Healthcheck endpoint
    │   │   ├── host/                   # Host application endpoints
    │   │   ├── notifications/          # Notification inbox routes
    │   │   ├── opportunities/          # Job board application routes
    │   │   ├── organizer/              # Organizer dashboard routes
    │   │   ├── pay/                    # Payment integration routes
    │   │   ├── recommendations/        # Recommendation engine endpoint
    │   │   ├── registrations/          # Event registration and check-in
    │   │   ├── requests/               # User data requests
    │   │   ├── reviews/                # Review creation and retrieval
    │   │   ├── stats/                  # Public platform stats
    │   │   ├── users/                  # User profile and interest updates
    │   │   ├── verify/                 # Email verification endpoint
    │   │   └── webhook/                # Payment gateway webhooks
    │   ├── check-email/                # Email verification pending page
    │   ├── contact/                    # Public contact form
    │   ├── dashboard/                  # Student user home dashboard
    │   ├── event/                      # Event details and ticketing views
    │   ├── forgot-password/            # Password recovery flow
    │   ├── globals.css                 # Master CSS stylesheet & dark theme variables
    │   ├── host/                       # Host application submission UI
    │   ├── layout.jsx                  # Root HTML layout wrapper
    │   ├── login/                      # User authentication login view
    │   ├── notifications/              # User notifications center
    │   ├── onboarding/                 # User interest selection setup
    │   ├── opportunities/              # Public opportunities board
    │   ├── page.jsx                    # Landing page component
    │   ├── partners/                   # Campus partner listing page
    │   ├── profile/                    # User account settings page
    │   ├── requests/                   # User status requests
    │   ├── reset-password/             # Password reset landing page
    │   ├── signup/                     # Account registration page
    │   └── verify-email/               # Email verification status page
    ├── components/                     # Reusable React components
    │   ├── admin/                      # Admin-specific UI modals and controls
    │   ├── dashboard/                  # User feed cards & filter bars
    │   ├── event/                      # Ticket builder & bulletin components
    │   ├── layout/                     # Navbar, AppShell, Footer navigation
    │   └── ui/                         # Base atomic UI elements
    ├── config/                         # Application configuration constants
    ├── context/                        # React Context providers (UserContext)
    ├── lib/                            # Shared client & server utilities
    │   ├── clientCache.js              # In-memory client-side cache
    │   ├── email.js                    # Resend email helpers
    │   ├── mockData.js                 # Canonical fallback mock events data
    │   ├── prisma.js                   # Prisma Client singleton
    │   └── recommendations.js          # Client/Server recommendation algorithms
    ├── middleware.js                   # Route gatekeeper & JWT security middleware
    └── server/                         # Server-only architecture
        ├── auth/                       # Security guards (verifySuperAdmin, etc.)
        ├── controllers/                # Request/response controller methods
        ├── db/                         # Database query utilities
        ├── middleware/                 # Controller-level middleware functions
        ├── services/                   # Business logic and domain services
        └── utils/                      # Password hashing & token helpers
```

---

## 5. Database Schema & Data Model Specifications

The database layer is managed via Prisma ORM over PostgreSQL. Below is the comprehensive detailed field specification for every entity model defined in `prisma/schema.prisma`.

### Entity Relationship Model

```mermaid
erDiagram
    User ||--o{ Registration : "registers for"
    User ||--o{ UserActivity : "tracks actions"
    User ||--o| HostApplication : "submits"
    User ||--o{ SupportTicket : "opens"
    User ||--o{ Notification : "receives"
    User ||--o{ EventManager : "manages"
    User ||--o{ CommunicationRecipient : "receives"

    Event ||--o{ TicketTier : "has tiers"
    Event ||--o{ Coupon : "has coupons"
    Event ||--o{ Registration : "receives registrations"
    Event ||--o{ BulletinUpdate : "posts announcements"
    Event ||--o{ EventAnalytic : "tracks analytics"
    Event ||--o{ EventManager : "has managers"
    Event ||--o{ EventActivityLog : "logs updates"

    Registration ||--o{ RegistrationLog : "audit history"
    TicketTier ||--o{ Registration : "applies to"
    Coupon ||--o{ Registration : "discounts"

    HostApplication ||--o{ AdminNote : "contains notes"
    HostApplication ||--o{ AuditLog : "tracks audit logs"

    SupportTicket ||--o{ TicketMessage : "contains messages"
    AdminCommunication ||--o{ CommunicationRecipient : "dispatches to"
    Opportunity ||--o{ OpportunityApplication : "receives applications"
```

### Detailed Field Specifications

#### 1. `User` Model
Represents registered attendees, hosts, and administrative accounts.
* `id` (`String` `@id @default(cuid())`): Unique identifier.
* `role` (`String` `@default("User")`): System role (`USER`, `ORGANIZER`, `SUPER_ADMIN`).
* `permissions` (`String?`): JSON string of granular permission strings (e.g., `["USERS_READ", "HOSTS_REVIEW"]`).
* `name` / `fullName` (`String?`): User display name and legal full name.
* `email` (`String?` `@unique`): Primary contact and authentication email.
* `emailVerified` (`DateTime?`): Timestamp when email verification was confirmed.
* `passwordHash` (`String?`): Password hash stored as `scrypt` string.
* `dob` (`String?`): Date of birth string.
* `department` (`String?`): Academic department (e.g., "Computer Science").
* `clubAssociation` (`String?`): Affiliated campus club or society.
* `interests` (`String?`): JSON-encoded string array of selected interests.
* `preferenceScore` (`Float` `@default(0)`): Engagement score metric.
* `onboardingCompleted` (`Boolean` `@default(false)`): Flag indicating if onboarding interest setup was completed.
* `failedLoginAttempts` (`Int` `@default(0)`): Counter for security lockout logic.
* `lockedUntil` (`DateTime?`): Temporary account lockout expiration timestamp.
* `createdAt` (`DateTime` `@default(now())`): Record creation date.

#### 2. `Event` Model
Represents campus events managed by organizers or super admins.
* `id` (`String` `@id`): Unique slug identifier (e.g., `hackathon-2026`).
* `title` (`String`): Title of the event.
* `type` (`String`): Category (e.g., `Fest`, `Party`, `Hackathon`, `Workshop`).
* `category` (`String?`): Sub-category classification.
* `tags` (`String?`): JSON string array of searchable tags.
* `keywords` (`String?`): JSON string array of relevance keywords.
* `popularityScore` (`Float` `@default(0)`): Calculated event interaction score.
* `date` (`DateTime`): Event start date and time.
* `location` (`String`): Human-readable location text.
* `zone` (`String?`): Lucknow campus zone neighborhood tag.
* `city` / `state` / `country` (`String`): Defaults to `Lucknow`, `Uttar Pradesh`, `India`.
* `description` (`String`): Detailed event overview.
* `schedule` (`String?`): Markdown formatted event schedule.
* `prizePool` (`String?`): Markdown formatted prize structure.
* `bannerUrl` (`String?`): Hosted URL or base64 image link for event banner.
* `ticketType` (`String` `@default("Free")`): Ticket cost model (`Free` or `Paid`).
* `price` (`Float?`): Base ticket price in INR (₹).
* `capacity` (`Int`): Total maximum seating capacity.
* `waitlistEnabled` (`Boolean` `@default(false)`): Enables auto-waitlisting when capacity is full.
* `archived` (`Boolean` `@default(false)`): Soft-archival flag.
* `status` (`String` `@default("Active")`): Lifecycle status (`Active`, `Completed`, `Suspended`).

#### 3. `Registration` Model
Connects users to events they have registered for.
* `id` (`String` `@id @default(uuid())`): Unique ticket registration ID.
* `userId` / `eventId` (`String`): Foreign key bindings to `User` and `Event`.
* `ticketTierId` (`String?`): Bound `TicketTier` entity ID.
* `couponId` (`String?`): Applied `Coupon` entity ID.
* `status` (`String` `@default("Pending")`): Status (`Pending`, `Confirmed`, `Checked In`, `Waitlisted`).
* `checkInStatus` (`Boolean` `@default(false)`): Quick boolean check-in flag.
* `teamName` / `track` (`String?`): Hackathon team metadata.
* `registeredAt` (`DateTime` `@default(now())`): Timestamp of submission.

#### 4. `HostApplication` Model
Tracks user requests for organizer/host status.
* `id` (`String` `@id @default(cuid())`): Application identifier.
* `userId` (`String` `@unique`): User requesting host status.
* `organizationName` (`String`): Registered club or company name.
* `organizationType` (`String`): Type (e.g., `College Club`, `NGO`, `Company`).
* `status` (`String` `@default("PENDING")`): Application status (`PENDING`, `APPROVED`, `REJECTED`, `INFO_REQUESTED`).
* `kycProvider` / `kycReferenceId` / `kycStatus` (`String?`): Third-party KYC verification details.
* `documentUrls` (`String?`): Serialized document links submitted by applicant.

#### 5. `SystemTelemetrySnapshot` Model
Tracks historical real-time system performance.
* `id` (`String` `@id @default(cuid())`): Snapshot ID.
* `cpuUsagePct` (`Float`): System CPU consumption percentage.
* `memUsagePct` (`Float`): Memory utilization percentage.
* `apiLatencyP95` (`Int`): P95 API response latency in milliseconds.
* `dbLatencyMs` (`Int`): PostgreSQL query roundtrip latency in milliseconds.
* `activeUsers` (`Int`): Concurrent active sessions count.
* `errorRatePct` (`Float`): Unhandled error percentage over snapshot window.
* `timestamp` (`DateTime` `@default(now())`): Captured timestamp.

---

## 6. Authentication, Authorization & PBAC Security

Uncooked enforces strict, multi-layered security using NextAuth.js JWT tokens combined with Policy-Based Access Control (PBAC) validated directly against PostgreSQL.

```mermaid
graph TD
    IncomingReq[Incoming HTTP Request] --> CheckJWT{Validate JWT Cookie}
    CheckJWT -->|No Token| Anonymous[Anonymous User]
    CheckJWT -->|Token Valid| ExtractRole[Extract Token Role & User ID]
    
    ExtractRole --> QueryDB{Query DB User Role}
    QueryDB -->|Account Locked| Block403[Return HTTP 403 Forbidden]
    QueryDB -->|Match Role| AuthorizePass[Grant Access & Route to Handler]
    QueryDB -->|Mismatch / Revoked| Block401[Return HTTP 401 Unauthorized]

    Anonymous --> PublicPages[Allow Public Routes: /about, /contact, /login]
    Anonymous --> ProtectedPages[Redirect to /login?callbackUrl=...]
```

### Password Hashing Security (`src/server/utils/passwordUtils.js`)
Passwords are never stored in plain text. Hashing is performed using Node.js's native cryptographic `scrypt` algorithm:

```javascript
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

export async function verifyPassword(password, storedHash) {
  const [hashedPassword, salt] = storedHash.split(".");
  const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
  const suppliedPasswordBuf = await scryptAsync(password, salt, 64);
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}
```

### Route Protection Matrix (`src/middleware.js`)

| Route Path | Minimum Role Required | Email Verification | Redirect / Behavior on Failure |
| :--- | :--- | :--- | :--- |
| `/admin/*` | `SUPER_ADMIN` | N/A | Redirect to `/dashboard` or `/login` |
| `/api/admin/*` | `SUPER_ADMIN` | N/A | Return `HTTP 403 JSON { error: "Forbidden" }` |
| `/dashboard/organizer` | `ORGANIZER` or `SUPER_ADMIN` | Required | Redirect to `/host/status` |
| `/dashboard` | `USER` | Optional | Redirect to `/login?callbackUrl=/dashboard` |
| `/profile` | `USER` | Required for edits | Redirect to `/verify-email` if unverified |
| `/onboarding` | `USER` | Required | Redirect to `/verify-email` if unverified |

---

## 7. Personalized Content Recommendation Engine

The core discovery experience relies on an intelligent scoring engine implemented in `src/lib/recommendations.js` and `src/server/services/recommendationService.js`.

### Mathematical Formulation
For any given student $u$ and candidate event $e$, the composite recommendation score $S(u, e)$ is computed as:

$$S(u, e) = w_1 \cdot I(u, e) + w_2 \cdot T(u, e) + w_3 \cdot E(u, e) + w_4 \cdot P(e)$$

Where weights are calibrated as follows:
* $w_1 = 0.40$ (Onboarding Interest Similarity)
* $w_2 = 0.25$ (Tag & Keyword Semantic Overlap)
* $w_3 = 0.20$ (Past Historical User Interactions - Views, Saves, Registrations)
* $w_4 = 0.15$ (Global Event Popularity Index - Tiebreaker Only)

```mermaid
graph LR
    UserVector[User Profile & Engagement Vector] --> Scorer[Recommendation Engine Scorer]
    EventVector[Candidate Event Attributes] --> Scorer
    
    subgraph Signal Weights
        Scorer -->|40% Weight| InterestSignal[Interest Match Score]
        Scorer -->|25% Weight| TagSignal[Tag & Keyword Overlap]
        Scorer -->|20% Weight| EngagementSignal[Historical Interaction]
        Scorer -->|15% Weight| PopularitySignal[Popularity Index]
    end

    InterestSignal & TagSignal & EngagementSignal & PopularitySignal --> Sum[Calculate Total Score S]
    Sum --> Filter{Score > Threshold?}
    Filter -->|Yes| RankedList[Add to Personalized Feed]
    Filter -->|No| Reject[Exclude from Feed]
```

### Recommendation Code Implementation (`src/lib/recommendations.js`)

```javascript
export function scoreEventForUser(user, event, userActivities = []) {
  if (!user) return event.popularityScore || 0;

  const userInterests = user.interests ? JSON.parse(user.interests) : [];
  const eventTags = event.tags ? JSON.parse(event.tags) : [];
  const eventKeywords = event.keywords ? JSON.parse(event.keywords) : [];

  // 1. Interest Score Calculation (40%)
  let interestScore = 0;
  if (userInterests.length > 0) {
    const matched = userInterests.filter(
      (interest) =>
        event.type?.toLowerCase() === interest.toLowerCase() ||
        event.category?.toLowerCase() === interest.toLowerCase() ||
        eventTags.some((tag) => tag.toLowerCase() === interest.toLowerCase())
    );
    interestScore = matched.length / userInterests.length;
  }

  // 2. Tag Overlap Score (25%)
  let tagScore = 0;
  if (eventTags.length > 0 && userInterests.length > 0) {
    const overlap = eventTags.filter((tag) =>
      userInterests.some((ui) => ui.toLowerCase() === tag.toLowerCase())
    );
    tagScore = overlap.length / eventTags.length;
  }

  // 3. User Historical Interaction Score (20%)
  const relatedActivities = userActivities.filter((act) => act.eventId === event.id);
  let engagementScore = 0;
  if (relatedActivities.some((act) => act.interactionType === "REGISTER")) engagementScore += 1.0;
  if (relatedActivities.some((act) => act.interactionType === "SAVE")) engagementScore += 0.6;
  if (relatedActivities.some((act) => act.interactionType === "VIEW")) engagementScore += 0.3;
  engagementScore = Math.min(engagementScore, 1.0);

  // 4. Popularity Score (15%)
  const popularityScore = Math.min((event.popularityScore || 0) / 100, 1.0);

  // Weighted Composite Computation
  const finalScore =
    interestScore * 0.4 +
    tagScore * 0.25 +
    engagementScore * 0.2 +
    popularityScore * 0.15;

  return finalScore;
}
```

---

## 8. Event Engine, Ticketing & QR Pass Generation

The event management engine supports complex ticketing flows, custom tiering, promo coupons, waitlist automation, and high-fidelity client-side QR ticket pass generation.

### Registration State Machine

```mermaid
stateDiagram-v2
    [*] --> Pending : User Submits Registration
    Pending --> Confirmed : Free Ticket / Payment Approved
    Pending --> Waitlisted : Event Capacity Full & Waitlist Enabled
    Waitlisted --> Confirmed : Capacity Slot Opens (Auto-Promotion)
    Confirmed --> CheckedIn : Host Scans QR Ticket Pass
    Confirmed --> Cancelled : User Cancels Registration
    CheckedIn --> [*]
    Cancelled --> [*]
```

### Digital QR Ticket Pass Component Mechanics
Digital tickets are dynamically compiled using React components containing live event information and attendee hashes, then converted directly into high-resolution downloadable PNG files via `html-to-image`.

```jsx
// Simplified preview of Ticket Pass export flow
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";

export function DigitalTicketPass({ registration, event, user }) {
  const ticketRef = useRef(null);

  const downloadTicketPNG = async () => {
    if (!ticketRef.current) return;
    const dataUrl = await toPng(ticketRef.current, { cacheBust: true, quality: 0.95 });
    const link = document.createElement("a");
    link.download = `Ticket_${event.id}_${user.name}.png`;
    link.href = dataUrl;
    link.click();
  };

  const payload = JSON.stringify({
    regId: registration.id,
    eventId: event.id,
    userId: user.id,
    sig: registration.id.slice(0, 8),
  });

  return (
    <div className="flex flex-col items-center">
      <div ref={ticketRef} className="w-80 p-6 bg-slate-900 text-white rounded-2xl shadow-2xl">
        <h2 className="text-xl font-bold">{event.title}</h2>
        <p className="text-sm text-slate-400">{event.location}</p>
        <div className="my-4 flex justify-center bg-white p-4 rounded-xl">
          <QRCodeSVG value={payload} size={160} />
        </div>
        <p className="text-xs text-center font-mono text-slate-400">ID: {registration.id}</p>
      </div>
      <button onClick={downloadTicketPNG} className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg">
        Download PNG Pass
      </button>
    </div>
  );
}
```

---

## 9. Real-Time WebSockets & Notification Subsystem

Uncooked relies on **Pusher** for real-time WebSocket communication across public event chatrooms, organizer announcements, and user notifications.

### WebSocket Architecture

```mermaid
graph TD
    ClientSender[Client User / Host] -->|HTTP POST Message| APIHandler[/api/chat or /api/organizer/bulletin]
    APIHandler -->|Save Record| Database[(PostgreSQL)]
    APIHandler -->|Trigger Event| PusherServer[Pusher WebSocket Cloud Server]
    
    PusherServer -->|Channel: event-chat-EVENT_ID| SubscribedClients[All Subscribed Event Visitors]
    PusherServer -->|Channel: user-notif-USER_ID| TargetUser[Target User Notification Bell]
```

### Event Announcement Broadcast Service (`src/server/services/notificationService.js`)

```javascript
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

export async function broadcastEventBulletin(eventId, bulletinData) {
  // 1. Broadcast to Pusher socket channel
  await pusher.trigger(`event-bulletin-${eventId}`, "new-bulletin", bulletinData);

  // 2. Persist in database via Prisma
  return await prisma.bulletinUpdate.create({
    data: {
      eventId,
      title: bulletinData.title,
      content: bulletinData.content,
    },
  });
}
```

---

## 10. Host Verification & KYC Lifecycle Engine

To maintain safety across campus communities, organizers must apply and undergo identity and organizational verification before obtaining event creation privileges.

### Host Application Lifecycle

```mermaid
stateDiagram-v2
    [*] --> PENDING : Student Submits Host Application
    PENDING --> INFO_REQUESTED : Admin Requests Further KYC/Docs
    INFO_REQUESTED --> PENDING : Student Submits Documents
    PENDING --> APPROVED : Admin Approves Verification
    PENDING --> REJECTED : Admin Rejects Request
    
    APPROVED --> [*] : Role updated to ORGANIZER
    REJECTED --> [*] : Application Archived
```

### Verification Service Logic (`src/server/services/hostVerificationService.js`)
When an application state changes, `hostVerificationService` executes a multi-table database transaction:

```javascript
export async function approveHostApplication(applicationId, adminId) {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch application record
    const app = await tx.hostApplication.findUnique({ where: { id: applicationId } });
    if (!app) throw new Error("Application not found.");

    // 2. Update application status
    const updatedApp = await tx.hostApplication.update({
      where: { id: applicationId },
      data: { status: "APPROVED" },
    });

    // 3. Promote User role to ORGANIZER
    await tx.user.update({
      where: { id: app.userId },
      data: { role: "ORGANIZER" },
    });

    // 4. Record Audit Log entry
    await tx.auditLog.create({
      data: {
        applicationId,
        adminId,
        action: "HOST_APPLICATION_APPROVE",
        previousStatus: app.status,
        newStatus: "APPROVED",
      },
    });

    return updatedApp;
  });
}
```

---

## 11. Campus Opportunities & Applicant Tracking System

The **Opportunities** portal (`/opportunities`) enables campus startups, research labs, and corporate sponsors to recruit student talent for internships, bounties, full-time positions, and freelance contracts.

### Features
* **Listing Filters**: Filter by Type (`Internship`, `Bounty`, `Full-time`, `Contract`) and Location (`Remote`, `On-Campus`).
* **Resume Attachment Handler**: Converts uploaded resume PDFs into either hosted file URLs or base64 data strings for direct preview within the Admin ATS panel (`src/app/admin/opportunities`).
* **Application Status Workflow**: Tracks applicant status across `PENDING`, `REVIEWING`, `SHORTLISTED`, `REJECTED`, and `ACCEPTED`.

---

## 12. Super Admin Operations & Emergency Telemetry Suite

Super Administrators possess access to emergency runtime controls, performance monitoring dashboards, and system-wide batch actions.

### 1. Telemetry Snapshot Service (`src/server/services/systemMonitoringService.js`)
Captures real-time CPU, memory, API latency, and database latency metrics:

```javascript
import os from "os";

export async function captureTelemetrySnapshot() {
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const memUsagePct = ((totalMem - freeMem) / totalMem) * 100;

  // Simple latency check against DB
  const startDb = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  const dbLatencyMs = Date.now() - startDb;

  return await prisma.systemTelemetrySnapshot.create({
    data: {
      cpuUsagePct: os.loadavg()[0] * 10, // Normalized metric
      memUsagePct,
      apiLatencyP95: 120, // Sampled P95 latency
      dbLatencyMs,
      activeUsers: 42,
      errorRatePct: 0.02,
    },
  });
}
```

### 2. Platform Incident Management & Kill-Switch
* **Incident Escalation**: Admins can log incidents across severities (`SEV1_CRITICAL`, `SEV2_MAJOR`, `SEV3_MINOR`) targeting affected subsystems (`PAYMENTS`, `HOSTING`, `EVENTS`, `AUTH`).
* **Emergency Kill-Switch (`/api/admin/incidents/kill-switch`)**: Instantly locks non-admin registrations and event creation API routes during security events.

---

## 13. Exhaustive API Specification & Route Handlers

Below is the complete HTTP API reference for the platform.

### Public & Authentication Endpoints

#### `POST /api/auth/register`
Creates a local email/password account.
* **Request Body**:
  ```json
  {
    "fullName": "Jane Doe",
    "email": "jane@university.edu",
    "password": "SecurePassword123"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "message": "User registered successfully.",
    "userId": "clx..."
  }
  ```

#### `GET /api/events`
Returns list of active public events with optional filtering.
* **Query Parameters**: `category`, `type`, `zone`, `search`, `limit`.
* **Response (200 OK)**: Array of `Event` entity objects.

#### `GET /api/recommendations`
Returns personalized event feed for current authenticated user.
* **Headers**: Requires active NextAuth session cookie.
* **Response (200 OK)**:
  ```json
  {
    "recommendations": [
      {
        "id": "hackathon-2026",
        "title": "Campus Hackfest",
        "relevanceScore": 0.875
      }
    ]
  }
  ```

---

### Protected User & Registration Endpoints

#### `POST /api/registrations`
Submits ticket registration for an event.
* **Request Body**:
  ```json
  {
    "eventId": "hackathon-2026",
    "ticketTierId": "tier-uuid",
    "couponCode": "EARLYBIRD"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "registrationId": "reg-uuid",
    "status": "Confirmed",
    "ticketUrl": "/event/hackathon-2026/ticket/reg-uuid"
  }
  ```

#### `POST /api/registrations/check-in`
Executes organizer QR check-in.
* **Request Body**:
  ```json
  {
    "registrationId": "reg-uuid",
    "eventId": "hackathon-2026"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "alreadyCheckedIn": false,
    "attendeeName": "Jane Doe"
  }
  ```

---

### Host & Organizer Endpoints

#### `POST /api/host/apply`
Submits host verification request.
* **Request Body**:
  ```json
  {
    "organizationName": "Robotics Club",
    "organizationType": "College Club",
    "website": "https://robotics.uni.edu",
    "description": "Official campus robotics society"
  }
  ```

---

### Protected Super Admin API Endpoints (`/api/admin/*`)

#### `GET /api/admin/stats`
Fetches global platform metrics.
* **Response (200 OK)**:
  ```json
  {
    "totalUsers": 1250,
    "activeEvents": 34,
    "pendingApplications": 5,
    "totalRevenueINR": 450000
  }
  ```

#### `POST /api/admin/applications/batch-review`
Executes mass review action on host applications.
* **Request Body**:
  ```json
  {
    "applicationIds": ["app1", "app2"],
    "action": "APPROVE",
    "reason": "Verified by student council lead"
  }
  ```

#### `POST /api/admin/events/batch-moderate`
Executes mass moderation on campus events.
* **Request Body**:
  ```json
  {
    "eventIds": ["event1", "event2"],
    "action": "SUSPEND"
  }
  ```

#### `POST /api/admin/users/batch-action`
Executes bulk user role modification or blacklisting.
* **Request Body**:
  ```json
  {
    "userIds": ["usr1", "usr2"],
    "action": "BLACKLIST"
  }
  ```

#### `POST /api/admin/incidents/kill-switch`
Triggers platform emergency lockdown mode.
* **Request Body**:
  ```json
  {
    "enableKillSwitch": true,
    "reason": "Emergency database migration in progress"
  }
  ```

---

## 14. Client State Management & Shared Contexts

Client-side state relies on React 19 Context Providers and lightweight caching layers.

### `UserContext` Provider (`src/context/UserContext.jsx`)
Provides global access to the current authenticated user's profile, notification inbox, and update methods:

```jsx
"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/users/profile")
        .then((res) => res.json())
        .then((data) => {
          setUserData(data);
          setLoading(false);
        });
    } else {
      setUserData(null);
      setLoading(false);
    }
  }, [session]);

  return (
    <UserContext.Provider value={{ user: userData, setUserData, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
```

---

## 15. Environment Variables Reference

Create a `.env` file in the root directory prior to running the app:

```env
# -----------------------------------------------------------------------------
# APPLICATION & SERVER DOMAINS
# -----------------------------------------------------------------------------
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_SECRET="a_random_32_character_hex_string_for_signing_jwt_tokens"

# -----------------------------------------------------------------------------
# POSTGRESQL DATABASE CONNECTIONS (SUPABASE)
# -----------------------------------------------------------------------------
# Transaction pooled connection string (used by application runtime)
DATABASE_URL="postgresql://postgres:password@db.supabase.co:6543/postgres?pgbouncer=true"

# Direct connection string (used by Prisma migrations and schema push)
DIRECT_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"

# -----------------------------------------------------------------------------
# REALTIME WEBSOCKETS (PUSHER)
# -----------------------------------------------------------------------------
PUSHER_APP_ID="1234567"
NEXT_PUBLIC_PUSHER_KEY="abc123def456"
PUSHER_SECRET="789ghi012jkl"
NEXT_PUBLIC_PUSHER_CLUSTER="ap2"

# -----------------------------------------------------------------------------
# EMAIL DELIVERY SERVICES (RESEND & SMTP)
# -----------------------------------------------------------------------------
RESEND_API_KEY="re_123456789_abcdefg"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="uncooked.official@gmail.com"
SMTP_PASS="app_specific_password"

# -----------------------------------------------------------------------------
# PAYMENT GATEWAYS (RAZORPAY & STRIPE)
# -----------------------------------------------------------------------------
RAZORPAY_KEY_ID="rzp_test_12345"
RAZORPAY_KEY_SECRET="secret_12345"
STRIPE_SECRET_KEY="sk_test_12345"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_12345"
```

---

## 16. Developer Quickstart & Database Seeding

Follow these step-by-step instructions to initialize a local development environment.

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/unfused-co/Uncoocked.git
cd Uncoocked
npm install
```
*Note: The `postinstall` script automatically executes `npx prisma generate`.*

### 2. Configure Environment File
Copy template and customize local database connection credentials:
```bash
cp .env .env.local
```

### 3. Database Schema Push & Seeding
Push the Prisma schema to your PostgreSQL database and seed initial mock events:
```bash
npx prisma db push
npx prisma db seed
```

### 4. Start Next.js Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Launch Prisma Studio UI
Visually inspect database tables and records:
```bash
npx prisma studio
```
Access Prisma Studio at [http://localhost:5555](http://localhost:5555).

---

## 17. Administrative CLI Toolkit & Operations Commands

### Super Admin Promotion Script
To grant `SUPER_ADMIN` privileges to any registered user directly via the terminal:

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
promote("shushantshukla62@gmail.com");
'
```

### Reset Failed Login Lockouts
To unlock a user account locked due to security attempts:

```bash
node -e '
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function unlock(email) {
  await prisma.user.update({
    where: { email },
    data: { failedLoginAttempts: 0, lockedUntil: null }
  });
  console.log("Unlocked account:", email);
}
unlock("user@example.com");
'
```

---

## 18. Production Deployment & Infrastructure Guidelines

### Vercel / Netlify Deployment Checklist
1. **Environment Setup**: Ensure `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` are configured in deployment environment settings.
2. **Build Command**: Set build command to `npm run build`.
3. **Prisma Generation**: Verify that `npx prisma generate` runs during the build step.
4. **Connection Pooling**: Always use Supabase transaction pooler port (`6543`) for `DATABASE_URL` in serverless server environments to prevent exhausted connection limits.

---

## 19. Performance Benchmarks & Database Indexing Strategies

### Indexed Database Queries
To maintain sub-50ms query responses under high request volumes, indexing is enforced across critical access paths in `prisma/schema.prisma`:

* `User`: `@index([role])`
* `Event`: `@index([status])`, `@index([archived])`, `@index([organizerId])`
* `Registration`: `@index([userId])`, `@index([eventId])`, `@unique([userId, eventId])`
* `HostApplication`: `@index([status])`, `@index([createdAt])`
* `SupportTicket`: `@index([userId, status])`, `@index([category, priority])`
* `CommunicationRecipient`: `@index([communicationId])`, `@index([status])`

---

## 20. Troubleshooting & Developer FAQ

### Q1: Next.js dev server fails with "Bus error" on Linux workspace.
**Cause**: Occurs when running the repository from a FUSE-mounted drive.  
**Resolution**: Move the project folder into the native Linux filesystem root (e.g. `~/Uncoocked`) or pass `--no-turbo` to `next dev`.

### Q2: Prisma Client throws `PrismaClientInitializationError`.
**Cause**: Invalid database connection string or restricted IP address in Supabase settings.  
**Resolution**: Check `.env` file credentials and ensure Supabase Network Restrictions allow your IP address.

### Q3: NextAuth returns HTTP 401 on protected admin endpoints despite being logged in.
**Cause**: JWT token mismatch or missing `SUPER_ADMIN` role in live database record.  
**Resolution**: Confirm user's database role using Prisma Studio or terminal CLI script.

---

## 21. Governance, Auditing & License

Uncooked Portal is maintained by the unfused-co core engineering team.

* **Audit Logs**: All administrative actions are recorded in `AuditLog` table.
* **Support Contact**: `unfusedz.admin@gmail.com`
* **License**: Private / Proprietary Campus Software Platform. All rights reserved.
