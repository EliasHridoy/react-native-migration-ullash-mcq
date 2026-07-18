export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  finalRankValue: number;
  examId?: string;
}

export type LeaderboardTab = 'global' | 'exam';
