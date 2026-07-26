export const MAX_THREAD_BODY_LENGTH = 2000;

export type SubjectType = "part" | "combo" | "event";

export interface Thread {
  id: string;
  subjectType: SubjectType;
  subjectId: string;
  authorId: string;
  body: string;
  createdAt: string;
  hiddenAt: string | null;
}

export function parseThreadBody(body: string): string {
  const normalized = body.trim();
  if (normalized.length === 0) throw new Error("Thread body cannot be empty");
  if (normalized.length > MAX_THREAD_BODY_LENGTH) {
    throw new Error(`Thread body cannot exceed ${MAX_THREAD_BODY_LENGTH} characters`);
  }
  return normalized;
}

export function canDeleteThread(thread: Thread, userId: string): boolean {
  return thread.authorId === userId && thread.hiddenAt === null;
}

export function canPostThread(
  threads: Thread[],
  authorId: string,
  now: string | Date,
  cooldownMs: number,
) {
  const nowMs = new Date(now).getTime();
  const latest = threads
    .filter((thread) => thread.authorId === authorId && thread.hiddenAt === null)
    .map((thread) => new Date(thread.createdAt).getTime())
    .filter(Number.isFinite)
    .reduce((max, timestamp) => Math.max(max, timestamp), Number.NEGATIVE_INFINITY);

  if (Number.isFinite(nowMs) && Number.isFinite(latest) && nowMs - latest < cooldownMs) {
    return { allowed: false, reason: "Please wait before posting again." } as const;
  }
  return { allowed: true } as const;
}
