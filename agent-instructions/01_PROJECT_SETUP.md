# 01 — Project Setup (Agent 1)

> **Agent:** Agent 1  
> **Prerequisite:** None — this is the first task  
> **Output:** A working Expo project with TypeScript, NativeWind, and Expo Router

---

## 📋 Tasks

- [ ] Initialize Expo project with TypeScript template
- [ ] Install all core dependencies
- [ ] Configure NativeWind (Tailwind for React Native)
- [ ] Configure Expo Router (file-based routing)
- [ ] Set up `tsconfig.json` with strict mode
- [ ] Set up `.env.example` and environment variable handling
- [ ] Create the base folder structure under `src/`
- [ ] Configure `app.json` with app name, bundle ID, and splash

---

## 🛠️ Step-by-Step Instructions

### Step 1: Initialize Expo Project

Run this command **inside** `react-native-migration-ullash-mcq/`:

```bash
npx create-expo-app@latest app --template blank-typescript
cd app
```

> App name: **"Ullash Live MCQ"**  
> Bundle ID (Android): `com.livemcq.live_exam`  
> Bundle ID (iOS): `com.livemcq.liveExam`

---

### Step 2: Install Core Dependencies

```bash
# Navigation
npx expo install expo-router expo-linking expo-constants expo-status-bar

# Supabase
npm install @supabase/supabase-js

# State management
npm install zustand @tanstack/react-query

# UI & Styling
npm install nativewind tailwindcss
npx expo install expo-image expo-blur expo-linear-gradient
npm install react-native-svg
npx expo install expo-font @expo-google-fonts/inter

# Animations
npx expo install react-native-reanimated react-native-gesture-handler

# Auth & Storage
npx expo install expo-auth-session expo-web-browser expo-secure-store
npx expo install expo-image-picker

# Media & Linking
npx expo install expo-linking expo-file-system

# AsyncStorage (for Supabase session persistence)
npm install @react-native-async-storage/async-storage

# Utilities
npm install date-fns
```

---

### Step 3: Configure NativeWind

Create `tailwind.config.js` in `app/`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#6C5CE7',       // Indigo (matches Flutter theme)
        accent: '#00D2D3',        // Teal
        background: '#0A0A1A',   // Deep dark
        surface: '#1A1A2E',      // Card surface
        surfaceElevated: '#16213E',
        error: '#FF6B6B',
        warning: '#FFC107',
        success: '#51CF66',
        textPrimary: '#FFFFFF',
        textSecondary: '#B0B3C8',
        textMuted: '#6B6F8A',
        border: 'rgba(108, 92, 231, 0.3)',
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'System'],
        medium: ['Inter_500Medium', 'System'],
        semibold: ['Inter_600SemiBold', 'System'],
        bold: ['Inter_700Bold', 'System'],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
        chip: '20px',
      },
    },
  },
  plugins: [],
};
```

Update `babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

---

### Step 4: Configure Expo Router

In `app.json` set:

```json
{
  "expo": {
    "name": "Ullash Live MCQ",
    "slug": "ullash-live-mcq",
    "scheme": "com.livemcq.liveexam",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "backgroundColor": "#0A0A1A"
    },
    "android": {
      "package": "com.livemcq.live_exam",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#6C5CE7"
      }
    },
    "ios": {
      "bundleIdentifier": "com.livemcq.liveExam",
      "supportsTablet": false
    },
    "plugins": [
      "expo-router",
      "expo-font",
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow Ullash to access your photos for profile picture."
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

---

### Step 5: TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"],
      "@app/*": ["./app/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.d.ts", "expo-env.d.ts"]
}
```

---

### Step 6: Environment Variables

Create `.env.example`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://bmqdmanvpbrerlgisald.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_AUTH_REDIRECT_URI=com.livemcq.liveexam://login-callback
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_FACEBOOK_APP_ID=
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=
EXPO_PUBLIC_REVENUECAT_IOS_KEY=
```

Copy to `.env` and fill in actual values from memory.md:
- `SUPABASE_URL`: `https://bmqdmanvpbrerlgisald.supabase.co`
- `SUPABASE_ANON_KEY`: from `memory.md` → `Run application with command` section

---

### Step 7: Create Folder Structure

```bash
mkdir -p src/core/constants
mkdir -p src/core/supabase
mkdir -p src/core/theme
mkdir -p src/core/utils
mkdir -p src/components
mkdir -p src/features/auth/{api,types,store,hooks}
mkdir -p src/features/profile/{api,types,store,hooks}
mkdir -p src/features/board_selection/{api,types,store}
mkdir -p src/features/subject/{api,types,store}
mkdir -p src/features/exam/{api,types,store,hooks}
mkdir -p src/features/result/{api,types,store}
mkdir -p src/features/leaderboard/{api,types,store}
mkdir -p src/features/ai_tutor/{api,types,store}
mkdir -p src/features/pedagogy/{api,types,store}
mkdir -p src/features/subscription/{api,types,store}
mkdir -p src/features/payment/{api,types,store}
mkdir -p src/features/study_material/{api,types,store}
```

---

### Step 8: Create Root Layout

Create `app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useEffect } from 'react';
import { SplashScreen } from 'expo-router';
import '../global.css'; // NativeWind

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 * 5 }, // 5 min stale
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
```

---

### Step 9: Verify Setup

```bash
npx expo start
```

Expected: Expo DevTools opens, app boots to a blank screen with dark background.

---

## ✅ Completion Checklist

- [ ] `app/` directory created with Expo project
- [ ] All dependencies installed (check `package.json`)
- [ ] NativeWind configured with color tokens from Flutter theme
- [ ] Expo Router configured
- [ ] TypeScript strict mode enabled
- [ ] `.env.example` created
- [ ] Folder structure (`src/features/`, `src/core/`) created
- [ ] `app/_layout.tsx` with QueryClient + fonts setup
- [ ] `npx expo start` runs without errors

---

## 🔗 Next: [02_DESIGN_SYSTEM.md](./02_DESIGN_SYSTEM.md)
