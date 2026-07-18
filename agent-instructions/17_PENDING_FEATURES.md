# 17 — Pending Features (Agent 17)

> **Agent:** Agent 17  
> **Prerequisite:** Agents 1–16 complete  
> **Source:** FEATURE_TRACKER.md + memory.md — all `📋 Planned` and `💡 Ideation` items  
> **Output:** Implement unfinished features from the original Flutter tracker

---

## 📋 Pending Features Summary

These features were **NOT implemented** in the Flutter app. They must be built fresh in React Native.

| # | Feature | Status in Flutter | Phase |
|---|---------|-------------------|-------|
| 1.1.4 | OTP-based mobile login | 💡 Ideation | Phase 1 |
| 6.2.1 | Rocket MFS integration | 📋 Planned | Phase 6 |
| 6.2.3 | Nagad MFS integration | 📋 Planned | Phase 6 |
| 7.1 | Dynamic PDF watermarking | 💡 Ideation | Phase 7 |
| 7.2 | Signed URL expiry (60s) | 📋 Planned | Phase 7 |
| 7.3 | Sentry SDK for monitoring | 📋 Planned | Phase 7 |
| 8.1 | Unit tests — scoring engine | 📋 Planned | Phase 8 |
| 8.2 | Integration tests — auth flow | 📋 Planned | Phase 8 |
| 8.3 | Widget/component tests | 📋 Planned | Phase 8 |
| 8.4 | Load test — 10k concurrent | 📋 Planned | Phase 8 |

---

## 🛠️ Implementation Guide per Feature

---

### 1.1.4 — OTP-Based Mobile Login

**Priority:** Medium  
**Status:** Post-launch ideation in Flutter

**Implementation in React Native:**

1. Add phone login to Supabase Auth:
```typescript
// src/features/auth/api/auth.api.ts — add method:
async signInWithPhone(phone: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    phone: phone, // Format: +8801XXXXXXXXX
  });
  if (error) throw error;
},

async verifyOtp(phone: string, token: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
  if (error) throw error;
  return mapToAuthUser(data.user!);
},
```

2. Create `app/(auth)/phone-login.tsx`:
   - Phone number input with `+880` prefix
   - "Send OTP" button → calls `signInWithPhone`
   - OTP input (6 digits, auto-focus each box) on next step
   - "Verify" button → calls `verifyOtp`

3. Add "Login with Phone" button to Login screen

**Database:** No migration needed — Supabase Auth handles SMS OTP natively.

**Note:** Requires Twilio or similar SMS provider configured in Supabase dashboard.

---

### 6.2.1 — Rocket MFS Integration

**Priority:** High (BD market)  
**Status:** Planned

**Implementation Steps:**

1. **Create Supabase Edge Function** `rocket-payment/index.ts`:
   - Follow same pattern as `bkash-payment/index.ts`
   - Rocket API docs: https://sandbox.rocket-ipg.com/
   - Actions: `create`, `execute`, `query`

2. **Create DB migration** `013_rocket_payments.sql`:
```sql
CREATE TABLE rocket_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  plan_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BDT' NOT NULL,
  payment_id TEXT UNIQUE,       -- Idempotency key
  transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rocket_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own transactions
CREATE POLICY "Users read own rocket transactions"
  ON rocket_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- SECURITY DEFINER RPC for server-side writes
CREATE OR REPLACE FUNCTION upsert_rocket_payment(
  p_user_id UUID,
  p_plan_id TEXT,
  p_amount DECIMAL,
  p_payment_id TEXT,
  p_transaction_id TEXT,
  p_status TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO rocket_transactions (user_id, plan_id, amount, payment_id, transaction_id, status)
  VALUES (p_user_id, p_plan_id, p_amount, p_payment_id, p_transaction_id, p_status)
  ON CONFLICT (payment_id) DO UPDATE
    SET status = p_status, transaction_id = p_transaction_id, updated_at = NOW();
END;
$$;
```

3. **React Native files to create:**
   - `src/features/payment/types/rocket.types.ts`
   - `src/features/payment/api/rocket.api.ts`
   - `src/features/payment/store/rocket-payment.store.ts`
   - `app/(app)/rocket-payment.tsx`
   - `src/features/payment/components/RocketTransactionList.tsx`

4. **Add "Pay with Rocket" button** to `PaywallScreen`

5. **Set Edge Function secrets:**
```bash
supabase secrets set ROCKET_API_KEY=your_key
supabase secrets set ROCKET_API_SECRET=your_secret
supabase secrets set ROCKET_MERCHANT_ID=your_merchant_id
```

---

### 6.2.3 — Nagad MFS Integration

**Priority:** High (BD market)  
**Status:** Planned

**Implementation Steps:**

1. **Create Supabase Edge Function** `nagad-payment/index.ts`:
   - Nagad uses RSA signature-based authentication
   - Required: `PGP_PUBLIC_KEY`, `MERCHANT_PRIVATE_KEY`, `MERCHANT_ID`
   - API docs: https://nagad.com.bd/api-doc

2. **Create DB migration** `014_nagad_payments.sql`:
   - Same pattern as Rocket: `nagad_transactions` table + SECURITY DEFINER RPC

3. **Signature Key generation in Edge Function:**
```typescript
// Nagad requires RSA+PGP encryption for sensitive data
// Use crypto module in Deno Edge Function
import { createSign } from "node:crypto";

function signData(data: string, privateKey: string): string {
  const sign = createSign('RSA-SHA256');
  sign.update(data);
  return sign.sign(privateKey, 'base64');
}
```

4. **React Native files to create:**
   - `src/features/payment/types/nagad.types.ts`
   - `src/features/payment/api/nagad.api.ts`
   - `src/features/payment/store/nagad-payment.store.ts`
   - `app/(app)/nagad-payment.tsx`

5. **IPN Validation** — Verify signature on callback using merchant public key

---

### 7.1 — Dynamic PDF Watermarking

**Priority:** Low  
**Status:** Ideation

**Implementation:**

1. **Create Supabase Edge Function** `watermark-pdf/index.ts`:
```typescript
// Use pdf-lib (Deno compatible) to inject watermark
import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib';

Deno.serve(async (req) => {
  const { storage_path, user_id } = await req.json();
  
  // Fetch PDF from storage
  const { data } = await supabase.storage
    .from('study-materials')
    .download(storage_path);
  
  // Inject watermark
  const pdfBytes = await data!.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const watermarkText = `${user_id.substring(0, 8)} • ${new Date().toISOString().split('T')[0]}`;
  
  for (const page of pdfDoc.getPages()) {
    page.drawText(watermarkText, {
      x: 50, y: 50,
      size: 10, font,
      color: rgb(0.8, 0.8, 0.8),
      opacity: 0.3,
    });
  }
  
  const watermarkedBytes = await pdfDoc.save();
  
  // Return as signed URL or stream
  return new Response(watermarkedBytes, {
    headers: { 'Content-Type': 'application/pdf' }
  });
});
```

2. **In `studyMaterialApi.ts`:** For premium PDFs, call `watermark-pdf` Edge Function instead of `createSignedUrl`

---

### 7.2 — Signed URL Expiry Verification

**Priority:** Low  
**Status:** Already implemented in `study_material_remote_datasource.dart`

**Status:** ✅ Already implemented in `09_STUDY_MATERIALS.md`
- `studyMaterialApi.getMaterialUrl()` uses `createSignedUrl(path, 60)` — 60 seconds
- No additional work needed

---

### 7.3 — Sentry SDK Integration

**Priority:** Medium  
**Status:** Planned

**Implementation:**

```bash
npm install @sentry/react-native
npx expo install expo-application
```

Initialize in `app/_layout.tsx`:
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.ReactNativeTracing({
      routingInstrumentation: new Sentry.ExpoRouterInstrumentation(),
    }),
  ],
});
```

Add to `.env.example`:
```bash
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

Wrap root with Sentry:
```typescript
export default Sentry.wrap(RootLayout);
```

**Error boundaries in screens:**
```tsx
// Wrap critical screens:
<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
  <LiveExamScreen />
</Sentry.ErrorBoundary>
```

---

### 8.1 — Unit Tests (Scoring Engine)

**Priority:** High  
**Status:** 0% complete in Flutter

**Setup:**
```bash
npm install --save-dev jest @types/jest ts-jest
```

**`src/core/utils/__tests__/scoring.utils.test.ts`**
```typescript
import { calculateScore, calculateFinalRankValue, generateWeaknessVector } from '../scoring.utils';

describe('calculateScore', () => {
  it('returns correct - wrong * 0.25', () => {
    expect(calculateScore({ correctAnswers: 10, wrongAnswers: 4 })).toBe(9);
  });

  it('handles zero wrong answers', () => {
    expect(calculateScore({ correctAnswers: 5, wrongAnswers: 0 })).toBe(5);
  });

  it('handles custom penalty factor', () => {
    expect(calculateScore({ correctAnswers: 10, wrongAnswers: 4, penaltyFactor: 0.5 })).toBe(8);
  });
});

describe('calculateFinalRankValue', () => {
  it('adds tie-breaker bonus', () => {
    const score = calculateFinalRankValue({
      correctAnswers: 10, wrongAnswers: 0,
      timeTakenSeconds: 30, totalTimeSeconds: 60,
    });
    expect(score).toBe(10.5); // 10 + (1 - 0.5)
  });

  it('guards against zero total time', () => {
    const score = calculateFinalRankValue({
      correctAnswers: 10, wrongAnswers: 0,
      timeTakenSeconds: 30, totalTimeSeconds: 0,
    });
    expect(score).toBe(10);
  });
});

describe('generateWeaknessVector', () => {
  it('filters topics below 60% threshold', () => {
    const topics = [
      { topicId: '1', topicName: 'A', correct: 3, incorrect: 7, unanswered: 0 }, // 30%
      { topicId: '2', topicName: 'B', correct: 7, incorrect: 3, unanswered: 0 }, // 70%
      { topicId: '3', topicName: 'C', correct: 0, incorrect: 0, unanswered: 5 }, // 0/0 → skip
    ];
    const weak = generateWeaknessVector(topics);
    expect(weak).toHaveLength(1);
    expect(weak[0].topicId).toBe('1');
  });
});
```

---

### 8.2 — Integration Tests (Auth Flow)

**Priority:** Medium  

```typescript
// src/features/auth/__tests__/auth.integration.test.ts
// Tests require actual Supabase credentials via env vars
// Skip in CI if EXPO_PUBLIC_SUPABASE_URL not set

describe.skipIf(!process.env.EXPO_PUBLIC_SUPABASE_URL)('Auth Integration', () => {
  it('rejects invalid credentials', async () => {
    await expect(authApi.signInWithEmail('invalid@test.com', 'wrong')).rejects.toThrow();
  });
});
```

---

### 8.3 — Component Tests

**Priority:** Medium  

```bash
npm install --save-dev @testing-library/react-native
```

```typescript
// src/components/__tests__/GradientButton.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { GradientButton } from '../GradientButton';

test('calls onPress when tapped', () => {
  const mockPress = jest.fn();
  const { getByText } = render(<GradientButton label="Test" onPress={mockPress} />);
  fireEvent.press(getByText('Test'));
  expect(mockPress).toHaveBeenCalled();
});

test('does not call onPress when disabled', () => {
  const mockPress = jest.fn();
  const { getByText } = render(<GradientButton label="Test" onPress={mockPress} disabled />);
  fireEvent.press(getByText('Test'));
  expect(mockPress).not.toHaveBeenCalled();
});
```

---

### 8.4 — Load Testing (10k Concurrent)

**Priority:** Low — post-launch  

Use `k6` to load test the Supabase backend:

```javascript
// scripts/load-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 1000 },
    { duration: '5m', target: 10000 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<150'],    // < 150ms API latency
    http_req_failed: ['rate<0.001'],      // < 0.1% failure
  },
};

export default function() {
  const res = http.get('https://bmqdmanvpbrerlgisald.supabase.co/rest/v1/boards', {
    headers: { apikey: __ENV.ANON_KEY },
  });
  check(res, { 'status 200': r => r.status === 200 });
}
```

---

## ✅ Completion Checklist

- [ ] 1.1.4 — Phone OTP login screen + Supabase OTP flow
- [ ] 6.2.1 — Rocket MFS: DB migration + Edge Function + RN screen
- [ ] 6.2.3 — Nagad MFS: DB migration + Edge Function + RN screen
- [ ] 7.1 — PDF watermarking Edge Function (optional, low priority)
- [ ] 7.2 — Signed URLs ✅ (already done in Agent 9)
- [ ] 7.3 — Sentry SDK initialized in `_layout.tsx`
- [ ] 8.1 — Scoring engine unit tests pass
- [ ] 8.2 — Auth integration test file created
- [ ] 8.3 — Component tests for `GradientButton`, `SubscriptionGate`, `GlassCard`
- [ ] 8.4 — k6 load test script created in `scripts/load-test.js`

---

## 🎉 Migration Complete!

After Agent 17 completes, the full React Native app mirrors all Flutter functionality with the following additions:
- Rocket MFS payment
- Nagad MFS payment
- OTP mobile login
- Sentry monitoring
- Full test coverage
