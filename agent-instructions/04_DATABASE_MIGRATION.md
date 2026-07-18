# 04 — Database Migration (Agent 4)

> **Agent:** Agent 4  
> **Prerequisite:** None (can run parallel to Agent 1-3)  
> **Output:** Verified Supabase schema, TypeScript database types, connection test

---

## ⚠️ IMPORTANT: NO DATABASE CHANGES REQUIRED

> [!IMPORTANT]
> **The Supabase database is 100% reused. All 12 migrations have already been applied.**
> This agent's job is to:
> 1. Verify the schema is intact
> 2. Generate TypeScript types from the Supabase schema
> 3. Document any new migrations needed for pending features

---

## 📋 Tasks

- [ ] Verify all 12 migrations are applied (read-only check)
- [ ] Generate TypeScript database types via Supabase CLI
- [ ] Create `src/core/supabase/database.types.ts`
- [ ] Document pending database migrations for unimplemented features
- [ ] Verify Edge Functions are deployed

---

## 🛠️ Implementation

### Step 1: Verify Schema

Connect to Supabase and verify these tables exist:

```sql
-- Run this in Supabase SQL Editor to verify all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- `boards`
- `bkash_transactions`
- `chapters`
- `exams`
- `exam_question_list`
- `hint_usage`
- `leaderboard_snapshots`
- `material_topic_map`
- `micro_practice_queue`
- `options`
- `profiles`
- `question_hierarchy_map`
- `question_origin_map`
- `question_status`
- `questions`
- `study_materials`
- `subjects`
- `subscription_events`
- `topics`
- `user_exam_results`
- `user_exam_sessions`
- `user_weakness_gaps`

---

### Step 2: Verify RPCs

```sql
-- Verify all stored procedures/RPCs
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

Expected RPCs:
- `get_server_time()`
- `submit_exam_session()`
- `calculate_exam_score()`
- `get_entitlement_status()`
- `upsert_subscription()`
- `upsert_bkash_payment()`
- `get_bkash_transactions()`
- `semantic_search_materials()`
- `get_weakness_heatmap()`

---

### Step 3: Generate TypeScript Types

Install Supabase CLI if not installed:
```bash
npm install -g supabase
```

Generate types (from within the project root, pointing at your Supabase project):
```bash
npx supabase gen types typescript \
  --project-id bmqdmanvpbrerlgisald \
  --schema public \
  > src/core/supabase/database.types.ts
```

This generates a `Database` TypeScript interface from the live schema.

Then update the Supabase client to use typed generics:

**`src/core/supabase/client.ts`** (update):
```typescript
import { Database } from './database.types';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  // ...same config
});
```

---

### Step 4: Typed Helper Types

**`src/core/supabase/types.ts`**
```typescript
import { Database } from './database.types';

// Table row types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Board = Database['public']['Tables']['boards']['Row'];
export type Subject = Database['public']['Tables']['subjects']['Row'];
export type Chapter = Database['public']['Tables']['chapters']['Row'];
export type Topic = Database['public']['Tables']['topics']['Row'];
export type Question = Database['public']['Tables']['questions']['Row'];
export type Option = Database['public']['Tables']['options']['Row'];
export type Exam = Database['public']['Tables']['exams']['Row'];
export type ExamQuestionList = Database['public']['Tables']['exam_question_list']['Row'];
export type UserExamResult = Database['public']['Tables']['user_exam_results']['Row'];
export type UserExamSession = Database['public']['Tables']['user_exam_sessions']['Row'];
export type QuestionStatus = Database['public']['Tables']['question_status']['Row'];
export type LeaderboardSnapshot = Database['public']['Tables']['leaderboard_snapshots']['Row'];
export type StudyMaterial = Database['public']['Tables']['study_materials']['Row'];
export type BkashTransaction = Database['public']['Tables']['bkash_transactions']['Row'];
export type UserWeaknessGap = Database['public']['Tables']['user_weakness_gaps']['Row'];
export type MicroPracticeQueue = Database['public']['Tables']['micro_practice_queue']['Row'];

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
```

---

### Step 5: Verify Edge Functions

Check that these Edge Functions are deployed in Supabase:

```bash
# List deployed functions
npx supabase functions list --project-ref bmqdmanvpbrerlgisald
```

Expected functions:
- `generate-hint`
- `semantic-search`
- `embed-material`
- `revenuecat-webhook`
- `bkash-payment`

> [!NOTE]
> Edge Functions do NOT need to be redeployed. They are backend-only and work with any client.

---

### Step 6: Verify pgvector Extension

```sql
-- Verify pgvector is installed (needed for AI search)
SELECT * FROM pg_extension WHERE extname = 'vector';
```

Expected: 1 row with `extname = 'vector'`

---

## 📋 Pending Database Migrations

These features from `FEATURE_TRACKER.md` are **NOT YET IMPLEMENTED** and may need DB changes:

### 6.2.1 — Rocket MFS Integration (📋 Planned)
> When implementing: Create `rocket_transactions` table similar to `bkash_transactions`

### 6.2.3 — Nagad MFS Integration (📋 Planned)
> When implementing: Create `nagad_transactions` table with signature key fields

### 7.1 — Dynamic PDF Watermarking (💡 Ideation)
> When implementing: No DB change needed; backend PDF processing logic in Edge Function

### 7.2 — Signed URL Expiry 60s (📋 Planned)
> **Already implemented** in `study_material` datasource — 60s signed URLs are generated

### 7.3 — Sentry SDK (📋 Planned)
> Client-side only. No DB change needed.

### 8.x — Testing (📋 Planned)
> No DB changes needed. Tests run against existing schema.

---

## 🗄️ Database Schema Summary (Reference)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User profile | id, full_name, email, board_id, subscription_status, entitlement_expires_at |
| `boards` | Academic boards (SSC/HSC/BCS) | id, name, category |
| `subjects` | Subjects per board | id, name, board_id |
| `chapters` | Chapters per subject | id, name, subject_id |
| `topics` | Topics per chapter | id, name, chapter_id |
| `questions` | MCQ questions | id, text, difficulty_level, explanation |
| `options` | MCQ options | id, question_id, option_text, is_correct, serial_no |
| `question_hierarchy_map` | question→topic→chapter→subject mapping | question_id, topic_id, chapter_id, subject_id |
| `question_origin_map` | question→board+year mapping | question_id, board_id, exam_year, exam_type |
| `exams` | Live exam configs | id, title, start_time, end_time, status |
| `exam_question_list` | Questions assigned to exams | exam_id, question_id, display_order |
| `user_exam_sessions` | Per-user live exam state | exam_id, user_id, question_order, selected_answers, submitted |
| `user_exam_results` | Scored results | exam_id, user_id, score, rank_value, topic_results JSONB |
| `question_status` | Practice progress tracking | question_id, user_id, is_completed |
| `leaderboard_snapshots` | Top 100 ranks (5-min snapshots) | exam_id, user_id, rank, score |
| `study_materials` | PDFs, videos, audio | id, title, material_type, storage_path, is_premium, embedding vector(768) |
| `material_topic_map` | material→topic mapping | material_id, topic_id |
| `hint_usage` | AI hint tracking | question_id, user_id, hint_count |
| `subscription_events` | RevenueCat webhook audit | revenuecat_event_id, user_id, event_type |
| `bkash_transactions` | bKash payment records | payment_id, user_id, amount, status, merchant_invoice_number |
| `user_weakness_gaps` | Diagnosed weak topics | user_id, topic_id, accuracy, priority, resolved |
| `micro_practice_queue` | Pending remedial practice | user_id, topic_id, scheduled_at, completed |

---

## ✅ Completion Checklist

- [ ] All 22 expected tables confirmed in Supabase
- [ ] All 9 RPCs confirmed in Supabase
- [ ] TypeScript types generated at `src/core/supabase/database.types.ts`
- [ ] `src/core/supabase/types.ts` convenience types created
- [ ] Supabase client updated to use `Database` generic
- [ ] All 5 Edge Functions confirmed deployed
- [ ] `pgvector` extension confirmed installed
- [ ] Pending features documented with DB notes

---

## 🔗 Next: [05_AUTH_FEATURE.md](./05_AUTH_FEATURE.md)
