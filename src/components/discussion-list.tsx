import type { Thread } from "@/lib/discussion/rules.ts";

export interface DiscussionListLabels {
  heading: string;
  emptyHeading: string;
  emptyBody: string;
  postedBy: string;
  noAuthor: string;
  at: string;
}

export function DiscussionList({
  threads,
  authorNames,
  labels,
}: {
  threads: Thread[];
  authorNames: Record<string, string>;
  labels: DiscussionListLabels;
}) {
  const visibleThreads = threads.filter((thread) => thread.hiddenAt === null);
  if (visibleThreads.length === 0) {
    return (
      <section aria-labelledby="discussion-empty-heading">
        <h2 id="discussion-empty-heading">{labels.emptyHeading}</h2>
        <p>{labels.emptyBody}</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="discussion-heading">
      <h2 id="discussion-heading">{labels.heading}</h2>
      <ol>
        {visibleThreads.map((thread) => (
          <li key={thread.id}>
            <p>{thread.body}</p>
            <p>
              {labels.postedBy} {authorNames[thread.authorId] ?? labels.noAuthor} {labels.at}{" "}
              <time dateTime={thread.createdAt}>{thread.createdAt}</time>
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
