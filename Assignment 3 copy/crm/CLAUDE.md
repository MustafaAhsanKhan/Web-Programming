# PropertyCRM — Project Context

> Full-stack CRM for Pakistani real estate agents. Next.js 15 App Router + MongoDB/Mongoose + Tailwind v4.

## Project Structure (root-level app/, no src/)

```
crm/
├── app/                    # Next.js App Router pages & API routes
│   ├── layout.tsx          # Root layout (Geist font, dark mode, metadata)
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Tailwind v4 design system (CSS vars + @theme inline)
│   ├── login/page.tsx      # Sign-in form
│   ├── register/page.tsx   # Registration form
│   └── api/
│       └── health/route.ts # Health check endpoint
├── lib/
│   ├── mongodb.ts          # Mongoose connection singleton (global cache)
│   └── utils.ts            # cn(), formatBudget(), getWhatsAppUrl(), timeAgo()
├── models/
│   ├── User.ts             # name, email, password (bcrypt), role (admin|agent)
│   ├── Lead.ts             # name, email, phone, budget, status, score (auto), assignedTo
│   └── Activity.ts         # Audit trail: lead ref, action, performedBy, details
├── types/
│   └── index.ts            # Client-side TS interfaces
├── .env.example            # Required env var template
└── package.json            # Dependencies: mongoose, bcryptjs, clsx, tailwind-merge
```

## Key Patterns

- **Path alias**: `@/*` maps to `./*` (root level, NOT src/)
- **Tailwind v4**: Using `@tailwindcss/postcss`, CSS variables at `:root`/`.dark`, `@theme inline` mapping
- **MongoDB**: Global cache pattern in `lib/mongodb.ts` to survive HMR
- **Models**: All use `mongoose.models.X || mongoose.model()` to prevent recompilation
- **Lead scoring**: Pre-save middleware — budget > 20M = 3 (High), 10-20M = 2 (Medium), < 10M = 1 (Low)
- **Password**: bcrypt hashing in User pre-save hook, `select: false` on password field

## Commands

```bash
npm run dev     # Start dev server on localhost:3000
npm run build   # Production build
npm run lint    # ESLint
```
