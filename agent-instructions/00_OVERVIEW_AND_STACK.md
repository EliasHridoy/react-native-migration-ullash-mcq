# 00 — Overview & Technology Stack

> **Read this before executing any agent task.**

---

## 🏗️ Architecture: Feature-First Clean Architecture (preserved in RN)

The Flutter app used **Feature-First Clean Architecture** with layers:
`data/` → `domain/` → `presentation/`

In React Native, we use an equivalent structure:

```
src/
├── features/
│   └── auth/
│       ├── api/              ← replaces data/datasources/ (Supabase calls)
│       ├── types/            ← replaces domain/entities/ (TypeScript interfaces)
│       ├── store/            ← replaces presentation/providers/ (Zustand stores)
│       └── screens/          ← replaces presentation/screens/
├── core/
│   ├── constants/            ← AppConstants, SupabaseConstants, RouteConstants
│   ├── supabase/             ← Supabase client singleton
│   ├── theme/                ← Design tokens (colors, typography, spacing)
│   └── utils/                ← Scoring engine, formatters, helpers
└── components/               ← Shared reusable UI components
```

---

## 📦 Technology Stack

### Core
| Flutter Package | React Native Equivalent | Notes |
|----------------|------------------------|-------|
| `flutter` 3.32.0 | `expo` ~52.x (SDK 52) | Expo Managed Workflow |
| `dart` | `TypeScript 5.x` | Strict mode enabled |
| `go_router` | `expo-router` (file-based) | Deep linking, typed routes |
| `flutter_riverpod` | `zustand` + `@tanstack/react-query` | State + async data fetching |
| `dartz` (Either) | `neverthrow` or plain try/catch | Functional error handling |
| `equatable` | TypeScript interfaces (structural equality) | Native TS equality |

### Supabase
| Flutter Package | React Native Equivalent | Notes |
|----------------|------------------------|-------|
| `supabase_flutter` | `@supabase/supabase-js` v2 | Same Supabase project |
| Supabase Realtime | `@supabase/supabase-js` Realtime | Identical API, same channels |

### UI & Styling
| Flutter Package | React Native Equivalent | Notes |
|----------------|------------------------|-------|
| Material 3 Theme | `NativeWind` + custom theme | Tailwind CSS for RN |
| `google_fonts` (Inter) | `expo-google-fonts/inter` | Same font family |
| `flutter_animate` | `react-native-reanimated` v3 | Micro-animations |
| `shimmer` | `expo-linear-gradient` + custom shimmer | Skeleton loaders |
| `flutter_svg` | `react-native-svg` | SVG support |
| `cached_network_image` | `expo-image` | Optimized image caching |
| Glassmorphic cards | `expo-blur` + `StyleSheet` | BlurView for glass effect |

### Storage & Media
| Flutter Package | React Native Equivalent | Notes |
|----------------|------------------------|-------|
| `image_picker` | `expo-image-picker` | Camera/gallery picker |
| `url_launcher` | `expo-linking` | Open external URLs |
| `shared_preferences` | `expo-secure-store` / AsyncStorage | Local key-value storage |

### Auth
| Flutter Package | React Native Equivalent | Notes |
|----------------|------------------------|-------|
| `google_sign_in` | `expo-auth-session` + Google OAuth | Expo handles OAuth |
| Facebook OAuth | `expo-auth-session` + Facebook OAuth | Same pattern |

### AI & Payment
| Flutter Package | React Native Equivalent | Notes |
|----------------|------------------------|-------|
| Supabase Edge Functions | Same Edge Functions (unchanged) | Zero migration needed |
| `url_launcher` (bKash) | `expo-linking` or `expo-web-browser` | Open bKash URL |

---

## 📁 React Native Project Directory Map

The new RN app will live in `react-native-migration-ullash-mcq/app/`:

```
react-native-migration-ullash-mcq/
└── app/                              ← Root of the Expo project
    ├── package.json
    ├── tsconfig.json
    ├── app.json                       ← Expo config
    ├── tailwind.config.js
    ├── .env.example
    ├── app/                           ← Expo Router pages (file-based routing)
    │   ├── _layout.tsx                ← Root layout (providers, theme)
    │   ├── index.tsx                  ← Splash / redirect
    │   ├── (auth)/
    │   │   ├── _layout.tsx
    │   │   ├── login.tsx
    │   │   └── register.tsx
    │   ├── (app)/
    │   │   ├── _layout.tsx            ← Tab navigator
    │   │   ├── home/
    │   │   │   ├── index.tsx          ← Home dashboard
    │   │   │   └── records.tsx        ← Records & history
    │   │   ├── exam/
    │   │   │   ├── board-selection.tsx
    │   │   │   ├── subject-selection.tsx
    │   │   │   ├── chapter-selection.tsx
    │   │   │   ├── practice/[params].tsx
    │   │   │   ├── live/[examId].tsx
    │   │   │   └── result/[examId].tsx
    │   │   ├── leaderboard/
    │   │   │   └── index.tsx
    │   │   ├── ai-search.tsx
    │   │   ├── micro-practice.tsx
    │   │   └── profile/
    │   │       ├── index.tsx
    │   │       └── edit.tsx
    │   ├── paywall.tsx
    │   ├── bkash-payment.tsx
    │   └── question-search.tsx
    │
    └── src/
        ├── core/
        │   ├── constants/
        │   │   ├── app.constants.ts    ← AppConstants
        │   │   ├── supabase.constants.ts
        │   │   └── scoring.constants.ts
        │   ├── supabase/
        │   │   └── client.ts           ← createClient singleton
        │   ├── theme/
        │   │   ├── colors.ts           ← AppTheme tokens
        │   │   ├── typography.ts
        │   │   └── spacing.ts
        │   └── utils/
        │       ├── scoring.utils.ts    ← calculateScore, weakness vector
        │       └── format.utils.ts
        │
        ├── components/                 ← Shared components
        │   ├── GlassCard.tsx
        │   ├── GradientButton.tsx
        │   ├── ShimmerLoader.tsx
        │   ├── SubscriptionGate.tsx
        │   └── ...
        │
        └── features/
            ├── auth/
            ├── profile/
            ├── board_selection/
            ├── subject/
            ├── exam/
            ├── result/
            ├── leaderboard/
            ├── ai_tutor/
            ├── pedagogy/
            ├── subscription/
            ├── payment/
            └── study_material/
```

---

## 🔐 Environment Variables

```bash
# .env (Expo uses EXPO_PUBLIC_ prefix for client-side vars)
EXPO_PUBLIC_SUPABASE_URL=https://bmqdmanvpbrerlgisald.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
EXPO_PUBLIC_AUTH_REDIRECT_URI=com.livemcq.liveexam://login-callback

# Optional — for social auth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id

# RevenueCat
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=your_key
EXPO_PUBLIC_REVENUECAT_IOS_KEY=your_key
```

---

## 🗄️ Database — ZERO CHANGES REQUIRED

> [!IMPORTANT]
> **All 12 Supabase migrations, RLS policies, RPCs, Edge Functions, and storage buckets are identical.**
> The Supabase project `bmqdmanvpbrerlgisald` is reused as-is.
> No `supabase/migrations/` files need to be modified.

### Migration Files (Already Applied — Do NOT re-run)
| File | Purpose |
|------|---------|
| `001_initial_schema.sql` | Core tables, RLS, indexes |
| `002_question_status_unique.sql` | UNIQUE constraint on question_status |
| `003_live_exam_support.sql` | user_exam_sessions, get_server_time() RPC |
| `004_security_and_answers.sql` | SECURITY DEFINER submit_exam_session RPC |
| `005_scoring_engine.sql` | calculate_exam_score RPC, user_exam_results |
| `006_leaderboard_infrastructure.sql` | Leaderboard sorted sets |
| `007_leaderboard_fixes.sql` | Leaderboard snapshot cron |
| `007_ogroshor_pedagogical_loop.sql` | Weakness gaps, micro_practice_queue |
| `008_ai_tutor.sql` | pgvector, hint_usage, semantic search RPC |
| `010_subscription_entitlements.sql` | Subscription columns, RPC, pg_cron |
| `011_rls_content_policies.sql` | Content table read policies |
| `012_bkash_payments.sql` | bkash_transactions, upsert RPCs |

---

## ⚡ Performance Targets (Preserved from Flutter spec)

| Metric | Target |
|--------|--------|
| API Latency | < 150ms |
| WebSocket delivery | < 100ms |
| Concurrent users | 10,000 |
| DB CPU at peak | < 70% |
| Failure rate | < 0.1% |
