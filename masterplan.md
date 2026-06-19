# Conquer — Complete Master Plan

> AI-Powered Adaptive Interview Preparation Platform  
> By Adithya Chavali • 2025–2026  
> **Living Document** — Updated after every phase

---

## 🎯 What Is Conquer?

Conquer is an AI-powered interview preparation platform that **simulates real technical interviews** — not just quizzes. It reads your resume, asks adaptive follow-up questions, scores your answers on structured rubrics, and tracks your improvement over time.

### The Core Differentiator

| Without Conquer | With Conquer |
|---|---|
| Generic questions with no follow-up | Adaptive follow-up drilling: "Why X over Y? What breaks at scale?" |
| Same questions regardless of your background | Resume-aware questions: "You built QR attendance — how would you scale it?" |
| Score with no explanation | Structured rubric: depth, specificity, STAR format, communication |
| No memory of previous sessions | Tracks improvement over time across weeks |
| Feels like a quiz app | Feels like a real technical interviewer |

---

## 🔧 Tech Stack (Locked)

| Layer | Technology | Version | Why |
|---|---|---|---|
| Framework | Next.js | 15.5.x (App Router) | Turbopack, React 19, mature routing |
| Language | TypeScript | 5.x | Type safety across full stack |
| Auth | Clerk | 7.4.x (@clerk/nextjs) | 10,000 free MAUs, plug-and-play App Router |
| Styling | Tailwind CSS | 4.x | CSS-first config, no tailwind.config.js |
| Components | shadcn/ui | Latest (new-york) | Copy-paste, Tailwind v4 + React 19 compatible |
| ORM | Drizzle ORM | 0.45.x | No codegen, instant schema changes, edge-native |
| Database | PostgreSQL via Neon | Serverless | Free tier, works seamlessly with Drizzle |
| AI Provider | Groq | groq-sdk 1.x | Fastest inference, free tier |
| AI Model (Primary) | Llama 3.3 70B | llama-3.3-70b-versatile | Best free model for multi-turn reasoning |
| AI Model (Fast) | Llama 3.1 8B | llama-3.1-8b-instant | Context summarization, quick decisions |
| Streaming / Chat | Vercel AI SDK | ai 6.x + @ai-sdk/react | `useChat` handles streaming in App Router |
| State Management | Zustand | 5.x | Interview session state, minimal boilerplate |
| Animations | Motion | v12 (ex-Framer Motion) | Interview UI transitions, score reveal |
| PDF Parsing | pdf-parse | Latest | Resume PDF → plain text extraction |
| Deployment | Vercel | — | Drizzle + Neon + Next.js 15 optimal stack |

### Environment Variables

```env
# Auth (configured)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# AI
GROQ_API_KEY=...        # console.groq.com — 14,400 req/day free

# Database
DATABASE_URL=...        # Neon dashboard — serverless PostgreSQL
```

---

## 🗄️ Database Schema (Current State)

```
Tables:
├── users          → Clerk user ID, name, email, resumeText, resumeFileName, resumeUploadedAt
├── sessions       → Interview metadata (topic, difficulty, status, score, duration, report JSONB)
├── messages       → Individual Q&A messages within a session (role, content, turnNumber)
└── progress       → Aggregated progress tracking per topic (avgScore, sessionsCount, strengths[], weakAreas[])
```

**Key schema design decisions:**
- `sessions.report` is a `jsonb` column storing the full Groq evaluation output: `{ overallScore, dimensionScores, strengths, gaps, suggestions, topicsNotCovered }`
- `messages.answerScore` and `messages.feedback` are reserved nullable columns for per-question scoring (V2 feature)
- `progress` table is append-updated on every `POST /api/interview/end` call — scores are averaged, strengths/weaknesses merged and deduplicated (max 10 each)

---

## ✅ COMPLETED PHASES

### Phase 0 — Cleanup + Upgrade ✅
**Goal:** Take the legacy "ai-saas" (Genius) Next.js 14 starter and modernize it to be Conquer.

**Files Deleted:**
- `app/api/conversation/route.ts` — Old Anthropic Claude API
- `app/(dashboard)/(routes)/conversation/` — Old conversation page + constants
- `components/bot-avatar.tsx`, `components/bio.tsx`, `components/empty.tsx`, `components/loader.tsx`
- `components/ui/form.tsx` — depended on removed react-hook-form
- `public/empty.png`, `public/next.svg`, `public/vercel.svg`
- `.eslintrc.json` — replaced by ESLint 9 flat config

**Packages Removed:**
`@anthropic-ai/sdk`, `anthropic-ai`, `claude-api`, `openai`, `axios`, `react-hook-form`, `@hookform/resolvers`, `zod`, `tailwindcss-animate`

**Packages Upgraded:**

| Package | From → To |
|---|---|
| Next.js | 14.2.3 → **15.5.19** |
| React | 18.x → **19.2.7** |
| Clerk | 5.1.3 → **7.4.2** |
| ESLint | 8.x → **9.28.0** |
| lucide-react | 0.383.0 → **1.17.0** |

**Code Changes:**
- Renamed project `ai-saas` → `conquer` in `package.json`
- Updated all branding from "Genius" → "Conquer"
- Fixed Clerk v7 breaking changes (UserButton props, middleware matcher)
- Created ESLint 9 flat config (`eslint.config.mjs`)
- Added `--turbopack` flag to dev script
- **Build: ✅ Compiles successfully with zero errors**

---

### Phase 1 — Tech Stack Setup ✅
**Goal:** Install and configure the full production tech stack.

**What Was Done:**
- Installed: `groq-sdk`, `ai`, `@ai-sdk/react`, `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`, `zustand`, `motion`
- Upgraded Tailwind to v4 — migrated from `tailwind.config.js` to CSS-first `@theme {}` tokens in `globals.css`
- Reinitialised shadcn/ui (new-york style) — installed `button`, `card`, `input`, `label`, `avatar`, `sheet`
- Created `lib/db/index.ts` — Neon serverless connection + Drizzle ORM instance
- Created `lib/db/schema.ts` — full Drizzle schema for `users`, `sessions`, `messages`, `progress`
- Applied schema to Neon via `drizzle-kit push`
- Created `lib/store/interview-store.ts` — Zustand store for: `activeSessionId`, `topic`, `difficulty`, `status`, `durationSeconds`, `timerActive`, `turnCount`
- Created `lib/prompts/interviewer.ts` — engineering system prompts for all 4 tracks + EVALUATION_PROMPT rubric JSON schema
- Configured Clerk middleware with public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`
- **Build: ✅**

---

### Phase 2 — Interview Engine (V1 Core) ✅
**Goal:** A working AI interview simulator that streams adaptive questions and tracks sessions.

**APIs Built:**

| Route | Method | Purpose |
|---|---|---|
| `/api/sessions` | POST | Create session, sync user to DB, generate first Groq greeting |
| `/api/sessions` | GET | List all user sessions (optionally filter by sessionId) |
| `/api/interview` | POST | Stream Groq response for current turn, save messages to DB |
| `/api/interview` | GET | Load message history for a session |
| `/api/interview/end` | POST | Close session, run full Groq evaluation, update progress table |

**Key Technical Details:**
- **Context Window Management**: When conversation exceeds 6 turns, older messages are summarized using Llama 3.1 8B (non-streaming, fast). Only the last 4 turns + summary are sent to the primary 70B model. This prevents context overflow and reduces token costs.
- **Streaming**: Uses raw `ReadableStream` with `TextEncoder` to stream plain text from Groq. The client uses `TextStreamChatTransport` + `useChat` from Vercel AI SDK.
- **Evaluation**: `EVALUATION_PROMPT` forces JSON output with `response_format: { type: "json_object" }`. Six scored dimensions: `technicalDepth`, `specificity`, `problemSolving`, `communication`, `starFormat`, `followUpHandling`.
- **Progress Aggregation**: On session completion, the `progress` table is upserted — if a row exists for that topic, the average score is recalculated and strengths/gaps are merged (deduped, max 10 per list).

**UI Built:**
- `components/interview/topic-selector.tsx` — 4-topic grid with hover animations + difficulty selector (Easy/Medium/Hard) + Start button
- `app/(dashboard)/(routes)/interview/page.tsx` — Full chat workspace:
  - Session restoration from Zustand store or `/api/sessions` on page load
  - Streaming messages with typing indicator
  - Elapsed timer (counting up, displayed as MM:SS)
  - "End & Evaluate" button triggers `/api/interview/end`
  - Loading overlay during evaluation
  - **Scorecard screen**: overall score, dimension bars, strengths, gaps, suggestions, uncovered topics

**System Prompts (per track):**
- **DS & Algorithms**: Asks about approach + Big O before code, drills edge cases
- **System Design**: Functional/non-functional reqs, API design, storage, caching, scaling, resiliency
- **Behavioral**: STAR format, leadership principles, drills for specifics ("What was YOUR contribution?")
- **Frontend/Backend**: Framework-specific, performance optimization, production debugging
- **Default/Custom**: Flexible topic block for user-defined interview focus

---

### Phase 3 — Dashboard + History + Progress ✅
**Goal:** Complete the three-page V1 dashboard experience.

**APIs Added:**
- `/api/progress` GET — returns all `progress` rows for the current user, ordered by `lastPracticed DESC`
- `/api/sessions?sessionId=X` GET — returns a single session record (for history sheet review)

**Pages Built:**

**Dashboard** (`/dashboard`):
- Fetches all user sessions on load
- **Stats Cards**: Total Mock Interviews (completed only), Overall Score Average (weighted), Tracks Practiced (unique topics)
- **Recent Activity**: Last 3 sessions with Resume/Review actions — active sessions show a yellow "Resume" button; completed show score + "Review Scorecard" link
- Layout: 2-column grid (topic selector left, recent activity right)

**Session History** (`/history`):
- Full session list with filters for Track and Difficulty
- Grid of session cards showing: topic, difficulty badge, date, score/status, duration, turn count
- Click any completed session → **slide-in drawer panel** with:
  - Score summary banner with overall score
  - Two tabs: **Detailed Scorecard** (dimension bars, strengths, gaps, suggestions, uncovered topics) and **Chat Transcript** (full message history, color-coded user/AI bubbles)
  - URL state preserved (`/history?sessionId=X`) so panel survives page refresh
  - Close button + backdrop click to dismiss
- Wrapped in `React.Suspense` (required by `useSearchParams` in Next.js static rendering)

**Progress** (`/progress`):
- Fetches `/api/progress` data
- **SVG Circular Ring Meters** per topic — color-coded: emerald (≥8), indigo (≥6), rose (<6)
- Session count + last practiced date per category
- **Aggregated Strengths Board** — cross-topic deduplicated strengths (up to 6)
- **Aggregated Gap Areas Board** — cross-topic deduplicated weak areas (up to 6)
- Empty state with CTA to start first session
- V2 "Study Plans" teaser banner

---

### Phase 4 — UI Polish ✅
**Goal:** Lock in the premium dark developer aesthetic.

**What Was Done:**
- `app/layout.tsx` — `className="dark"` set on `<html>` tag to force dark mode globally
- `components/sidebar.tsx` — Added History (violet) and Progress (pink) navigation links
- Landing Page (`/`) — Complete redesign:
  - Radial gradient background glows (indigo + purple)
  - Animated hero section with stagger variants (`motion.div`)
  - Badge, headline, description, dual CTA buttons
  - 3-column feature grid: Adaptive AI Drilling, STAR & Depth Rubrics, Progress Analytics
  - Footer with copyright + links

---

### Phase 5 — Resume Integration (V2) ✅
**Goal:** Make interviews personalized to the user's actual resume.

**Packages Added:**
- `pdf-parse` — server-side PDF text extraction
- `@types/pdf-parse` — TypeScript type definitions

**Schema Changes (applied to Neon):**
```ts
// Added to users table:
resumeText: text("resume_text"),
resumeFileName: text("resume_file_name"),
resumeUploadedAt: timestamp("resume_uploaded_at"),
```

**API Built** (`/api/resume/upload`):
- `POST` — accepts `multipart/form-data` with a `resume` field (PDF), validates type + 5MB limit, extracts text via `pdf-parse` (dynamic import, Node.js runtime), upserts to `users` table
- `DELETE` — nulls out `resumeText`, `resumeFileName`, `resumeUploadedAt` for current user
- `GET` — returns `{ hasResume, fileName, uploadedAt }`
- `export const runtime = "nodejs"` required because `pdf-parse` uses native Node.js `fs` APIs incompatible with Edge runtime

**Prompt Engineering Changes (`lib/prompts/interviewer.ts`):**
- `SystemPromptConfig` now accepts optional `resumeText?: string`
- When `resumeText` is present, a confidential block is injected:
  - References candidate's listed projects directly
  - Probes their actual tech stack choices
  - Identifies potential gaps from surface-level claims
  - Anchors behavioral STAR stories to listed companies/teams
  - AI is explicitly told NOT to reveal it's reading the resume
  - Resume text is trimmed to 6,000 characters to stay within token budget

**API Updates:**
- `POST /api/sessions` — fetches `userRecord.resumeText` before calling Groq for the opening question
- `POST /api/interview` — fetches `userRecord.resumeText` before each streaming turn
- Both pass `resumeText` to `getInterviewerPrompt()`

**UI Built:**

**Settings Page** (`/settings`):
- Drag-and-drop PDF upload zone with 4 states: `idle`, `dragging`, `uploading`, `error`
- `AnimatePresence` transitions between states
- Success state shows: Active Resume card with filename, upload date, green "Active" badge, "Resume-Aware Mode Active" indicator, Replace + Remove buttons
- Validates PDF type and 5MB size on client before uploading
- Hidden `<input type="file" />` triggered programmatically

**Topic Selector Updated:**
- Fetches `/api/resume/upload` (GET) on mount with silent fail
- If `hasResume`: shows green `ShieldCheck` banner — "Resume-Aware Mode Active"
- If no resume: shows dashed border nudge with link to `/settings`

---

## 🚧 PHASE 6 — Advanced Features (IN PLANNING)

> **Goal**: Add interview modes, exportable reports, smarter multi-model strategy, and social/sharing features.

### 6.1 — Interview Modes

Currently there is only one mode: a standard open-ended interview with a timer. Phase 6 adds 3 more:

#### Quick Fire Mode (5-min rapid round)
- Separate session type: `mode: "QUICK_FIRE"` added to `sessions` schema
- Time limit: 5 minutes hard cutoff (Zustand timer counts down instead of up)
- AI behavior: rapid-fire questions, one question per turn, no deep follow-ups, covers 8–10 distinct concepts
- UI: Countdown timer displayed prominently, "Beat the clock" visual language
- On timeout: auto-calls `/api/interview/end` to generate a quick scorecard

#### Deep Dive Mode (Single topic, unlimited depth)
- Pre-selected sub-topic within a track (e.g., "Indexes & Query Optimization" within System Design)
- AI behavior: starts with one problem and drills progressively deeper — 3–5 levels of follow-up per concept
- No time pressure — session ends when user ends it
- Useful for targeted weakness training

#### Weakness Trainer Mode
- Pre-selects the topic where the user's `avgScore` is lowest (from `progress` table)
- AI is given the user's aggregated `weakAreas` list from `progress` and instructed to probe those areas specifically
- Requires at least 1 completed session to unlock

#### Schema Changes for Modes
```ts
// Add to sessions table:
mode: text("mode").default("STANDARD").notNull(), // "STANDARD" | "QUICK_FIRE" | "DEEP_DIVE" | "WEAKNESS_TRAINER"
subTopic: text("sub_topic"),                       // Used by DEEP_DIVE mode
```

#### UI Changes
- Update `topic-selector.tsx` to include a "Step 3: Choose Mode" section with 4 mode cards
- Quick Fire: clock icon, red/orange theme
- Deep Dive: layers icon, purple theme
- Weakness Trainer: target icon, rose theme — shows locked state if no sessions exist

---

### 6.2 — Per-Question Scoring (Enhanced Evaluation)

Currently scoring is session-level only (one score at the end). Phase 6 adds **per-question granularity**.

**How it works:**
- After each AI follow-up completes streaming, trigger a non-blocking background call to Groq (Llama 3.1 8B, fast) to score the candidate's last answer
- Score stored in `messages.answerScore` and `messages.feedback` (both columns already exist in schema as nullable)
- In the interview UI: after each user answer, show a subtle score badge once it loads (small pill in message corner)

**In Review (History Page):**
- Transcript tab shows per-message score pills
- Color: emerald (≥8), indigo (≥6), rose (<6)
- Hover on score pill shows the AI feedback for that specific answer

**Prompt for per-question scoring (Llama 3.1 8B, non-streaming):**
```
You are scoring a technical interview answer. Given the interviewer question and candidate response,
rate the answer from 0-10 on specificity and technical depth only.
Return JSON: { "score": 7.5, "feedback": "Good use of Redis example but missed TTL consideration." }
```

---

### 6.3 — Interview Reports

**Exportable PDF Reports:**
- On the History page scorecard drawer, add an "Export Report" button
- Generates a formatted HTML document client-side and triggers browser print/PDF save
- Report includes: session header, overall score, dimension bars, strengths, gaps, suggestions, full transcript
- Use `window.print()` with a dedicated print CSS class (no extra library needed)

**Shareable Session Links:**
- Add a `isPublic: boolean` column to `sessions` schema
- Add `PATCH /api/sessions/:id` endpoint to toggle public visibility
- Public sessions accessible at `/session/[id]` — a read-only version of the scorecard/transcript view (no auth required)
- "Copy Link" button copies `conquer.app/session/[id]` to clipboard

**Weekly Digest Emails (Stretch):**
- Use Resend (free tier: 100 emails/day) or SendGrid
- Cron job (Vercel Cron or GitHub Actions) runs weekly
- Queries users who have had activity in the past 7 days
- Sends email: sessions completed this week, avg score, top strength, top gap, CTA to practice

---

### 6.4 — Multi-Model Strategy (Optimization)

Currently:
- **Llama 3.3 70B** → all interview turns + session creation + evaluation
- **Llama 3.1 8B** → context summarization only

Phase 6 expands this:

| Task | Model | Reason |
|---|---|---|
| Primary interviewer turns | Llama 3.3 70B | Best reasoning, instruction following |
| Opening greeting / first question | Llama 3.3 70B | Sets tone, important first impression |
| Context window summarization | Llama 3.1 8B | Fast, cheap, summary quality sufficient |
| Per-question score + feedback | Llama 3.1 8B | Speed matters here, small task |
| Full session evaluation | Llama 3.3 70B | Complex rubric, needs best model |
| Quick Fire mode questioning | Llama 3.1 8B | Speed prioritized over depth |

**Implementation:** Already architected — just route per-question scoring calls to 8B in the new `/api/interview/score` endpoint.

---

### 6.5 — Social Features (Stretch)

#### Opt-In Leaderboard
- Weekly leaderboard showing top scores per track (opt-in only via settings toggle)
- Add `isPublicProfile: boolean` to `users` schema
- `/leaderboard` page showing top 20 users per topic this week
- Aggregated from `sessions` table where `status = COMPLETED` and session created in past 7 days

#### Progress Cards (Shareable)
- Generate a shareable OG-image-style progress card: "I scored 8.7/10 on System Design at Conquer"
- Use Vercel's `@vercel/og` (Edge function) to generate PNG at `/api/og/[sessionId]`
- Auto-generated `<meta og:image>` on public session pages

#### Interview Challenges
- Two users can be linked to the same "challenge" session (same topic + difficulty)
- Each completes their interview independently
- Scores are revealed simultaneously on a comparison screen
- Requires invite flow: generate a `/challenge/[code]` invite link

---

## 🔭 PHASE 7 — Deployment, Monitoring & Production Hardening

> **Goal**: Make Conquer production-ready for real users at scale.

### 7.1 — Vercel Deployment Setup
- Configure `vercel.json` with correct build settings
- Set all environment variables in Vercel dashboard (Clerk, Groq, Neon)
- Enable Vercel Analytics (`@vercel/analytics`) for page-level traffic monitoring
- Enable Vercel Speed Insights for Core Web Vitals tracking

### 7.2 — Error Monitoring
- Integrate Sentry (free tier): `@sentry/nextjs`
- Capture uncaught exceptions in API routes and client-side React errors
- Set up Sentry source maps for production builds
- Alert on error rate spikes

### 7.3 — Rate Limiting
- Groq free tier: 14,400 requests/day — need to guard against abuse
- Implement rate limiting on `/api/interview` (POST) using Upstash Redis + `@upstash/ratelimit`
- Limit: 30 requests/user/hour for interview turns
- Return `429 Too Many Requests` with a helpful message

### 7.4 — Input Validation
- Add `zod` back (removed in Phase 0) specifically for API route input validation
- Validate: session creation body, interview turn body, resume upload form
- Return structured `400` errors with field-level messages

### 7.5 — Loading & Error UX Polish
- Add `loading.tsx` files to each dashboard route for proper Next.js streaming loading states
- Add `error.tsx` files to each route for graceful error boundaries
- Add global `not-found.tsx` for 404 pages

---

## 🔭 PHASE 8 — Monetization & Growth

> **Goal**: Add a sustainable freemium business model.

### 8.1 — Free vs Pro Tiers

| Feature | Free | Pro ($9/mo) |
|---|---|---|
| Mock interviews per month | 5 | Unlimited |
| Resume-aware interviews | ❌ | ✅ |
| Deep Dive & Weakness Trainer modes | ❌ | ✅ |
| Per-question scoring | ❌ | ✅ |
| Exportable PDF reports | ❌ | ✅ |
| Shareable session links | ❌ | ✅ |
| Progress history (weeks) | 2 weeks | Unlimited |
| AI study plan generation | ❌ | ✅ |

### 8.2 — Stripe Integration
- Add `stripe` package + webhook handler at `/api/webhooks/stripe`
- Add `plan` column to `users` table: `"FREE" | "PRO"`
- Billing portal via Stripe Customer Portal
- Clerk + Stripe sync: on successful payment, update `users.plan` via webhook

### 8.3 — Usage Tracking
- Add `sessionsThisMonth` counter to `users` table
- Reset monthly via Vercel Cron (1st of each month)
- Gate free users at 5 sessions with an upgrade prompt modal

---

## 📋 Execution Roadmap (Full Picture)

```
Phase 0  ✅  Cleanup + Upgrade
Phase 1  ✅  Tech Stack Setup
Phase 2  ✅  Interview Engine (Groq streaming, DB, evaluation)
Phase 3  ✅  Dashboard + History + Progress pages
Phase 4  ✅  UI Polish (dark mode, landing page, sidebar)
Phase 5  ✅  Resume Integration (upload, pdf-parse, resume-aware prompts)

Phase 6  🚧  Advanced Features
              ├── 6.1 Interview Modes (Quick Fire, Deep Dive, Weakness Trainer)
              ├── 6.2 Per-Question Scoring (real-time answer grading)
              ├── 6.3 Interview Reports (PDF export, shareable links)
              ├── 6.4 Multi-Model Optimization (route tasks to right model)
              └── 6.5 Social Features (leaderboard, progress cards, challenges)

Phase 7  ⬜  Production Hardening
              ├── Vercel deployment + analytics
              ├── Sentry error monitoring
              ├── Upstash rate limiting on Groq calls
              └── Zod input validation + error boundaries

Phase 8  ⬜  Monetization
              ├── Free vs Pro tier gating
              ├── Stripe billing integration
              └── Usage tracking + monthly resets
```

---

## 🔑 Accounts & Keys

| Service | URL | Status |
|---|---|---|
| Clerk | clerk.com | ✅ Configured |
| Groq | console.groq.com | ✅ Configured |
| Neon | neon.tech | ✅ Configured |
| Vercel | vercel.com | ✅ Configured |
| Resend (Phase 6 stretch) | resend.com | ⬜ Free tier |
| Upstash Redis (Phase 7) | upstash.com | ⬜ Free tier |
| Stripe (Phase 8) | stripe.com | ⬜ Needs setup |
| Sentry (Phase 7) | sentry.io | ⬜ Free tier |

---

*Last updated: June 20, 2026*  
*Current status: Phase 5 complete. Phase 6 in planning.*
