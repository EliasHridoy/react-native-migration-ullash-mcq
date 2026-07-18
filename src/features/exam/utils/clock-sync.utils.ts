import { supabase } from '@/core/supabase/client';
import { SupabaseConstants } from '@/core/constants/supabase.constants';

/**
 * 3-sample median clock sync to filter network jitter.
 * Mirrors: sync_clock.dart
 */
export async function syncClock(): Promise<number> {
  const offsets: number[] = [];

  for (let i = 0; i < 3; i++) {
    const clientBefore = Date.now();
    const { data, error } = await supabase.rpc(SupabaseConstants.rpcGetServerTime);
    const clientAfter = Date.now();

    if (error) throw error;

    const serverTime = new Date(data).getTime();
    const rtt = clientAfter - clientBefore;
    const offset = serverTime + rtt / 2 - clientAfter;
    offsets.push(offset);
  }

  // Return median
  const sorted = [...offsets].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export function getServerTime(clientOffset: number): number {
  return Date.now() + clientOffset;
}
