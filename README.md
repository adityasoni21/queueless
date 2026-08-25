# Queueless

### Smart Queue Management for College Administrative Services

> **Join the queue, not the crowd.**

Queueless is a role-based, real-time queue management platform designed for college administrative counters. It converts physical waiting lines into a virtual queue so students can join remotely, track their position and estimated waiting time, and arrive when their turn is approaching.

The platform is designed around three users: **Students, Staff, and Admins**.

---

## Why Queueless?

During admissions, examinations, ID-card renewal, certificates, scholarship work, and other peak periods, college administrative counters can become heavily overcrowded.

Students often have to stand in line without knowing:

- How many people are ahead of them
- How long they will have to wait
- Whether another counter is faster
- When they should actually arrive at the counter

Queueless addresses this by moving the waiting experience from a **physical queue to a virtual, trackable queue**.

---

## Core Features

### Student

- Secure login and role-based access
- Browse available administrative services
- View available counters and live queue conditions
- Smart counter recommendation based on queue/service conditions
- Generate a digital queue token
- Track live queue position
- View estimated waiting time
- Receive a turn-approaching notification
- QR-based token/check-in flow
- Live token status: waiting, called, in service, completed, skipped/no-show

### Staff

- Staff-only dashboard
- Assigned-counter workflow
- Open and close counters
- View the live waiting queue
- Call the next student
- Monitor student arrival/check-in
- Start and complete service
- Skip tokens when required
- Automatic no-show handling with a configurable buffer
- Real-time queue updates

### Admin

- Administrative dashboard and queue analytics
- Create and manage staff accounts
- Assign staff to counters
- Create and manage counters
- Configure services and average service times
- Configure which services each counter handles
- Monitor queue and operational activity

---

## How It Works

```text
Student selects service
        ↓
Queueless checks available counters
        ↓
Smart counter recommendation
        ↓
Student generates virtual token
        ↓
Live position + ETA
        ↓
Turn approaches
        ↓
Student receives notification
        ↓
Student arrives at counter
        ↓
QR / staff check-in
        ↓
Service starts
        ↓
Service completed
        ↓
Next token is called
```

If a student does not arrive within the configured buffer after being called, the token can be marked as a **no-show**, preventing the queue from being blocked unnecessarily.

---

## Technical Architecture

```text
                    QUEULESS
                       │
          ┌────────────┼────────────┐
          │            │            │
       Student       Staff        Admin
          │            │            │
          └────────────┼────────────┘
                       ↓
              Next.js + TypeScript
                       ↓
                Supabase Auth
                       ↓
                PostgreSQL DB
                       ↓
          RPC / Edge Functions / RLS
                       ↓
              Supabase Realtime
                       ↓
                    Vercel
```

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + React + TypeScript |
| Styling | Tailwind CSS |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Backend logic | PostgreSQL RPC functions + Supabase Edge Functions |
| Authorization | PostgreSQL Row Level Security (RLS) |
| Realtime | Supabase Realtime |
| Deployment | Vercel |
| Version control | Git + GitHub |

---

## ETA & Queue Intelligence

Queueless does more than generate a token number.

The live ETA can use:

- Number of students ahead
- Current queue state
- Currently called/in-service token
- Historical service times
- Service-specific average processing time
- Counter availability

This allows the platform to provide a more useful estimate than simply displaying a queue position.

For multiple counters serving the same service, the system can recommend the counter with the more favorable expected wait.

---

## Security Model

Queueless separates access by role:

```text
STUDENT
  → Student services and own queue information

STAFF
  → Assigned counter operations

ADMIN
  → Staff, counter, service and operational management
```

Database-level authorization and Row Level Security are used alongside application-level role checks. Privileged administrative operations are handled through protected backend functions rather than exposing sensitive credentials to the browser.

---

## Local Development

### Prerequisites

- Node.js
- npm
- A Supabase project
- Git

### Install

```bash
npm install
```

### Environment Variables

Create `.env.local` and configure the Supabase project values required by the application.

Do **not** commit `.env.local` or any service-role/private credentials to GitHub.

### Run Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

---

## Project Structure

```text
src/
├── app/
│   ├── admin/
│   ├── staff/
│   ├── student/
│   └── ...
├── components/
│   ├── admin/
│   ├── staff/
│   ├── queue/
│   └── ...
└── lib/
    └── supabase/

supabase/
├── migrations/
└── functions/
```

---

## Deployment

Queueless is designed for deployment on **Vercel** with **Supabase** as the backend platform.

Configure the required Supabase environment variables in the Vercel project settings before deploying.

Every push to the production branch can trigger a new Vercel deployment when GitHub integration is enabled.

---

## Current Status

**Queueless is an MVP/prototype for college queue management and Smart India Hackathon development.**

The current implementation includes the core Student, Staff, and Admin workflows, real-time queue updates, ETA calculation, counter management, staff assignment, QR check-in, no-show handling, and production deployment infrastructure.

Further production hardening can include native push notifications, deeper analytics, automated testing, and additional campus integrations.

---

## Vision

The long-term goal is to make waiting for routine campus services predictable instead of physical.

Instead of asking:

> **"How long do I have to stand in this line?"**

Queueless lets a student ask:

> **"When should I actually come to the counter?"**

**Queueless — Join the queue, not the crowd.**
