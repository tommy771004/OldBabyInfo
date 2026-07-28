import type { ComboStats } from "@/lib/parts/combo-stats.ts";
import { formatWeightRange } from "@/lib/parts/part-weight.ts";
import styles from "./catalog-stats.module.css";

export interface CatalogStatsLabels {
  heading: string;
  attack: string;
  defense: string;
  stamina: string;
  xDash: string;
  burstResistance: string;
  weight: string;
  note: string;
  unavailable: string;
}

export function CatalogStats({
  stats,
  weightGrams,
  labels,
}: {
  stats: ComboStats | undefined;
  weightGrams: number | undefined;
  labels: CatalogStatsLabels;
}) {
  return (
    <section className={styles.stats} aria-labelledby="catalog-stats-heading">
      <h2 id="catalog-stats-heading">{labels.heading}</h2>
      {stats ? (
        <>
          <dl className={styles.grid}>
            <Stat label={labels.attack} value={stats.attack} />
            <Stat label={labels.defense} value={stats.defense} />
            <Stat label={labels.stamina} value={stats.stamina} />
            <Stat label={labels.xDash} value={stats.xDash} />
            <Stat label={labels.burstResistance} value={stats.burstResistance} />
            <Stat label={labels.weight} value={weightGrams === undefined ? "—" : formatWeightRange({ min: weightGrams, max: weightGrams })} />
          </dl>
          <p className={styles.note}>{labels.note}</p>
        </>
      ) : <p className={styles.unavailable}>{labels.unavailable}</p>}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
