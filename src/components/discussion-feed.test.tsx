import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DiscussionFeedItem } from "@/lib/discussion/feed.ts";
import { DiscussionFeed } from "./discussion-feed.tsx";

const items: DiscussionFeedItem[] = [
  {
    thread: {
      id: "thread-1",
      subjectType: "part",
      subjectId: "dran-sword",
      authorId: "user-1",
      body: "A useful observation",
      createdAt: "2026-07-26T12:00:00.000Z",
      hiddenAt: null,
    },
    subject: { type: "part", id: "dran-sword", name: "Dran Sword", href: "/parts/dran-sword#discussion" },
  },
  {
    thread: {
      id: "thread-2",
      subjectType: "event",
      subjectId: "event-1",
      authorId: "user-2",
      body: "Event note",
      createdAt: "2026-07-26T11:00:00.000Z",
      hiddenAt: null,
    },
    subject: { type: "event", id: "event-1", name: "Taipei G3", href: "/events#event-1" },
  },
];

const labels = {
  heading: "Latest discussion",
  filterLabel: "Subject type",
  all: "All",
  part: "Parts",
  combo: "Combos",
  event: "Events",
  emptyHeading: "No discussion yet",
  emptyBody: "Conversations will appear beside the data they explain.",
};

describe("DiscussionFeed", () => {
  it("filters visible discussion by Subject type and links back to its data", () => {
    render(<DiscussionFeed items={items} labels={labels} />);

    expect(screen.getByText("A useful observation")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dran Sword" })).toHaveAttribute(
      "href",
      "/parts/dran-sword#discussion",
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Subject type" }), {
      target: { value: "event" },
    });
    expect(screen.queryByText("A useful observation")).not.toBeInTheDocument();
    expect(screen.getByText("Event note")).toBeInTheDocument();
  });
});
