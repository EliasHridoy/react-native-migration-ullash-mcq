export const AppConstants = {
  // App Info
  appName: 'Ullash Live MCQ',
  packageName: 'com.livemcq.live_exam',

  // Supabase (read from env)
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,

  // Exam Rules
  defaultPenaltyFactor: 0.25,      // Wrong answer deduction
  submissionGraceWindowSecs: 30,   // 30s after exam end
  clockSyncSampleCount: 3,         // 3-sample median for clock sync

  // Question Status
  completedThreshold: 0.6,         // 60% correct = mastered

  // Pedagogy
  weaknessThreshold: 0.6,          // Below 60% → weakness gap
  microPracticeMinQuestions: 5,

  // AI Tutor
  maxHintsPerQuestion: 3,          // Free hint limit per question
  hintRateLimitMinutes: 5,
  semanticSimilarityThreshold: 0.35,

  // bKash Payments
  bkashAmountMonthly: 99.00,       // BDT
  bkashAmountAnnual: 799.00,       // BDT
  bkashIpnAmountTolerance: 0.01,   // 1 paisa tolerance

  // RevenueCat
  revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
  revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
  premiumEntitlementId: 'premium',

  // Subscription
  gracePeriodDays: 3,
} as const;
