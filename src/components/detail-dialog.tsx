"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CloseIcon } from "./ui-icons.tsx";
import styles from "./detail-dialog.module.css";

/**
 * The catalog's detail dialog: the row a reader clicked, opened as a card
 * over the list they were reading.
 *
 * It is a native `<dialog>` opened with `showModal()`, which is what gives
 * it the top layer (above the phone navigation pill), focus containment,
 * and Escape — none of that is reimplemented here. The URL underneath is
 * the record's real detail path (an intercepting route renders this), so
 * closing is simply going back: the list returns with its filters, page and
 * scroll position exactly as they were, and a reload of the same URL lands
 * on the full page.
 *
 * No entrance animation on purpose. The anti-slop contract forbids
 * `opacity: 0` and `translateY()` outside scroll-driven reveals, and a
 * dialog that pops into place reads as a card that was already there.
 */
export function DetailDialog({
  children,
  closeLabel,
  labelledBy,
}: {
  children: React.ReactNode;
  closeLabel: string;
  labelledBy: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const leaving = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    // jsdom has no `showModal`; the test renders the open state statically.
    if (!dialog || dialog.open || typeof dialog.showModal !== "function") return;
    // Focus goes back to the row that opened the dialog once the route
    // unmounts it; `showModal()` moves it to the close button meanwhile.
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  const leave = () => {
    if (leaving.current) return;
    leaving.current = true;
    // Close the element first so the browser's own focus restoration runs
    // on the ✕ path as well as on Escape; `onClose` re-enters here and the
    // flag above stops the second `back()`.
    if (ref.current?.open) ref.current.close();
    router.back();
  };

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={labelledBy}
      // Escape closes the element natively; the route has to follow it.
      onClose={leave}
      // The dialog box is the scrim's hit area: the card fills it, so a
      // click whose target is the dialog itself landed on the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) leave();
      }}
    >
      <div className={`${styles.card} current-border`}>
        {/* Its own row above the scrolling body, so content passes under
            the mark rather than behind it. */}
        <div className={styles.bar}>
          <button
            type="button"
            className="m3-icon-button m3-state"
            onClick={leave}
            aria-label={closeLabel}
          >
            <CloseIcon />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </dialog>
  );
}

/**
 * The route's loading state: the same card with an empty body, so a row
 * click answers at once even though the record is a server round trip
 * away. `next/link` prefetches a dynamic route up to its first loading
 * boundary, which is what makes this instant rather than merely early.
 * No close button: there is no URL to go back from until the page commits.
 */
export function DetailDialogShell() {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open || typeof dialog.showModal !== "function") return;
    dialog.showModal();
  }, []);

  return (
    <dialog ref={ref} className={styles.dialog} aria-busy="true">
      <div className={`${styles.card} current-border`}>
        <div className={styles.bar} />
        <div className={`${styles.body} ${styles.pending}`} />
      </div>
    </dialog>
  );
}

/** The links out of a dialog: the same record as a full page, and the pages
 *  that only exist there. Plain anchors on purpose — the full page is the
 *  URL the dialog is already on, and only a real navigation leaves the
 *  intercepting route. */
export function DetailDialogActions({ children }: { children: React.ReactNode }) {
  return <footer className={styles.actions}>{children}</footer>;
}
