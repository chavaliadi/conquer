# Conquer — AI-Powered Adaptive Interview Preparation Platform

> Conquer is an advanced, AI-driven mock interview platform designed to simulate real-world technical, behavioral, and architectural interviews. Unlike generic quiz apps, Conquer reads your resume, dynamically adapts its line of questioning based on your answers, rates your performance against production-grade rubrics, and provides long-term progress analytics.

---

## 🎯 What Is Conquer?

Conquer is built to bridge the gap between solving coding exercises (e.g., LeetCode) and passing actual engineering panel interviews. A successful engineer must explain architectural trade-offs, handle follow-ups, and structure their communication. Conquer acts as a tireless, highly competent mock interviewer that replicates this experience.

### The Core Differentiator

| Without Conquer | With Conquer |
| :--- | :--- |
| **Generic Questions**: Same list of questions regardless of background. | **Resume-Aware**: Personalized questions based on your actual projects, technologies, and achievements. |
| **Flat Interactions**: Q&A style with no follow-ups or probing. | **Adaptive Drilling**: Follow-ups like *"Why did you choose PostgreSQL over MongoDB for X? What happens if load increases 10x?"* |
| **Basic Scoring**: Pass/Fail or binary scores without details. | **Detailed Rubric**: Scored on technical depth, specificity, communication, STAR format, and problem-solving. |
| **No Memory**: Every session is isolated. | **Progress Metrics**: Tracks aggregate strengths, weak areas, and average scores over weeks of practice. |
| **Standard UI**: Plain text blocks and basic layouts. | **Interactive Dashboard**: Modern dark-mode UX, streaming chat, elapsed timers, interactive transcripts, and SVGs meters. |

---

## 🛠️ Technology Stack

Conquer is built on a highly optimized, modern React and Next.js full-stack architecture:

*   **Framework**: [Next.js 15.5](https://nextjs.org/) (App Router, React 19) with `--turbopack` dev environment.
*   **Language**: [TypeScript](https://www.typescriptlang.org/) for compile-time type-safety across database queries, APIs, and client state.
*   **Authentication**: [Clerk](https://clerk.com/) (@clerk/nextjs) for robust user onboarding, session tokens, and route protection.
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) using a CSS-first token configuration framework in `globals.css` (no legacy `tailwind.config.js` required).
*   **Component System**: [shadcn/ui](https://ui.shadcn.com/) (New York style layout) for clean, composable UI blocks (button, card, dialog, sheet, avatar, inputs).
*   **Database ORM**: [Drizzle ORM](https://orm.drizzle.team/) for lightning-fast database mapping, edge compliance, and code-based schema management.
*   **Database Engine**: [PostgreSQL](https://www.postgresql.org/) hosted serverless via [Neon](https://neon.tech/).
*   **Inference Provider**: [Groq Cloud](https://console.groq.com/) for low-latency Llama inference.
*   **AI Models**:
    *   **Primary Interviewer & Evaluator**: `llama-3.3-70b-versatile` (excellent multi-turn reasoning and rubric adherence).
    *   **Summarizer & Answer Scorer**: `llama-3.1-8b-instant` (ultra-fast responses for background processing and context summarizing).
*   **Streaming Engine**: [Vercel AI SDK](https://sdk.vercel.ai/docs) (`ai` + `@ai-sdk/react`) powering client-side streaming UI.
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand) for interview workflow states (timer, topic, session details).
*   **Animations**: [Motion](https://motion.dev/) (formerly Framer Motion) for fluid dashboard entry, slide-overs, and scorecard animations.
*   **PDF Parser**: [unpdf](https://github.com/unjs/unpdf) for server-side PDF text extraction.

---

## 🗄️ Database Architecture

The Postgres schema (located in `lib/db/schema.ts`) maps relationships across users, interview sessions, and individual responses.

```
                  ┌────────────────────────┐
                  │         users          │
                  └───────────┬────────────┘
                              │ 1
                              │
                              │ 1:N
                              ▼
                  ┌────────────────────────┐
                  │        sessions        │◄──────────┐
                  └───────────┬────────────┘           │
                              │                        │
                              │ 1:N                    │ 1:N
                              ▼                        │
   ┌────────────────────────┐ ┌────────────────────────┐   ┌────────────────────────┐
   │        progress        │ │        messages        │   │        progress        │
   │ (per user, per topic)  │ │ (chat logs, per-Q/A)  │   │   (aggregate metrics)  │
   └────────────────────────┘ └────────────────────────┘   └────────────────────────┘
```

### Table Definitions

1.  **`users`**: Manages user profiles tied to Clerk.
    *   `id` (text, primary key) — Clerk User ID.
    *   `resumeText` (text) — Plaintext content extracted from the resume PDF.
    *   `resumeFileName` (text) — File name of the uploaded PDF.
    *   `resumeUploadedAt` (timestamp) — Upload date.
2.  **`sessions`**: Tracks each mock interview.
    *   `id` (uuid, primary key).
    *   `userId` (text, foreign key → `users.id`).
    *   `topic` (text) — DSA, System Design, Behavioral, Frontend/Backend, Custom.
    *   `difficulty` (text) — Easy, Medium, Hard.
    *   `status` (text) — `ACTIVE` | `COMPLETED` | `ABANDONED`.
    *   `durationSeconds` (integer) — Duration of the interview.
    *   `overallScore` (double precision) — Consolidated evaluation score.
    *   `report` (jsonb) — Contains details on dimension scores, strengths, gaps, and improvements.
    *   `mode` (text) — `STANDARD` | `QUICK_FIRE` | `DEEP_DIVE` | `WEAKNESS_TRAINER`.
    *   `isResumeAware` (boolean) — Flag indicating if the interview referenced the resume.
3.  **`messages`**: Log of all turns in a session.
    *   `id` (uuid, primary key).
    *   `sessionId` (uuid, foreign key → `sessions.id`).
    *   `role` (text) — `user` | `assistant` | `system`.
    *   `content` (text) — Message text.
    *   `turnNumber` (integer) — Turn index.
    *   `answerScore` (double precision, nullable) — Real-time performance grade for single answers (Phase 6).
    *   `feedback` (text, nullable) — Per-question AI critique.
4.  **`progress`**: Aggregates average stats per track.
    *   `id` (uuid, primary key).
    *   `userId` (text, foreign key → `users.id`).
    *   `topic` (text) — Target category.
    *   `avgScore` (double precision) — Running average score.
    *   `sessionsCount` (integer) — Total finished interviews.
    *   `weakAreas` (jsonb) — Deduplicated gaps collected from session reports (max 10).
    *   `strengths` (jsonb) — Deduplicated strengths (max 10).
    *   `lastPracticed` (timestamp) — Timestamp of the latest session.

---

## 🔄 Project Workflow & Phase Status

Conquer's roadmap is divided into structured delivery phases. We are currently in **Phase 6 (In Planning)**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                              ROADMAP STATUS                            │
├───────────┬───────────────────────────────────────────────────┬────────┤
│ Phase     │ Focus                                             │ Status │
├───────────┼───────────────────────────────────────────────────┼────────┤
│ Phase 0   │ Legacy Tech Stack Modernization & Code Cleanup    │   ✅   │
│ Phase 1   │ Libraries Install, Tailwind v4 CSS, DB Setup      │   ✅   │
│ Phase 2   │ Interview Streaming Engine, Prompts & Evaluator   │   ✅   │
│ Phase 3   │ Multi-Page Dashboard, History Sheets, Progress    │   ✅   │
│ Phase 4   │ Global Dark Mode, Fluid Landing UI & Animations  │   ✅   │
│ Phase 5   │ Resume Upload Workspace & Resume-Aware Drilling   │   ✅   │
│ Phase 6   │ Interview Modes, Per-Question Scores, PDF Export  │  🚧 *  │
│ Phase 7   │ Upstash Rate-limiting, Sentry Monitoring & Zod   │  ⬜    │
│ Phase 8   │ Stripe Monetization & Pro Subscription Tiers      │  ⬜    │
└───────────┴───────────────────────────────────────────────────┴────────┘
* Current Phase: Active planning and initialization.
```

### Completed Phases Detail

*   **Phase 0 — Code Cleanup & Upgrades**: Modernized a Next.js 14 template to **Next.js 15.5** and **React 19**. Replaced ESLint config with a flat structure (`eslint.config.mjs`) and purged legacy packages (Claude API, Anthropic SDK, Axios, react-hook-form) to clear dependencies.
*   **Phase 1 — Stack Setup**: Integrated Drizzle schema, established Neon Serverless Client connection, and configured a client-side Zustand store (`lib/store/interview-store.ts`) for interview runtime tracking.
*   **Phase 2 — Core Engine & API Setup**:
    *   Created dynamic AI system prompts for four core tracks (DSA, System Design, Frontend/Backend, and Behavioral) in `lib/prompts/interviewer.ts`.
    *   Programmed a **Context window summarization sub-routine** using `Llama 3.1 8B`. When chat turns exceed 6, oldest turns are summarized to fit models' prompt limits without losing core context.
    *   Built streaming endpoints (`/api/interview`, `/api/sessions`, and `/api/interview/end`) mapping to Groq.
*   **Phase 3 — Dashboard & Analytics Page**:
    *   `/dashboard`: High-level dashboard displaying total interviews, average overall scores, active session restoration options, and quick launcher cards.
    *   `/history`: Displays historical mock sessions. Click-to-open drawer panel loads full chat history and scorecard tabs dynamically based on URL search query params.
    *   `/progress`: Circular SVG indicators scoring mastery, alongside unified board listing primary strengths and focus zones.
*   **Phase 4 — Dark Mode & Branding**: Standardized dark interface styling, redesigned landing layouts (`/`) with radial glowing backdrops, and customized lucide icons.
*   **Phase 5 — Resume Integration**:
    *   Built resume parser workspace (`/resume`) parsing PDF files via Node-friendly `unpdf` stream extraction.
    *   Configured Resume-Aware toggle prompts that weave personal achievements, work records, and technology stacks directly into mock questions.

---

## ⚡ Getting Started & Local Installation

Follow these steps to clone, configure, and launch the Conquer workspace locally on your system.

### Prerequisites

Make sure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18.18.0 or newer is recommended)
*   [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
*   A running PostgreSQL database instance (or a free Serverless PostgreSQL project on [Neon](https://neon.tech/))
*   A [Clerk](https://clerk.com/) account (to authenticate pages and API requests)
*   A [Groq Console API Key](https://console.groq.com/) (to perform AI model text inference)

### Step 1: Clone the Repository

Clone the project from your Git provider:
```bash
git clone https://github.com/your-username/conquer.git
cd conquer
```

### Step 2: Install Project Dependencies

Install the locked node dependencies from `package.json`:
```bash
npm install
```

### Step 3: Configure Environment Variables

Create a file named `.env` in the root of the project directory. Add and customize the following environment variables:

```env
# ----------------------------------------------------
# Clerk Authentication Configuration
# ----------------------------------------------------
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# ----------------------------------------------------
# Database Configuration
# ----------------------------------------------------
# A PostgreSQL URI (e.g. from Neon serverless Postgres)
DATABASE_URL=postgresql://user:password@hostname/database?sslmode=require

# ----------------------------------------------------
# AI Providers Configuration
# ----------------------------------------------------
# Groq Console API Key (https://console.groq.com)
GROQ_API_KEY=gsk_...
```

### Step 4: Apply Database Schema Migrations

Conquer uses Drizzle ORM to push database schema structures directly onto PostgreSQL:
```bash
npx drizzle-kit push
```
*This command reads the local `lib/db/schema.ts` file, connects to the database specified in `DATABASE_URL`, and creates all required tables and constraints instantly.*

### Step 5: Start the Local Development Server

Run the development command to start the Next.js dev server with Turbopack enabled:
```bash
npm run dev
```

Open your web browser and navigate to:
[http://localhost:3000](http://localhost:3000)

---

## 🛠️ Production Build & Deploy

To generate a optimized production bundle, use the build scripts:

```bash
# Build the production bundle
npm run build

# Start the built application server
npm run start
```

### Deployment Configuration (Vercel)

When deploying to [Vercel](https://vercel.com/):
1.  Import your repository.
2.  Set the Framework Preset to **Next.js**.
3.  Add all of your environment variables (Clerk keys, `DATABASE_URL`, `GROQ_API_KEY`) exactly as defined in your local `.env`.
4.  Deploy! Vercel handles serverless edge functions automatically.

---

## 📁 Repository Directory Structure

An overview of where code is structured inside the workspace:

```
conquer/
├── app/                        # Next.js App Router folders
│   ├── (auth)/                 # Clerk authentication routes (sign-in, sign-up)
│   ├── (dashboard)/            # Dashboard layout and core application paths
│   │   ├── (routes)/
│   │   │   ├── dashboard/      # Main stats dashboard page
│   │   │   ├── history/        # Historical logs and slide-over transcripts
│   │   │   ├── interview/      # Live chat session canvas
│   │   │   ├── progress/       # Mastery statistics page
│   │   │   ├── resume/         # Resume Upload and custom Launcher interface
│   │   │   └── settings/       # Profile configuration & custom system persona
│   │   └── layout.tsx
│   ├── (landing)/              # Client-facing landing hero and feature grid
│   ├── api/                    # Application API handlers
│   │   ├── interview/          # Turn response execution & session scoring
│   │   │   └── end/            # Session final evaluation handler
│   │   ├── resume/upload/      # Resume text extractor and delete actions
│   │   └── sessions/           # Session management & user synchronizer
│   ├── globals.css             # Main stylesheet (Tailwind v4 tokens layout)
│   └── layout.tsx              # Root HTML wrapper
├── components/                 # Global UI controls and widgets
│   ├── interview/              # Start grids, selectors, timers and report cards
│   ├── ui/                     # shadcn shad-css template copies
│   ├── sidebar.tsx             # Main dashboard navigation menu
│   └── navbar.tsx              # Top bar containing Clerk profile avatars
├── lib/                        # Shared custom libraries and utility methods
│   ├── db/
│   │   ├── index.ts            # Neon serverless client export
│   │   └── schema.ts           # Drizzle mapping schemas
│   ├── prompts/
│   │   └── interviewer.ts      # LLM Prompt prompts and evaluation criteria
│   ├── store/
│   │   └── interview-store.ts  # Zustand user-experience states
│   └── utils.ts                # Tailwind layout mergers
├── drizzle.config.ts           # Drizzle Kit migration configuration
├── eslint.config.mjs           # ESLint v9 Flat configuration file
├── package.json                # Project script list and dependency versions
└── tsconfig.json               # TypeScript compiler config
```
