import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DetailDialog, DetailDialogActions } from "./detail-dialog.tsx";

const back = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back }),
}));

describe("DetailDialog", () => {
  afterEach(() => {
    cleanup();
    back.mockClear();
  });

  it("names itself by the record heading and closes by going back", () => {
    render(
      <DetailDialog closeLabel="關閉" labelledBy="dialog-heading">
        <h2 id="dialog-heading">蒼龍神劍</h2>
        <DetailDialogActions>
          <a href="https://example.test/parts/dran-sword">開啟完整頁面</a>
        </DetailDialogActions>
      </DetailDialog>,
    );

    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog).toHaveAttribute("aria-labelledby", "dialog-heading");
    expect(screen.getByRole("link", { name: "開啟完整頁面", hidden: true })).toHaveAttribute("href", "https://example.test/parts/dran-sword");

    fireEvent.click(screen.getByRole("button", { name: "關閉", hidden: true }));
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("follows a native close (Escape) with the same navigation, once", () => {
    render(
      <DetailDialog closeLabel="Close" labelledBy="h">
        <h2 id="h">Accel</h2>
      </DetailDialog>,
    );

    const dialog = screen.getByRole("dialog", { hidden: true });
    fireEvent(dialog, new Event("close"));
    fireEvent.click(screen.getByRole("button", { name: "Close", hidden: true }));
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("treats a click on the backdrop as a close and a click inside as nothing", () => {
    render(
      <DetailDialog closeLabel="Close" labelledBy="h">
        <h2 id="h">Accel</h2>
      </DetailDialog>,
    );

    fireEvent.click(screen.getByRole("heading", { name: "Accel", hidden: true }));
    expect(back).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("dialog", { hidden: true }));
    expect(back).toHaveBeenCalledTimes(1);
  });
});
