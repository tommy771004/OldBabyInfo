import styles from "./where-to-buy.module.css";

export default function Loading() {
  return (
    <main className={styles.page} aria-busy="true">
      <p role="status">Loading Stock Listings…</p>
    </main>
  );
}
