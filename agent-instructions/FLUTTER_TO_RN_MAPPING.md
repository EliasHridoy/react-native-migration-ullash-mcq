# Flutter → React Native Concept Mapping

> **Reference for all agents.** Use this to quickly translate Flutter patterns to React Native equivalents.

---

## 🏗️ Architecture Mapping

| Flutter Concept | React Native Equivalent |
|----------------|------------------------|
| Feature-First Clean Architecture | Same structure: `api/` + `types/` + `store/` + `screens/` |
| `domain/entities/` | `types/*.types.ts` (TypeScript interfaces) |
| `data/datasources/` | `api/*.api.ts` (Supabase calls) |
| `data/repositories/` | Merged into `api/*.api.ts` (simplified) |
| `domain/usecases/` | Functions inside store actions or util files |
| `presentation/providers/` | `store/*.store.ts` (Zustand) |
| `presentation/screens/` | `app/**/*.tsx` (Expo Router pages) |
| `presentation/widgets/` | `src/components/` + `src/features/*/components/` |

---

## 📦 Package Mapping

### State Management

| Flutter | React Native |
|---------|-------------|
| `flutter_riverpod` | `zustand` |
| `riverpod_annotation` | Not needed (no code gen) |
| `Notifier<State>` | `create<State & Actions>()` in Zustand |
| `NotifierProvider<N, S>` | `useXxxStore()` |
| `NotifierProvider.family` | Zustand with param-based store key or `useQuery(key + param)` |
| `FutureProvider` | `useQuery()` from `@tanstack/react-query` |
| `StreamProvider` | `useEffect` + Supabase `.on()` subscription |
| `ref.read(provider)` | `useXxxStore.getState().action()` |
| `ref.watch(provider)` | `const { field } = useXxxStore()` |
| `ref.invalidate(provider)` | `queryClient.invalidateQueries(key)` |

### Navigation

| Flutter | React Native |
|---------|-------------|
| `GoRouter` | `expo-router` (file-based) |
| `RouteConstants.home = '/home'` | File path: `app/(app)/home/index.tsx` |
| `context.go('/route')` | `router.push('/route')` |
| `context.replace('/route')` | `router.replace('/route')` |
| `GoRoute extra: params` | `router.push({ pathname, params })` |
| `context.pop()` | `router.back()` |
| `state.extra as T` | `useLocalSearchParams<T>()` |
| Auth-aware redirects | `(auth)` and `(app)` route groups |

### UI & Styling

| Flutter | React Native |
|---------|-------------|
| `MaterialApp` + `ThemeData` | NativeWind + `Colors` tokens |
| `Scaffold` | `View` with `backgroundColor` |
| `AppBar` | Custom `View` header component |
| `Column` | `View` (default direction = column) |
| `Row` | `View` with `flexDirection: 'row'` |
| `Expanded` / `Flexible` | `flex: 1` in `StyleSheet` |
| `SizedBox(width: 16)` | `View` with `width: 16` or margin/padding |
| `Padding` | `paddingVertical`, `paddingHorizontal` |
| `Container` | `View` with `style` |
| `Card` | `GlassCard` component |
| `ListView` / `GridView` | `FlatList` / `FlatList numColumns` |
| `SingleChildScrollView` | `ScrollView` |
| `GestureDetector` + `onTap` | `TouchableOpacity` |
| `ElevatedButton` | `GradientButton` |
| `TextButton` | `TouchableOpacity` |
| `CircularProgressIndicator` | `ActivityIndicator` |
| `LinearProgressIndicator` | Custom `View` with width: `percentage%` |
| `Text` widget | `Text` component |
| `Image.network()` | `expo-image` `<Image source={{ uri }}>` |
| `Image.asset()` | `<Image source={require('../assets/...')}>`|
| `CachedNetworkImage` | `expo-image` (caches by default) |
| `BackdropFilter` (glassmorphism) | `<BlurView>` from `expo-blur` |
| `LinearGradient` | `<LinearGradient>` from `expo-linear-gradient` |
| `flutter_animate` (`.animate()`) | `react-native-reanimated` Animated components |
| `Shimmer` | Custom `ShimmerLoader` with Reanimated |
| `BottomSheet` | `@gorhom/bottom-sheet` |
| `showDialog()` | `Alert.alert()` or custom modal |
| `ExpansionTile` | Custom accordion with `Animated.View` |
| `Chip` | Custom `TouchableOpacity` with pill style |
| `IconButton` | `TouchableOpacity` with icon |
| `SnackBar` | `react-native-toast-message` |

### Fonts

| Flutter | React Native |
|---------|-------------|
| `google_fonts.Inter()` | `@expo-google-fonts/inter` |
| `FontWeight.w400` | `fontFamily: 'Inter_400Regular'` |
| `FontWeight.w500` | `fontFamily: 'Inter_500Medium'` |
| `FontWeight.w600` | `fontFamily: 'Inter_600SemiBold'` |
| `FontWeight.w700` | `fontFamily: 'Inter_700Bold'` |

---

## 🗄️ Supabase API Mapping

| Flutter | React Native |
|---------|-------------|
| `Supabase.instance.client` | `import { supabase } from '@/core/supabase/client'` |
| `.from('table').select()` | Same API — identical |
| `.eq()`, `.in_()`, `.order()` | Same API |
| `.rpc('function_name', params)` | `.rpc('function_name', { ...params })` |
| `.textSearch('col', query)` | Same API |
| `supabase.functions.invoke()` | Same API |
| `supabase.storage.from().upload()` | Same API |
| `supabase.storage.createSignedUrl()` | Same API |
| `supabase.auth.signInWithPassword()` | Same API |
| `supabase.auth.signInWithOAuth()` | Same API (via `expo-auth-session`) |
| `supabase.auth.onAuthStateChange()` | Same API |
| Realtime: `.channel().on().subscribe()` | Same API |
| Realtime: `postgres_changes` | Same API |
| Realtime: `broadcast` | Same API |

---

## 🔐 Auth Mapping

| Flutter | React Native |
|---------|-------------|
| `AuthUser` entity | `AuthUser` interface |
| `AuthState.initial` | `status: 'initial'` |
| `AuthState.loading` | `status: 'loading'` |
| `AuthState.authenticated(user)` | `status: 'authenticated', user` |
| `AuthState.unauthenticated` | `status: 'unauthenticated'` |
| `AuthState.error(message)` | `status: 'error', error: message` |
| `signInWithGoogle` (native SDK) | `expo-auth-session` + Google OAuth |
| `signInWithFacebook` (redirect) | `expo-auth-session` + Facebook OAuth |
| `--dart-define=SUPABASE_URL` | `EXPO_PUBLIC_SUPABASE_URL` in `.env` |
| Session persistence (shared_prefs) | `AsyncStorage` (configured in Supabase client) |

---

## 🎨 Design Token Mapping

| Flutter (`AppTheme`) | React Native (`Colors`) |
|---------------------|------------------------|
| `AppTheme.primary` = `#6C5CE7` | `Colors.primary` = `#6C5CE7` |
| `AppTheme.accent` = `#00D2D3` | `Colors.accent` = `#00D2D3` |
| `AppTheme.background` = `#0A0A1A` | `Colors.background` = `#0A0A1A` |
| `AppTheme.surface` = `#1A1A2E` | `Colors.surface` = `#1A1A2E` |
| `AppTheme.error` = `#FF6B6B` | `Colors.error` = `#FF6B6B` |
| `AppTheme.warning` = `#FFC107` | `Colors.warning` = `#FFC107` |
| `AppTheme.success` = `#51CF66` | `Colors.success` = `#51CF66` |
| `AppTheme.textPrimary` | `Colors.textPrimary` |
| `AppTheme.textSecondary` | `Colors.textSecondary` |

---

## 🔄 State Pattern Mapping

### Riverpod Notifier → Zustand

**Flutter:**
```dart
class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() => AuthState.initial();

  Future<void> signIn(String email, String password) async {
    state = AuthState.loading();
    try {
      final user = await ref.read(authRepoProvider).signIn(email, password);
      state = AuthState.authenticated(user);
    } catch (e) {
      state = AuthState.error(e.toString());
    }
  }
}
```

**React Native:**
```typescript
const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  status: 'initial',
  user: null,
  error: null,

  signIn: async (email, password) => {
    set({ status: 'loading', error: null });
    try {
      const user = await authApi.signInWithEmail(email, password);
      set({ status: 'authenticated', user });
    } catch (e: any) {
      set({ status: 'error', error: e.message });
    }
  },
}));
```

### FutureProvider → useQuery

**Flutter:**
```dart
final boardsProvider = FutureProvider<List<Board>>((ref) async {
  return ref.read(boardRepoProvider).getBoards();
});
```

**React Native:**
```typescript
function useBoards() {
  return useQuery({
    queryKey: ['boards'],
    queryFn: boardApi.getBoards,
    staleTime: 1000 * 60 * 60,
  });
}
```

### StreamProvider → useEffect + subscription

**Flutter:**
```dart
final authStateProvider = StreamProvider<AuthUser?>((ref) {
  return ref.read(authRepoProvider).authStateChanges;
});
```

**React Native:**
```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    setUser(session?.user ? mapToAuthUser(session.user) : null);
  });
  return () => subscription.unsubscribe();
}, []);
```

---

## ⚡ Error Handling Mapping

| Flutter | React Native |
|---------|-------------|
| `Either<Failure, T>` (dartz) | `try/catch` with typed errors |
| `ServerFailure` | `ServerFailure extends AppFailure` class |
| `AuthFailure` | `AuthFailure extends AppFailure` class |
| `PaymentFailure` | `PaymentFailure extends AppFailure` class |
| `fold(onLeft, onRight)` | `try { success } catch (e) { failure }` |

---

## 🧪 Testing Mapping

| Flutter | React Native |
|---------|-------------|
| `flutter test` | `jest` |
| `testWidgets()` | `render()` from `@testing-library/react-native` |
| `rls_integration_test.dart` | `auth.integration.test.ts` (with env var guards) |
| `widget_test.dart` | `*.test.tsx` with `@testing-library/react-native` |
| `--dart-define` for test creds | `process.env.EXPO_PUBLIC_*` |

---

## 🚀 Routing Reference

| Flutter Route | Expo Router File | Notes |
|-------------|-----------------|-------|
| `/` (splash) | `app/index.tsx` | Redirects to auth or home |
| `/login` | `app/(auth)/login.tsx` | |
| `/home` | `app/(app)/home/index.tsx` | |
| `/board-selection` | `app/(app)/exam/board-selection.tsx` | |
| `/subject-selection` | `app/(app)/exam/subject-selection.tsx` | |
| `/chapter-selection` | `app/(app)/exam/chapter-selection.tsx` | |
| `/practice-exam` | `app/(app)/exam/practice/[params].tsx` | |
| `/live-exam` | `app/(app)/exam/live/[examId].tsx` | |
| `/result-analysis` | `app/(app)/exam/result/[examId].tsx` | |
| `/records` | `app/(app)/home/records.tsx` | |
| `/profile` | `app/(app)/profile/index.tsx` | |
| `/question-search` | `app/(app)/question-search.tsx` | |
| `/ai-search` | `app/(app)/ai-search.tsx` | |
| `/micro-practice` | `app/(app)/micro-practice.tsx` | |
| `/paywall` | `app/(app)/paywall.tsx` | |
| `/bkash-payment` | `app/(app)/bkash-payment.tsx` | |
| — | `app/(app)/rocket-payment.tsx` | New (Agent 17) |
| — | `app/(app)/nagad-payment.tsx` | New (Agent 17) |
| — | `app/(auth)/phone-login.tsx` | New (Agent 17) |
