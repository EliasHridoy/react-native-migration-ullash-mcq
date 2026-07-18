/**
 * Deterministic seeded shuffle using mulberry32 PRNG.
 * Same seed → same order, ensures reproducibility on reconnect.
 */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function seededShuffle<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  const rand = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Creates a deterministic seed from userId + sessionId
 * so the same user always gets the same question order.
 */
export function createExamSeed(userId: string, sessionId: string): number {
  return hashCode(userId + sessionId);
}

/**
 * Shuffles questions and their options (independently seeded per question).
 */
export function shuffleExamQuestions<Q extends { id: string; options: any[] }>(
  questions: Q[],
  seed: number,
): Q[] {
  const shuffledQuestions = seededShuffle(questions, seed);
  return shuffledQuestions.map((q) => ({
    ...q,
    options: seededShuffle(q.options, seed ^ hashCode(q.id)),
  }));
}
