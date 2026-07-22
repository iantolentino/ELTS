# Trackr — Production Ticketing System

A modern, scalable ticketing system built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js v5 (Credentials + Google OAuth)
- **State**: Zustand (global UI), React hooks (data)
- **Validation**: Zod
- **Deployment**: Vercel + Railway/Supabase

---

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── api/                    # API route handlers
│   │   ├── auth/               # NextAuth handlers
│   │   ├── tickets/            # GET /tickets, POST /tickets
│   │   │   └── [id]/           # GET/PATCH/DELETE/POST /tickets/:id
│   │   └── users/              # GET /users, POST /users
│   ├── auth/
│   │   ├── login/              # Login page
│   │   └── register/           # Register page
│   ├── tickets/                # Tickets list page
│   │   └── [id]/               # Single ticket detail page
│   ├── dashboard/              # Dashboard page
│   ├── team/                   # Team management page
│   ├── reports/                # Reports page
│   └── settings/               # Settings page
│
├── components/                 # Reusable UI components
│   ├── ui/                     # Base components (Badge, Button, Input...)
│   ├── layout/                 # Sidebar, Header, etc.
│   ├── tickets/                # Ticket-specific components
│   └── dashboard/              # Dashboard-specific components
│
├── services/                   # Business logic & DB queries
│   ├── ticket.service.ts       # All ticket DB operations
│   └── user.service.ts         # All user DB operations
│
├── hooks/                      # Custom React hooks
│   └── useTickets.ts           # Data fetching hook for tickets
│
├── lib/                        # Core utilities & config
│   ├── prisma.ts               # Prisma singleton
│   ├── auth.ts                 # NextAuth configuration
│   └── validations/            # Zod schemas
│       ├── auth.ts
│       └── ticket.ts
│
├── types/                      # TypeScript type definitions
│   ├── index.ts                # Central export
│   ├── ticket.ts               # Ticket, User, Comment types
│   └── api.ts                  # ApiResponse, PaginatedResponse
│
├── config/                     # App-wide constants
│   └── constants.ts            # Priority/Status configs, nav items
│
├── store/                      # Zustand global state
│   └── ui.store.ts             # Sidebar, modals, nav state
│
├── utils/                      # Pure helper functions
│   ├── cn.ts                   # Tailwind className merger
│   └── ticket.ts               # formatDate, getInitials, generateTicketNumber
│
└── middleware.ts               # Route protection

prisma/
├── schema.prisma               # Database schema
└── seed.ts                     # Seed data
```

---

## Getting Started

### 1. Clone & Install

```bash
git clone <your-repo>
cd trackr
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
```

Fill in your `.env`:
- `DATABASE_URL` — get a free PostgreSQL DB from [Railway](https://railway.app) or [Supabase](https://supabase.com)
- `AUTH_SECRET` — run `openssl rand -base64 32` to generate

### 3. Set Up the Database

```bash
npm run db:push       # Push schema to DB
npm run db:seed       # Seed with demo data
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo login**: `admin@trackr.dev` / `password123`

---

## API Routes

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | /api/tickets          | List tickets (filterable)|
| POST   | /api/tickets          | Create ticket            |
| GET    | /api/tickets/:id      | Get single ticket        |
| PATCH  | /api/tickets/:id      | Update ticket            |
| DELETE | /api/tickets/:id      | Delete ticket            |
| POST   | /api/tickets/:id      | Add comment              |
| GET    | /api/users            | List users               |
| POST   | /api/users            | Register user            |

---

## Deployment

### Vercel (Frontend + API)
```bash
npm i -g vercel
vercel
```
Add your environment variables in the Vercel dashboard.

### Database (Railway)
1. Create a new PostgreSQL service on Railway
2. Copy the `DATABASE_URL` to Vercel environment variables
3. Run `npm run db:push` and `npm run db:seed`


