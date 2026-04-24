# Property Dealer CRM — Project Blueprint

> **Full-stack CRM for Pakistani real estate agents** — built with Next.js 14+ (App Router), MongoDB/Mongoose, Tailwind CSS, Socket.io, and NextAuth.

---

## 1. Project Overview

A centralized web application where **Admins** manage leads, assign them to **Agents**, and monitor performance through analytics — while **Agents** see only their assigned leads and update progress. Every action is tracked, reminders are enforced, and WhatsApp + email integrations keep communication seamless.

### Key User Roles

| Role    | Capabilities |
|---------|-------------|
| **Admin** | Full CRUD on all leads, assign/reassign leads to agents, view analytics dashboard, manage users |
| **Agent** | View assigned leads only, update lead status & notes, set follow-up reminders |

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | Next.js 14+ (App Router) | Server Components by default, API Route Handlers |
| **Language** | TypeScript | Strict mode enabled |
| **Database** | MongoDB Atlas | Hosted; free tier for dev |
| **ODM** | Mongoose 8+ | Schema validation, virtuals, middleware |
| **Auth** | NextAuth.js v5 | Credentials provider with bcrypt password hashing |
| **Styling** | Tailwind CSS v3 | Using PostCSS (Next.js default), not Vite plugin |
| **Real-Time** | Socket.io | Custom server for WebSocket; polling fallback built-in |
| **Email** | Nodemailer + Resend (or Mailtrap for dev) | HTML email templates |
| **Charts** | Recharts | Lightweight, React-native charting |
| **Validation** | Zod | Schema-based request validation |
| **Rate Limiting** | Custom middleware with in-memory store | Redis upgrade path available |

> **Note on Tailwind**: Since Next.js uses PostCSS for Tailwind (not the Vite plugin), we use Tailwind v3 conventions (`tailwind.config.ts`, `@layer base/components/utilities`). If migrating to v4, follow the Tailwind v4 skill guide.

---

## 3. Directory Structure

```
Assignment 3/
├── CLAUDE.md                          # This file
├── .env.example                       # Environment variable template
├── .env.local                         # Local secrets (git-ignored)
├── next.config.mjs                    # Next.js configuration
├── tailwind.config.ts                 # Tailwind theme + plugins
├── tsconfig.json
├── package.json
├── server.mjs                         # Custom server for Socket.io
│
├── public/
│   └── assets/                        # Static images, icons
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout (fonts, providers)
│   │   ├── page.tsx                   # Landing / redirect to dashboard
│   │   ├── globals.css                # Tailwind directives + custom styles
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx             # Auth pages layout (centered card)
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx             # Sidebar + topbar layout
│   │   │   ├── dashboard/page.tsx     # Role-aware dashboard home
│   │   │   │
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx           # Lead list (table + filters)
│   │   │   │   ├── new/page.tsx       # Create lead form (Admin)
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx       # Lead detail + timeline
│   │   │   │       └── edit/page.tsx  # Edit lead form
│   │   │   │
│   │   │   ├── analytics/page.tsx     # Admin-only analytics
│   │   │   │
│   │   │   └── settings/page.tsx      # User settings
│   │   │
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts   # NextAuth handler
│   │       ├── leads/
│   │       │   ├── route.ts                  # GET (list), POST (create)
│   │       │   └── [id]/
│   │       │       ├── route.ts              # GET, PUT, DELETE single lead
│   │       │       ├── assign/route.ts       # PATCH — assign lead
│   │       │       └── timeline/route.ts     # GET — activity timeline
│   │       ├── users/
│   │       │   └── route.ts                  # GET agents list (Admin)
│   │       ├── analytics/
│   │       │   └── route.ts                  # GET dashboard stats
│   │       └── socket/
│   │           └── route.ts                  # Socket.io handshake (if needed)
│   │
│   ├── components/
│   │   ├── ui/                        # Reusable primitives (Button, Input, Card, Badge, Modal, etc.)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── leads/
│   │   │   ├── LeadTable.tsx
│   │   │   ├── LeadCard.tsx
│   │   │   ├── LeadForm.tsx
│   │   │   ├── LeadFilters.tsx
│   │   │   ├── LeadTimeline.tsx
│   │   │   ├── LeadScoreBadge.tsx
│   │   │   └── WhatsAppButton.tsx
│   │   ├── analytics/
│   │   │   ├── StatsCards.tsx
│   │   │   ├── StatusChart.tsx
│   │   │   ├── PriorityChart.tsx
│   │   │   └── AgentPerformance.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   └── providers/
│   │       ├── AuthProvider.tsx        # NextAuth SessionProvider
│   │       ├── SocketProvider.tsx      # Socket.io context
│   │       └── ThemeProvider.tsx       # Dark mode (optional)
│   │
│   ├── lib/
│   │   ├── db.ts                      # MongoDB connection singleton
│   │   ├── auth.ts                    # NextAuth config + callbacks
│   │   ├── socket.ts                  # Socket.io client init
│   │   ├── email.ts                   # Nodemailer transporter + templates
│   │   ├── validations.ts            # Zod schemas for leads, users
│   │   └── utils.ts                   # cn(), formatCurrency(), etc.
│   │
│   ├── models/
│   │   ├── User.ts                    # Mongoose User schema
│   │   ├── Lead.ts                    # Mongoose Lead schema
│   │   └── Activity.ts               # Mongoose Activity/Audit schema
│   │
│   ├── middleware.ts                  # Next.js middleware (auth guard + rate limiting)
│   │
│   ├── hooks/
│   │   ├── useSocket.ts              # Socket.io hook
│   │   ├── useLeads.ts               # SWR/React Query for leads
│   │   └── useAuth.ts                # Session helper
│   │
│   └── types/
│       └── index.ts                   # TypeScript interfaces
```

---

## 4. Data Models (Mongoose Schemas)

### User

```typescript
{
  name:      String,          // required
  email:     String,          // required, unique, lowercase
  password:  String,          // required, hashed with bcrypt
  role:      'admin' | 'agent', // default: 'agent'
  phone:     String,
  avatar:    String,
  createdAt: Date,
  updatedAt: Date
}
```

### Lead

```typescript
{
  name:            String,      // required
  email:           String,      // required
  phone:           String,      // required (Pakistani format)
  propertyInterest: String,     // e.g. "3-bed apartment in DHA Phase 6"
  budget:          Number,      // in PKR
  priority:        'high' | 'medium' | 'low',  // auto-calculated from budget
  status:          'new' | 'contacted' | 'qualified' | 'negotiation' | 'closed-won' | 'closed-lost',
  source:          'facebook' | 'website' | 'walk-in' | 'referral' | 'other',
  notes:           String,
  assignedTo:      ObjectId,    // ref: User (agent)
  followUpDate:    Date,        // next follow-up
  lastActivityAt:  Date,        // for stale detection
  createdBy:       ObjectId,    // ref: User (admin who created)
  createdAt:       Date,
  updatedAt:       Date
}
```

**Lead Scoring Logic (Mongoose pre-save middleware):**
```
budget > 20,000,000  → priority = 'high'
budget 10M – 20M     → priority = 'medium'
budget < 10,000,000  → priority = 'low'
```

### Activity (Audit Trail)

```typescript
{
  leadId:      ObjectId,       // ref: Lead
  userId:      ObjectId,       // ref: User (who performed action)
  action:      String,         // 'created' | 'status_changed' | 'assigned' | 'note_updated' | 'follow_up_set'
  description: String,         // human-readable: "Status changed from New to Contacted"
  metadata:    Mixed,          // { oldValue, newValue, ... }
  createdAt:   Date
}
```

---

## 5. API Routes

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | `/api/auth/[...nextauth]` | — | — | NextAuth sign-in/sign-up |
| GET | `/api/leads` | ✅ | Both | List leads (Admin: all, Agent: assigned only) |
| POST | `/api/leads` | ✅ | Admin | Create a new lead |
| GET | `/api/leads/[id]` | ✅ | Both | Get single lead detail |
| PUT | `/api/leads/[id]` | ✅ | Both | Update lead (Admin: all fields, Agent: status + notes) |
| DELETE | `/api/leads/[id]` | ✅ | Admin | Delete lead |
| PATCH | `/api/leads/[id]/assign` | ✅ | Admin | Assign/reassign lead to agent |
| GET | `/api/leads/[id]/timeline` | ✅ | Both | Get activity history for lead |
| GET | `/api/users` | ✅ | Admin | List all agents (for assignment dropdowns) |
| GET | `/api/analytics` | ✅ | Admin | Dashboard statistics |

---

## 6. Middleware Stack

### 1. Authentication Middleware (`middleware.ts`)
- Uses NextAuth JWT strategy
- Protects all `/dashboard/*` and `/api/*` routes (except auth routes)
- Redirects unauthenticated users to `/login`

### 2. Role-Based Authorization
- Checked in API route handlers via session
- Admin-only routes: lead creation, deletion, assignment, analytics, user list
- Agent routes: only leads where `assignedTo === session.user.id`

### 3. Request Validation (Zod)
- Validated in each API route handler before DB operations
- Schemas defined in `src/lib/validations.ts`
- Returns `400` with structured error messages on failure

### 4. Rate Limiting
- Implemented in `middleware.ts` or as a wrapper utility
- **Agent**: max 50 requests/minute (sliding window)
- **Admin**: 200 requests/minute (or no limit)
- Uses in-memory Map with IP + user ID as key
- Returns `429 Too Many Requests` when exceeded

---

## 7. Real-Time (Socket.io)

### Architecture
- Custom `server.mjs` wraps the Next.js server and attaches Socket.io
- Namespaces: `/leads` for lead events
- Rooms: each agent joins a room with their user ID; admins join an `admin` room

### Events

| Event | Direction | Payload | When |
|-------|-----------|---------|------|
| `lead:created` | Server → Client | `{ lead }` | New lead created |
| `lead:updated` | Server → Client | `{ lead }` | Lead status/details changed |
| `lead:assigned` | Server → Client | `{ lead, agentId }` | Lead assigned/reassigned |
| `lead:deleted` | Server → Client | `{ leadId }` | Lead deleted |

### Emit Pattern
API routes emit events after successful DB operations:
```typescript
// In API route handler
io.to('admin').emit('lead:created', { lead })
io.to(lead.assignedTo).emit('lead:assigned', { lead })
```

---

## 8. Email Notifications

### Triggers

| Trigger | Recipient | Template |
|---------|-----------|----------|
| New lead created | Admin(s) | `new-lead` — lead details + priority badge |
| Lead assigned to agent | That agent | `lead-assigned` — lead summary + link to view |

### Implementation
- Use **Nodemailer** with SMTP transport
- Dev: Mailtrap / Ethereal for testing
- Prod: Resend, SendGrid, or Gmail SMTP
- HTML templates with inline CSS for email client compatibility

---

## 9. WhatsApp Integration

Simple client-side link:
```typescript
const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}`
// Example: phone = "+92 300 1234567" → "https://wa.me/923001234567"
```
- Strip all non-numeric characters
- Ensure Pakistani format: `92XXXXXXXXXX`
- Opens WhatsApp web/app with the contact pre-filled

---

## 10. Follow-Up Reminders & Stale Leads

### Detection Logic
- **Overdue follow-up**: `followUpDate < now AND status !== 'closed-won' | 'closed-lost'`
- **Stale lead**: `lastActivityAt < (now - 7 days) AND status !== 'closed-won' | 'closed-lost'`

### Dashboard Display
- Show count badges on sidebar: "3 overdue", "5 stale"
- Highlight overdue/stale leads with colored borders in lead table
- Sort overdue leads to top by default

---

## 11. Analytics (Admin Dashboard)

### Metrics
1. **Total Leads** — count
2. **Leads by Status** — pie/donut chart (new, contacted, qualified, negotiation, closed-won, closed-lost)
3. **Leads by Priority** — bar chart (high, medium, low)
4. **Leads by Source** — bar chart (facebook, website, walk-in, referral, other)
5. **Agent Performance** — table showing per-agent: total assigned, closed-won, conversion rate
6. **Trend** — line chart of leads created over time (last 30 days)

### Implementation
- All computed via MongoDB aggregation in `/api/analytics`
- Cached with `revalidate` or SWR on the client
- Recharts for visualization

---

## 12. Environment Variables

```env
# .env.example

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/property-crm

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Email (Nodemailer)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-user
SMTP_PASS=your-pass
EMAIL_FROM=noreply@propertycrm.pk

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 13. Implementation Phases

### Phase 1: Foundation
- [x] Initialize Next.js project with TypeScript + Tailwind
- [ ] Set up MongoDB connection (`src/lib/db.ts`)
- [ ] Define Mongoose models (User, Lead, Activity)
- [ ] Configure NextAuth with Credentials provider
- [ ] Build auth pages (login, register)
- [ ] Implement middleware (auth guard)

### Phase 2: Lead Management
- [ ] Lead CRUD API routes
- [ ] Lead scoring (pre-save middleware)
- [ ] Lead list page with filtering + sorting
- [ ] Lead detail page with edit form
- [ ] Activity timeline recording
- [ ] Role-based access control in routes

### Phase 3: Assignment & Communication
- [ ] Lead assignment API (admin)
- [ ] Agent-filtered lead views
- [ ] WhatsApp button component
- [ ] Email notification system
- [ ] Follow-up date picker + reminders

### Phase 4: Real-Time & Analytics
- [ ] Socket.io server setup
- [ ] Real-time event emission from API routes
- [ ] Client-side socket listeners + state updates
- [ ] Analytics API (MongoDB aggregation)
- [ ] Analytics dashboard with Recharts

### Phase 5: Polish
- [ ] Rate limiting middleware
- [ ] Request validation (Zod schemas)
- [ ] Responsive design pass
- [ ] Loading states + error boundaries
- [ ] Dark mode (optional)
- [ ] Deployment to Vercel

---

## 14. Design Tokens

```
Colors:
  Primary:     #1E40AF (blue-800)     — trust, professionalism
  Secondary:   #7C3AED (violet-600)   — accent
  Success:     #059669 (emerald-600)   — closed-won, positive
  Warning:     #D97706 (amber-600)    — follow-up, medium priority
  Danger:      #DC2626 (red-600)      — overdue, high priority
  Background:  #0F172A (slate-900)    — dark mode base
  Surface:     #1E293B (slate-800)    — card backgrounds
  Text:        #F8FAFC (slate-50)     — primary text (dark mode)

Typography:
  Font:        Inter (Google Fonts)
  Headings:    font-bold, tracking-tight
  Body:        font-normal, text-sm/text-base

Spacing:
  Sidebar:     w-64 (256px)
  Content:     max-w-7xl, px-6
  Card gap:    gap-6
```

---

## 15. Commands Reference

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run dev:socket       # Start with Socket.io server

# Build
npm run build            # Production build
npm run start            # Start production server

# Database
npm run seed             # Seed sample data (admin user + sample leads)

# Linting
npm run lint             # ESLint check
```

---

## 16. Git Strategy

- **main** — production-ready code
- **dev** — integration branch
- Feature branches: `feature/auth`, `feature/leads-crud`, `feature/analytics`, etc.
- Meaningful commit messages: `feat:`, `fix:`, `chore:`, `docs:`
- Regular commits (not one big dump at the end)

---

## 17. Deployment Notes

- **Platform**: Vercel (recommended for Next.js)
- **Database**: MongoDB Atlas (free M0 cluster)
- **Socket.io caveat**: Vercel serverless doesn't support persistent WebSocket connections. Options:
  - Use polling fallback on Vercel
  - Deploy Socket.io server separately (e.g., Railway, Render)
  - Or use Vercel + Ably/Pusher for real-time instead
- **Environment variables**: Set all `.env` vars in Vercel dashboard

---

*This document is the single source of truth for the project. All implementation decisions should reference this file.*
