import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ExternalLink } from "./external-link.tsx";

describe("ExternalLink", () => {
  afterEach(cleanup);

  it("renders an ingested retailer URL as a link", () => {
    render(<ExternalLink href="https://www.funbox.com.tw/products/bx-01" newTab>去看看</ExternalLink>);
    const link = screen.getByRole("link", { name: "去看看" });
    expect(link).toHaveAttribute("href", "https://www.funbox.com.tw/products/bx-01");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("degrades a script URL to plain text instead of an executable link", () => {
    render(<ExternalLink href="javascript:alert(document.cookie)">來源</ExternalLink>);
    expect(screen.queryByRole("link")).toBeNull();
    // The row stays visible: a poisoned source should be noticed, not hidden.
    expect(screen.getByText("來源")).toBeTruthy();
  });

  it("keeps citation links in the same tab", () => {
    render(<ExternalLink href="https://hackmd.io/@player/note">HackMD</ExternalLink>);
    expect(screen.getByRole("link", { name: "HackMD" })).not.toHaveAttribute("target");
  });
});
