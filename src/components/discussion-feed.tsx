"use client";

import { useState } from "react";
import type { DiscussionFeedItem } from "@/lib/discussion/feed.ts";
import type { SubjectType } from "@/lib/discussion/rules.ts";

export interface DiscussionFeedLabels {
  heading: string;
  filterLabel: string;
  all: string;
  part: string;
  combo: string;
  event: string;
  emptyHeading: string;
  emptyBody: string;
}

export function DiscussionFeed({ items, labels }: { items: DiscussionFeedItem[]; labels: DiscussionFeedLabels }) {
  const [filter, setFilter] = useState<SubjectType | "all">("all");
  const visible = filter === "all" ? items : items.filter((item) => item.subject.type === filter);

  return (
    <section aria-labelledby="latest-discussion-heading">
      <h2 id="latest-discussion-heading">{labels.heading}</h2>
      <label htmlFor="discussion-subject-filter">
        {labels.filterLabel}
        <select
          id="discussion-subject-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value as SubjectType | "all")}
        >
          <option value="all">{labels.all}</option>
          <option value="part">{labels.part}</option>
          <option value="combo">{labels.combo}</option>
          <option value="event">{labels.event}</option>
        </select>
      </label>

      {visible.length === 0 ? (
        <div>
          <h3>{labels.emptyHeading}</h3>
          <p>{labels.emptyBody}</p>
        </div>
      ) : (
        <ol>
          {visible.map(({ thread, subject }) => (
            <li key={thread.id}>
              <p>
                <a href={subject.href}>{subject.name}</a>
              </p>
              <p>{thread.body}</p>
              <time dateTime={thread.createdAt}>{thread.createdAt}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
