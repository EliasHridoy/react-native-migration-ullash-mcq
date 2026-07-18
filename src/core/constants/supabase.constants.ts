export const SupabaseConstants = {
  // Tables
  profilesTable: 'profiles',
  boardsTable: 'boards',
  subjectsTable: 'subjects',
  chaptersTable: 'chapters',
  topicsTable: 'topics',
  questionsTable: 'questions',
  optionsTable: 'options',
  questionHierarchyMapTable: 'question_hierarchy_map',
  questionOriginMapTable: 'question_origin_map',
  examsTable: 'exams',
  examQuestionListTable: 'exam_question_list',
  userExamResultsTable: 'user_exam_results',
  userExamSessionsTable: 'user_exam_sessions',
  questionStatusTable: 'question_status',
  leaderboardSnapshotsTable: 'leaderboard_snapshots',
  studyMaterialsTable: 'study_materials',
  materialTopicMapTable: 'material_topic_map',
  hintUsageTable: 'hint_usage',
  subscriptionEventsTable: 'subscription_events',
  bkashTransactionsTable: 'bkash_transactions',
  rocketTransactionsTable: 'rocket_transactions',
  nagadTransactionsTable: 'nagad_transactions',
  userWeaknessGapsTable: 'user_weakness_gaps',
  microPracticeQueueTable: 'micro_practice_queue',

  // Storage Buckets
  profileAvatarsBucket: 'profile-avatars',
  studyMaterialsBucket: 'study-materials',

  // Realtime Channels
  examChannel: (examId: string) => `exam:${examId}`,

  // Realtime Events
  examStartedEvent: 'exam_started',
  examEndedEvent: 'exam_ended',
  examTimeWarningEvent: 'time_warning',

  // Edge Function Slugs
  generateHintFunction: 'generate-hint',
  semanticSearchFunction: 'semantic-search',
  embedMaterialFunction: 'embed-material',
  revenuecatWebhookFunction: 'revenuecat-webhook',
  bkashPaymentFunction: 'bkash-payment',
  rocketPaymentFunction: 'rocket-payment',
  nagadPaymentFunction: 'nagad-payment',

  // RPCs
  rpcGetServerTime: 'get_server_time',
  rpcSubmitExamSession: 'submit_exam_session',
  rpcGetEntitlementStatus: 'get_entitlement_status',
  rpcUpsertSubscription: 'upsert_subscription',
  rpcUpsertBkashPayment: 'upsert_bkash_payment',
  rpcGetBkashTransactions: 'get_bkash_transactions',
  rpcSemanticSearchMaterials: 'semantic_search_materials',
  rpcGetWeaknessHeatmap: 'get_weakness_heatmap',
} as const;
