# Conquer — Project Blueprint

> AI-Powered Adaptive Interview Preparation Platform  
> By Adithya Chavali • 2025–2026

---

## 🎯 What Is Conquer?

Conquer is an AI-powered interview preparation platform that **simulates real technical interviews** — not just quizzes. It reads your resume, asks adaptive follow-up questions, scores your answers on structured rubrics, and tracks your improvement over time.

### The Core Differentiator

Most interview prep tools give you generic questions and a simple right/wrong score. Conquer goes deeper:

| Without Conquer | With Conquer |
|---|---|
| Generic questions with no follow-up | Adaptive follow-up drilling: "Why X over Y? What breaks at scale?" |
| Same questions regardless of your background | Resume-aware questions: "You built QR attendance — how would you scale it?" |
| Score with no explanation | Structured rubric: depth, specificity, STAR format, communication |
| No memory of previous sessions | Tracks improvement over time across weeks |
| Feels like a quiz app | Feels like a real technical interviewer |

### Resume Story — Why This Project Matters

This project creates a narrative arc on your resume that recruiters remember:

1. **ai-resume-analyzer** → You built a resume analysis platform
2. **Conquer** → You extended it into a resume-aware adaptive interview engine with follow-up reasoning and progress tracking

That is a progression, not a collection of random projects. Two connected tools showing systems thinking.

---

## 🔧 Tech Stack (Locked)

| Layer | Technology | Version | Why |
|---|---|---|---|
| Framework | Next.js | 15 (latest) | Turbopack, React 19, App Router mature |
| Language | TypeScript | 5.x | Type safety, shared types across codebase |
| Auth | Clerk | 7.x (@clerk/nextjs) | 10,000 free MAUs, plug-and-play App Router integration |
| Styling | Tailwind CSS | 4 (upgrade in V1) | CSS-first config, no tailwind.config.js needed |
| Components | shadcn/ui | Latest (new-york) | Copy-paste ownership model, updated for Tailwind v4 + React 19 |
| ORM | Drizzle ORM | drizzle-orm latest | No codegen, schema changes reflect instantly with Turbopack, edge-native |
| Database | PostgreSQL via Neon | Neon serverless | Serverless Postgres with free tier, works seamlessly with Drizzle |
| AI Provider | Groq | groq-sdk latest | Fastest inference available, free tier sufficient for dev and demos |
| AI Model (Primary) | Llama 3.3 70B | llama-3.3-70b-versatile | Best free model for multi-turn reasoning and instruction following |
| AI Model (Fast) | Llama 3.1 8B | llama-3.1-8b-instant | Used for low-stakes decisions (follow-up vs new topic), fast and sufficient |
| Streaming / Chat | Vercel AI SDK | ai latest | `useChat` hook handles streaming natively in Next.js App Router |
| State Management | Zustand | zustand latest | Interview session state — current turn, timer, messages, no boilerplate |
| Animations | Motion | v12 (ex-Framer Motion) | Interview UI transitions, score reveal, lightweight |
| PDF Parsing | pdf-parse | pdf-parse latest | Resume PDF → plain text extraction (V2 resume-aware mode) |
| Deployment | Vercel | — | Already configured, Drizzle + Neon + Next.js 15 is the optimal Vercel stack |

### Environment Variables Needed

```env
# Auth (already configured)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# AI (need to add)
GROQ_API_KEY=...                       # From console.groq.com

# Database (need to add)
DATABASE_URL=...                       # From Neon dashboard
```

---

## ✅ What We've Done So Far (Phase 0: Cleanup + Upgrade)

### Files Deleted
- `app/api/conversation/route.ts` — Old Anthropic Claude API
- `app/(dashboard)/(routes)/conversation/` — Old conversation page + constants
- `components/bot-avatar.tsx`, `components/bio.tsx`, `components/empty.tsx`, `components/loader.tsx` — Unused components
- `components/ui/form.tsx` — Depended on removed react-hook-form
- `public/empty.png`, `public/next.svg`, `public/vercel.svg` — Unused assets
- `.eslintrc.json` — Replaced by ESLint 9 flat config

### Packages Removed
`@anthropic-ai/sdk`, `anthropic-ai`, `claude-api`, `openai`, `axios`, `react-hook-form`, `@hookform/resolvers`, `zod`, `tailwindcss-animate`

### Packages Upgraded
| Package | From → To |
|---|---|
| Next.js | 14.2.3 → **15.5.19** |
| React | 18.x → **19.2.7** |
| Clerk | 5.1.3 → **7.4.2** |
| ESLint | 8.x → **9.28.0** |
| Radix UI (all) | 1.0.x → **latest** |
| lucide-react | 0.383.0 → **1.17.0** |

### Code Changes
- Renamed project from `ai-saas` → `conquer`
- Updated all branding from "Genius" → "Conquer"
- Fixed Clerk v7 breaking changes (UserButton props, middleware matcher)
- Created ESLint 9 flat config (`eslint.config.mjs`)
- Removed `tailwindcss-animate` plugin reference from Tailwind config
- Added `--turbopack` flag to dev script
- **Build: ✅ Compiles successfully with zero errors**

---

## 🚀 V1 — Core Interview Engine

> **Goal**: A working AI interview simulator that streams adaptive questions and tracks sessions.

### V1 Features

#### 1. Interview Engine (Core)
- Real-time streaming chat interface using Vercel AI SDK's `useChat`
- Groq-powered (Llama 3.3 70B) adaptive interviewer
- System prompt engineering for different interview types
- Adaptive follow-up questions that dig deeper based on answers
- Structured scoring rubric (depth, specificity, STAR format, communication)

#### 2. Interview Topics
- **Data Structures & Algorithms** — classic CS interview questions
- **System Design** — architecture and scaling discussions
- **Behavioral** — STAR format, leadership, teamwork
- **Frontend/Backend** — framework-specific technical questions
- **Custom Topic** — user-defined interview focus

#### 3. Dashboard
- Start new interview session (topic + difficulty selector)
- Recent sessions list with scores
- Quick stats: sessions completed, average score, streak
- Progress overview cards

#### 4. Session Management
- Interview timer (configurable: 15/30/45/60 min)
- Difficulty levels: Easy, Medium, Hard
- Session persistence to database (Drizzle + Neon)
- Post-interview score breakdown

#### 5. Session History
- List of all past interview sessions
- Filter by topic, date, score
- Click to review full Q&A transcript
- Score comparison across sessions

#### 6. Progress Tracking
- Visual progress charts (improvement over time)
- Topic-wise breakdown (where you're strong/weak)
- Strengths & weaknesses analysis
- Session count and consistency tracking

#### 7. Database Schema (Drizzle + Neon)
```
Tables:
├── users          → Clerk user ID, name, email
├── sessions       → Interview metadata (topic, difficulty, status, score, duration)
├── messages       → Individual Q&A messages within a session
└── progress       → Aggregated progress tracking per topic
```

#### 8. State Management (Zustand)
```
Stores:
├── interview-store → Current session state, timer, active topic
└── (messages handled by useChat from Vercel AI SDK)
```

#### 9. UI/UX Design
- Dark mode primary with glassmorphism effects
- Premium feel with Motion animations
- Color palette: Deep navy/slate backgrounds, electric blue/violet accents
- Typography: Inter (body) + Outfit (headings)
- Smooth streaming text animation
- Score reveal animations
- Topic selection cards with hover effects

### V1 File Structure
```
app/
├── (auth)/(routes)/sign-in, sign-up
├── (dashboard)/
│   ├── layout.tsx                    → Dashboard shell
│   └── (routes)/
│       ├── dashboard/page.tsx        → Main dashboard
│       ├── interview/page.tsx        → Active interview session
│       ├── history/page.tsx          → Past sessions
│       └── progress/page.tsx         → Progress tracking
├── (landing)/page.tsx                → Landing page
├── api/
│   ├── interview/route.ts            → Groq streaming interview API
│   └── sessions/route.ts             → Session CRUD API
├── layout.tsx
└── globals.css

components/
├── ui/                               → shadcn/ui (new-york style)
├── interview/
│   ├── chat-interface.tsx            → Main interview chat
│   ├── topic-selector.tsx            → Topic selection cards
│   ├── difficulty-badge.tsx          → Easy/Medium/Hard selector
│   ├── score-card.tsx                → Post-interview scores
│   └── timer.tsx                     → Session timer
├── dashboard/
│   ├── stats-card.tsx                → Dashboard metrics
│   ├── recent-sessions.tsx           → Recent session list
│   └── progress-chart.tsx            → Progress visualization
├── sidebar.tsx
├── navbar.tsx
└── ...

lib/
├── db/
│   ├── schema.ts                     → Drizzle schema
│   └── index.ts                      → Neon DB connection
├── store/
│   └── interview-store.ts            → Zustand store
├── prompts/
│   └── interviewer.ts                → AI system prompts + rubrics
└── utils.ts
```

### V1 Packages to Install
```bash
npm install groq-sdk ai                          # AI: Groq + Vercel AI SDK
npm install drizzle-orm @neondatabase/serverless  # DB: Drizzle + Neon
npm install -D drizzle-kit                        # DB: Migrations CLI
npm install zustand                               # State management
npm install motion                                # Animations (v12)
```

---

## 🔮 V2 — Resume-Aware + Advanced Features

> **Goal**: Make interviews personalized to the user's resume and add depth to tracking.

### V2 Features

#### 1. Resume Upload & Parsing
- PDF upload via drag-and-drop UI
- `pdf-parse` extracts text from resume
- Parsed resume stored in user profile (database)
- Resume text injected into AI system prompt for context

#### 2. Resume-Aware Interviews
- AI reads your resume before asking questions
- Questions tailored to YOUR experience: "You listed React at your internship — explain the virtual DOM reconciliation algorithm"
- Follow-ups reference your specific projects: "Your QR attendance system — how would you handle 10,000 concurrent scans?"
- Detects skill gaps from resume and probes those areas

#### 3. Interview Modes
- **Mock Interview** — Full 30-60 min simulation with scoring
- **Quick Fire** — 5-minute rapid question round
- **Deep Dive** — Single topic, unlimited depth
- **Weakness Trainer** — Focuses on your historically weak areas

#### 4. Enhanced Scoring
- Per-question scoring (not just session-level)
- Detailed feedback per answer: "Your answer lacked specificity. Instead of 'I used a database', say 'I used PostgreSQL with a B-tree index on the user_id column'"
- Comparison with ideal answers
- Score trends with sparkline charts

#### 5. AI-Generated Study Plans
- Based on interview performance, generate a personalized study plan
- "You scored 4/10 on System Design — here's a 2-week plan"
- Links to resources (articles, videos, practice problems)
- Weekly check-in interviews to measure progress

#### 6. Interview Reports
- Exportable PDF/markdown interview reports
- Shareable session links
- Performance summary emails (weekly digest)

#### 7. Multi-Model Strategy
- **Llama 3.3 70B** — Primary interviewer (main turns)
- **Llama 3.1 8B** — Quick decisions (should we follow up or move on?)
- Potential: Add specialized models for code evaluation

#### 8. Social Features (Stretch)
- Leaderboard (opt-in)
- Share progress cards
- Interview challenges with friends

### V2 Packages to Add
```bash
npm install pdf-parse                  # Resume PDF parsing
npm install @types/pdf-parse -D        # TypeScript types
```

---

## 📋 Execution Roadmap

```
Phase 0 ✅  Cleanup + Upgrade (DONE)
            ├── Deleted unused files & packages
            ├── Upgraded Next.js 14→15, React 18→19, Clerk 5→7
            └── Build verified ✅

Phase 1     Tech Stack Setup
            ├── Install Groq, Vercel AI SDK, Drizzle, Zustand, Motion
            ├── Upgrade Tailwind v3→v4
            ├── Reinitialize shadcn/ui (new-york style)
            └── Set up Neon database + Drizzle schema

Phase 2     Interview Engine (V1 Core)
            ├── Build interview API with Groq streaming
            ├── Build chat UI with useChat
            ├── System prompt engineering
            └── Session persistence

Phase 3     Dashboard + History + Progress (V1)
            ├── Redesign dashboard
            ├── Build session history page
            ├── Build progress tracking
            └── Update sidebar navigation

Phase 4     UI Polish (V1)
            ├── Dark mode design system
            ├── Motion animations
            ├── Landing page redesign
            └── Responsive design pass

Phase 5     Resume Integration (V2)
            ├── PDF upload + parsing
            ├── Resume-aware prompts
            ├── Enhanced scoring
            └── Study plan generation

Phase 6     Advanced Features (V2)
            ├── Interview modes (Quick Fire, Deep Dive, etc.)
            ├── Interview reports
            ├── Multi-model strategy
            └── Social features
```

---

## 🔑 Keys & Accounts Needed

| Service | URL | What You Need |
|---|---|---|
| Clerk | clerk.com | ✅ Already configured |
| Groq | console.groq.com | Free API key (14,400 req/day) |
| Neon | neon.tech | Free Postgres database URL |
| Vercel | vercel.com | ✅ Already configured |

---

*Last updated: June 2, 2026*
