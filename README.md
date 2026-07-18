# Ullash Live MCQ

A cross-platform MCQ exam preparation app built with **Expo SDK 52** (React Native + TypeScript) and **Supabase** backend.

> Originally migrated from Flutter to React Native.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 52, React 18.3, React Native 0.76 |
| Navigation | expo-router (file-based) |
| Client State | zustand |
| Server State | @tanstack/react-query |
| Styling | NativeWind (Tailwind CSS) |
| Backend | Supabase (PostgreSQL, RLS, Realtime, Edge Functions) |
| Animations | react-native-reanimated v3 |
| Auth | expo-auth-session (Google, Facebook), email/password |
| Fonts | Inter via @expo-google-fonts/inter |
| Payments | bKash (3-step IPN), Rocket, Nagad |
| Monitoring | Sentry |

---

## Features

- **Authentication** – Email/password, Google OAuth, Facebook OAuth, forgot password, phone OTP (pending)
- **Profile** – View/edit profile, avatar upload via expo-image-picker
- **Board/Subject/Chapter/Topic Hierarchy** – Multi-level navigation for exam content
- **Practice Exams** – Shuffled questions, progress tracking, timed mode
- **Live Exams** – Real-time clock sync via Supabase Realtime, anti-cheat measures
- **Question Bank** – Smart search, status tracking (answered, bookmarked, incorrect)
- **AI Tutor (Mitro)** – AI-powered hints and explanations
- **Ogroshor Pedagogical Loop** – Weakness analysis, micro-practice queue
- **Scoring & Results** – Topic-wise breakdown, exam history, weakness vectors
- **Leaderboard** – Tabbed leaderboard with podium, real-time updates
- **Study Materials** – PDFs and videos with 60s signed URLs, premium gating
- **Subscription** – RevenueCat entitlements, SubscriptionGate component, PaywallScreen
- **Payments** – bKash 3-step IPN payment flow, Rocket MFS, Nagad MFS
- **Micro-Practice** – Targeted practice on weak topics

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npx expo`)
- iOS Simulator (macOS) or Android Emulator / physical device

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables and fill in real values
cp .env.example .env
```

Required environment variables in `.env`:

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `EXPO_PUBLIC_AUTH_REDIRECT_URI` | OAuth redirect URI (e.g. `com.livemcq.liveexam://login-callback`) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth web client ID |
| `EXPO_PUBLIC_FACEBOOK_APP_ID` | Facebook app ID |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | RevenueCat Android key |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | RevenueCat iOS key |

### Development

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run in browser
```

### Testing

```bash
npm test           # Run Jest test suite
```

---

## Project Structure

```
app/                          # Expo Router pages (file-based routing)
├── _layout.tsx               # Root layout (providers, fonts, auth listener)
├── index.tsx                 # Splash/redirect
├── (auth)/                   # Auth screens
│   ├── login.tsx
│   ├── register.tsx
│   ├── forgot-password.tsx
│   └── phone-login.tsx
└── (app)/                    # Authenticated app screens
    ├── home/
    ├── profile/
    ├── leaderboard/
    ├── exam/
    │   ├── practice/
    │   ├── live/
    │   ├── result/
    │   └── study-materials/
    ├── question-search.tsx
    ├── ai-search.tsx
    ├── micro-practice.tsx
    ├── paywall.tsx
    ├── bkash-payment.tsx
    ├── rocket-payment.tsx
    └── nagad-payment.tsx

src/
├── core/                     # Cross-cutting infrastructure
│   ├── supabase/             # Client, types, database types
│   ├── constants/            # App & Supabase constants
│   ├── theme/                # Colors, typography, spacing
│   ├── utils/                # Scoring engine, helpers
│   └── errors/               # Error/failure types
├── components/               # Shared UI components
│   ├── GlassCard.tsx
│   ├── GradientButton.tsx
│   ├── ShimmerLoader.tsx
│   ├── DifficultyBadge.tsx
│   ├── HintButton.tsx
│   └── SubscriptionGate.tsx
└── features/                 # Feature modules (feature-first architecture)
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

Each feature module follows a consistent structure:

```
feature/
├── api/          # Supabase/Axios API calls
├── hooks/        # React hooks (when applicable)
├── store/        # Zustand stores
├── types/        # TypeScript types/interfaces
├── components/   # Feature-specific components
└── utils/        # Feature-specific utilities
```

---

## Architecture

**Feature-first clean architecture** with clear separation of concerns:

- **Pages** (`app/`) – Route definitions, minimal logic, delegate to features
- **Features** (`src/features/`) – Self-contained modules with their own API layer, state, types, and components
- **Core** (`src/core/`) – Shared infrastructure (Supabase client, theme, constants, utilities)
- **Components** (`src/components/`) – Reusable presentational components

**State management:**
- **Server state** – @tanstack/react-query (caching, refetching, optimistic updates)
- **Client state** – zustand (auth session, exam progress, UI state)
- **Secure storage** – expo-secure-store for tokens

---

## Path Aliases

| Alias | Maps to |
|-------|---------|
| `@/` | `./src/` |
| `@app/` | `./app/` |

---

## Build

Production builds use EAS Build:

```bash
npx eas build --platform android --profile production
npx eas build --platform ios --profile production
```

Configured profiles: `development`, `development-simulator`, `preview`, `production`.

---

## License

Private – All rights reserved.
