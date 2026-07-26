import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Thread } from "@/lib/discussion/rules.ts";
import { DiscussionList } from "./discussion-list.tsx";

const thread: Thread = {
  id: "thread-1",
  subjectType: "part",
  subjectId: "dran-sword",
  authorId: "user-1",
  body: "This batch feels different in play.",
  createdAt: "2026-07-26T12:00:00.000Z",
  hiddenAt: null,
};

describe("DiscussionList", () => {
  it("renders a visible Thread with its author and date", () => {
    render(
      <DiscussionList
        threads={[thread]}
        authorNames={{ "user-1": "Mina" }}
        labels={{ heading: "Discussion", emptyHeading: "Start the discussion", emptyBody: "Share an observation.", postedBy: "Posted by", noAuthor: "Player", at: "at" }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Discussion" })).toBeInTheDocument();
    expect(screen.getByText("This batch feels different in play.")).toBeInTheDocument();
    expect(screen.getByText(/Posted by Mina/)).toBeInTheDocument();
  });

  it("invites the first useful contribution when there are no Threads", () => {
    render(
      <DiscussionList
        threads={[]}
        authorNames={{}}
        labels={{ heading: "Discussion", emptyHeading: "Start the discussion", emptyBody: "Share an observation.", postedBy: "Posted by", noAuthor: "Player", at: "at" }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Start the discussion" })).toBeInTheDocument();
    expect(screen.getByText("Share an observation.")).toBeInTheDocument();
  });
});
