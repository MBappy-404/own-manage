# OwnManage — Premium Personal Finance Management

A full-stack, mobile-first, PWA-ready personal finance app built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Framer Motion**, **Recharts**, **Prisma ORM** and **MongoDB**.

Track income & expenses, get AI-powered insights, compete on the leaderboard, set savings goals, and export beautiful PDF reports — all from a single fintech-grade dashboard.

## ✨ Features

- 🔐 **Secure auth** — Credentials (bcrypt) + Google OAuth via NextAuth.js (JWT sessions)
- 💸 **Income & expense CRUD** — Categories, payment methods, frequencies, notes
- 📊 **Premium dashboard** — Total balance, income, expense, savings, health score
- 🧠 **Smart AI insights** — Rule-based behavioural analyzer (spending spikes, savings rate, budget alerts)
- 🏆 **Leaderboard** — Weekly / monthly / all-time ranking by savings, income, or expense
- 🐷 **Savings goals** — Target tracking with progress visualisation
- 📈 **Charts** — Income vs expense area, category pie, day-of-week bar, 90-day heatmap
- 📄 **PDF reports** — Daily / weekly / monthly / yearly with jsPDF
- 🌗 **Dark / light mode** — system-aware, with smooth transitions
- 📱 **PWA support** — Installable, offline-aware, mobile-app feel
- ⚡ **Production-ready** — Type-safe APIs, Zod validation, indexed Mongo collections

## 🧱 Tech Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Auth | NextAuth.js (Credentials + Google) |
| ORM | Prisma 6 (MongoDB connector) |
| Database | MongoDB |
| PDF | jsPDF + jspdf-autotable |
| PWA | Custom service worker + manifest |

## 🚀 Getting started

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in your MongoDB connection string
cp .env.example .env

# 3. Push the Prisma schema to your MongoDB cluster
npx prisma db push

# 4. Run the dev server
npm run dev
```

Open <http://localhost:3000>.

## 🔧 Environment variables

```env
DATABASE_URL="mongodb+srv://USER:PASS@cluster/db?retryWrites=true&w=majority"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate with: openssl rand -base64 32"

# Optional — enables Google sign-in
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

## 🗂 Project structure

```
src/
├── app/
│   ├── (auth)/                 # Login, register, forgot/reset password
│   ├── (dashboard)/            # Dashboard, income, expenses, insights, leaderboard, savings, reports, settings
│   ├── api/                    # REST routes (auth, register, income, expense, ...)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Landing page
├── components/
│   ├── charts/                 # Recharts wrappers
│   ├── dashboard/              # Stat cards, health score, insights, recent transactions
│   ├── forms/                  # Reusable React-Hook-Form forms
│   ├── layout/                 # Sidebar, top bar, bottom nav
│   ├── ui/                     # shadcn-style primitives
│   └── providers.tsx
├── lib/
│   ├── analytics.ts            # Period math, series, breakdowns, scoring
│   ├── api-helpers.ts          # requireUser / ok / fail
│   ├── auth.ts                 # NextAuth config
│   ├── insights.ts             # Rule-based AI insight engine
│   ├── prisma.ts
│   ├── utils.ts
│   └── validations.ts          # Zod schemas
└── middleware.ts               # Route protection
prisma/
└── schema.prisma               # MongoDB schema (User, Income, Expense, Goals, ...)
public/
├── icons/                      # PWA icons
├── manifest.webmanifest
└── sw.js                       # Service worker
```

## 📜 Scripts

```bash
npm run dev       # start dev server
npm run build     # production build (also runs `prisma generate`)
npm run start     # start production server
npm run lint      # eslint
npm run db:push   # prisma db push
```

## 🧠 AI Insights engine

`src/lib/insights.ts` runs a deterministic, transparent set of rules over each user's data:

- Month-over-month spending & income comparison
- Savings rate evaluation (strong / low / negative)
- Top expense category (over 30% share)
- Food spending spike vs last week
- Heaviest spending day of the week
- Outlier spend days
- Budget alerts (50% / 80% / over budget)
- Healthy balance summary
- Dangerous expense ratio warning

This is intentionally rule-based so it works offline and produces explainable insights. Swap with an LLM provider easily if desired.

## 📲 PWA

The app ships with `manifest.webmanifest` and a custom `sw.js`. In production, the service worker is registered automatically (`PWARegister`) and Chrome / Safari will offer to install OwnManage as an app on mobile and desktop.

## ☁️ Deploy

Optimised for Vercel — just push to GitHub, import the repo, set the env vars above, and deploy.

```bash
npx vercel
```

---

Built with ❤️ for people who want to manage money like a fintech pro.
