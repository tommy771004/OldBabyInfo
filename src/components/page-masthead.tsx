import { ArenaMark, type ArenaSubject } from "./arena-mark.tsx";
import styles from "./page-masthead.module.css";

interface MastheadFrameProps {
  subject?: ArenaSubject;
  size?: "compact" | "feature";
  /**
   * `false` is for a page whose body already draws the whole arena directly
   * below (the two-Part compare duel): a second, smaller plan of the same
   * field right above it reads as the drawing twice, not as a motif.
   */
  mark?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * The masthead's layout alone — copy on the left, the stadium plan on the
 * right — for a page that has to keep its own heading markup. The Catalog
 * record is the case: inside the detail dialog its name is an `<h2>` under
 * the list's `<h1>`, and it has its own product-code kicker.
 */
export function MastheadFrame({ subject = "field", size = "compact", mark = true, className, children }: MastheadFrameProps) {
  return (
    <header
      className={[
        styles.masthead,
        size === "feature" ? styles.feature : styles.compact,
        mark ? "" : styles.unmarked,
        className ?? "",
      ].join(" ")}
    >
      <div className={styles.text}>{children}</div>
      {mark ? <ArenaMark subject={subject} className={styles.mark} /> : null}
    </header>
  );
}

/**
 * The top of every feature page: where you are, what the page is for, and
 * the stadium plan drawn beside it (ADR-0006). One layout so the pages read
 * as one site — before this each route hand-wrote its own `<h1>` rule, at
 * four different sizes and margins, and only Guides carried the field.
 *
 * `size="feature"` is the large drawing Guides was designed around; every
 * data page takes `compact`, because a reader came for the list below it
 * and the masthead must not push that list off the first screen.
 *
 * `children` is the page's own lead copy, kept in the page's own markup.
 */
export function PageMasthead({
  title,
  kicker,
  titleId,
  children,
  ...frame
}: Omit<MastheadFrameProps, "children" | "className"> & {
  title: React.ReactNode;
  kicker?: React.ReactNode;
  titleId?: string;
  children?: React.ReactNode;
}) {
  return (
    <MastheadFrame {...frame}>
      {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
      <h1 id={titleId} className={styles.title}>{title}</h1>
      {children}
    </MastheadFrame>
  );
}
