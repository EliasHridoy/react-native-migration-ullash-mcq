# Ullash Live MCQ — React Native Migration

> **Flutter → Expo (React Native + TypeScript)**  
> Supabase Project ID: `bmqdmanvpbrerlgisald` — **backend unchanged**

---

## 📐 Architecture at a Glance

```
React Native (Expo SDK 52)
  ├── expo-router      (navigation)
  ├── zustand          (client state)
  ├── react-query      (server data)
  ├── nativewind       (styling)
  └── @supabase/supabase-js (backend — existing project, NO changes)
```

---

## 🗂️ Migration Documents

Each document is a **self-contained task brief** for one agent. Read the one assigned to you and execute it fully.

| Agent | File | Covers |
|-------|------|--------|
| 1 | [01_PROJECT_SETUP.md](./agent-instructions/01_PROJECT_SETUP.md) | Expo init, packages, folder structure |
| 2 | [02_DESIGN_SYSTEM.md](./agent-instructions/02_DESIGN_SYSTEM.md) | Colors, typography, GlassCard, GradientButton |
| 3 | [03_CORE_INFRASTRUCTURE.md](./agent-instructions/03_CORE_INFRASTRUCTURE.md) | Supabase client, constants, scoring utils, routing |
| 4 | [04_DATABASE_MIGRATION.md](./agent-instructions/04_DATABASE_MIGRATION.md) | Schema verification, TypeScript types (NO DB changes) |
| 5 | [05_AUTH_FEATURE.md](./agent-instructions/05_AUTH_FEATURE.md) | Login, Register, Google/Facebook OAuth |
| 6 | [06_PROFILE_FEATURE.md](./agent-instructions/06_PROFILE_FEATURE.md) | Profile screen, avatar upload, auto-create |
| 7 | [07_BOARD_SUBJECT_HIERARCHY.md](./agent-instructions/07_BOARD_SUBJECT_HIERARCHY.md) | Board → Subject → Chapter → Topic navigation |
| 8 | [08_QUESTION_BANK.md](./agent-instructions/08_QUESTION_BANK.md) | Question API, status tracking, smart search |
| 9 | [09_STUDY_MATERIALS.md](./agent-instructions/09_STUDY_MATERIALS.md) | PDFs, videos, 60s signed URLs, premium gating |
| 10 | [10_PRACTICE_EXAM.md](./agent-instructions/10_PRACTICE_EXAM.md) | Practice exam engine, shuffle, progress tracking |
| 11 | [11_LIVE_EXAM.md](./agent-instructions/11_LIVE_EXAM.md) | Live exam, clock sync, Realtime, anti-cheat |
| 12 | [12_SCORING_AND_RESULTS.md](./agent-instructions/12_SCORING_AND_RESULTS.md) | Result analysis, topic breakdown, history |
| 13 | [13_LEADERBOARD.md](./agent-instructions/13_LEADERBOARD.md) | Leaderboard tabs, podium, real-time updates |
| 14 | [14_AI_TUTOR_AND_PEDAGOGY.md](./agent-instructions/14_AI_TUTOR_AND_PEDAGOGY.md) | AI Mitro hints, Ogroshor loop, micro-practice |
| 15 | [15_SUBSCRIPTION_AND_PAYWALL.md](./agent-instructions/15_SUBSCRIPTION_AND_PAYWALL.md) | SubscriptionGate, PaywallScreen, entitlement |
| 16 | [16_BKASH_PAYMENT.md](./agent-instructions/16_BKASH_PAYMENT.md) | bKash 3-step payment, IPN, transaction history |
| 17 | [17_PENDING_FEATURES.md](./agent-instructions/17_PENDING_FEATURES.md) | OTP login, Rocket MFS, Nagad MFS, Sentry, tests |
| Ref | [FLUTTER_TO_RN_MAPPING.md](./agent-instructions/FLUTTER_TO_RN_MAPPING.md) | Full Flutter → React Native concept mapping |
| Ref | [00_OVERVIEW_AND_STACK.md](./agent-instructions/00_OVERVIEW_AND_STACK.md) | Full architecture overview |

---

## ⚠️ CRITICAL RULES FOR ALL AGENTS

1. **DO NOT modify the `supabase/` folder** — all DB migrations are already applied.
2. **DO NOT rename Supabase tables, RPCs, or Edge Functions** — only the frontend changes.
3. **DO use TypeScript** with strict mode — no `any` types unless unavoidable.
4. **DO use path aliases** — `@/` maps to `src/`, `@app/` maps to `app/`.
5. **DO read `FLUTTER_TO_RN_MAPPING.md`** before implementing to find your exact pattern.

---

## 🔀 Agent Dependency Graph

```
Agent 1 (Setup) ─────────────────────────────────────────────────────────────┐
Agent 2 (Design) ──────────┐                                                 │
Agent 3 (Core) ─────────────────────────┐                                    │
Agent 4 (DB Types) ─────────────────────┼──────────────────────┐            │
                                         │                        │            │
Agent 5 (Auth) ──────────────────────────┼────┐                  │            │
Agent 6 (Profile) ──────────────────────┘    │                  │            │
Agent 7 (Hierarchy) ──────────────────────────┼────┐             │            │
Agent 8 (Questions) ──────────────────────────┼────┼─────┐       │            │
Agent 9 (Study Materials) ────────────────────┘    │     │       │            │
Agent 10 (Practice Exam) ────────────────────────────┼────┼───┐   │            │
Agent 11 (Live Exam) ─────────────────────────────────┘    │   │   │            │
Agent 12 (Scoring) ──────────────────────────────────────────┘   │   │            │
Agent 13 (Leaderboard) ──────────────────────────────────────────┘   │            │
Agent 14 (AI + Pedagogy) ─────────────────────────────────────────────┘            │
Agent 15 (Subscription) ──────────────────────────────────────────────────────────┐ │
Agent 16 (bKash Payment) ──────────────────────────────────────────────────────────┘ │
Agent 17 (Pending Features) ─────────────────────────────────────────────────────────┘
```

---

## 🗺️ Final Folder Structure

After all agents complete, the app directory should look like:

```
react-native-migration-ullash-mcq/
├── app/                          # Expo Router pages
│   ├── _layout.tsx               # Root layout (QueryClient, fonts, auth listener)
│   ├── index.tsx                 # Splash/redirect
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   └── phone-login.tsx       # Agent 17
│   └── (app)/
│       ├── _layout.tsx           # Tab navigator
│       ├── home/
│       │   ├── index.tsx
│       │   └── records.tsx
│       ├── profile/
│       │   ├── index.tsx
│       │   └── edit.tsx
│       ├── leaderboard/
│       │   └── index.tsx
│       ├── exam/
│       │   ├── board-selection.tsx
│       │   ├── subject-selection.tsx
│       │   ├── chapter-selection.tsx
│       │   ├── practice/
│       │   │   └── [params].tsx
│       │   ├── live/
│       │   │   └── [examId].tsx
│       │   ├── result/
│       │   │   └── [examId].tsx
│       │   └── study-materials/
│       │       └── [topicId].tsx
│       ├── question-search.tsx
│       ├── ai-search.tsx
│       ├── micro-practice.tsx
│       ├── paywall.tsx
│       ├── bkash-payment.tsx
│       ├── rocket-payment.tsx    # Agent 17
│       └── nagad-payment.tsx    # Agent 17
│
├── src/
│   ├── core/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── database.types.ts  # Generated
│   │   │   └── types.ts
│   │   ├── constants/
│   │   │   ├── app.constants.ts
│   │   │   └── supabase.constants.ts
│   │   ├── theme/
│   │   │   ├── colors.ts
│   │   │   ├── typography.ts
│   │   │   └── spacing.ts
│   │   ├── utils/
│   │   │   └── scoring.utils.ts
│   │   └── errors/
│   │       └── failures.ts
│   │
│   ├── components/               # Shared UI components
│   │   ├── GlassCard.tsx
│   │   ├── GradientButton.tsx
│   │   ├── ShimmerLoader.tsx
│   │   ├── DifficultyBadge.tsx
│   │   ├── HintButton.tsx
│   │   └── SubscriptionGate.tsx
│   │
│   └── features/                 # Feature modules
│       ├── auth/
│       ├── profile/
│       ├── board_selection/
│       ├── subject/
│       ├── exam/
│       ├── result/
│       ├── leaderboard/
│       ├── ai_tutor/
│       ├── pedagogy/
│       ├── subscription/
│       ├── payment/
│       └── study_material/
│
├── global.css                    # NativeWind base styles
├── tailwind.config.js
├── babel.config.js
├── tsconfig.json
├── app.json
├── .env                          # Real values (gitignored)
└── .env.example                  # Template committed to repo
```
