import type { SubjectType, Thread } from "./rules.ts";

export interface SubjectDescriptor {
  type: SubjectType;
  id: string;
  name: string;
  href: string;
}

export interface DiscussionFeedItem {
  thread: Thread;
  subject: SubjectDescriptor;
}

/** Returns a quiet, subject-oriented feed rather than a forum-shaped stream. */
export function latestThreadsBySubject(
  threads: Thread[],
  subjects: SubjectDescriptor[],
  subjectType?: SubjectType,
): DiscussionFeedItem[] {
  const subjectByKey = new Map(subjects.map((subject) => [`${subject.type}:${subject.id}`, subject]));
  const latest = new Map<string, DiscussionFeedItem>();

  for (const thread of threads) {
    if (thread.hiddenAt !== null || (subjectType && thread.subjectType !== subjectType)) continue;
    const subject = subjectByKey.get(`${thread.subjectType}:${thread.subjectId}`);
    if (!subject) continue;

    const key = `${thread.subjectType}:${thread.subjectId}`;
    const current = latest.get(key);
    if (!current || new Date(thread.createdAt).getTime() > new Date(current.thread.createdAt).getTime()) {
      latest.set(key, { thread, subject });
    }
  }

  return [...latest.values()].sort(
    (a, b) => new Date(b.thread.createdAt).getTime() - new Date(a.thread.createdAt).getTime(),
  );
}
