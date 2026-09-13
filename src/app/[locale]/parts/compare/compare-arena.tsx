"use client";

import { useEffect, useMemo, useState } from "react";
import type { Part } from "@/lib/parts/schema.ts";
import type { Locale } from "@/i18n/routing.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { battlePath, BATTLE_STEP, compareBattle } from "@/lib/parts/compare-battle.ts";
import { StadiumSignature } from "@/components/stadium-signature.tsx";
import { PartSilhouette } from "@/components/part-silhouette.tsx";
import { compareCopy } from "./compare-copy.ts";
import styles from "./page.module.css";

export function CompareArena({ left, right, locale }: { left: Part; right: Part; locale: Locale }) {
  const copy = compareCopy[locale];
  const frames = useMemo(() => compareBattle(left, right), [left, right]);
  const paths = useMemo(() => frames ? [battlePath(frames, 0), battlePath(frames, 1)] : [], [frames]);
  const [reduced, setReduced] = useState(true);
  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { setReduced(media.matches); setRunning(false); setIndex(null); };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!running || reduced || !frames) return;
    let request: number;
    let start: number | undefined;
    const from = index ?? 0;
    const tick = (now: number) => {
      start ??= now;
      const next = Math.min(frames.length - 1, from + Math.floor((now - start) / (BATTLE_STEP * 1000)));
      setIndex(next);
      if (next < frames.length - 1) request = requestAnimationFrame(tick);
      else setRunning(false);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
    // index is the playback cursor. Capture it only on play/resume.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, reduced, frames]);

  const staticFrame = frames?.find((frame) => frame.contact) ?? frames?.[0];
  const frame = index === null || reduced ? staticFrame : frames?.[index];
  const lastContact = frames && index !== null && !reduced && running
    ? frames.slice(Math.max(0, index - 12), index + 1).find((sample) => sample.contact)
    : undefined;
  const names = [left, right].map((part) => localizedNameOf(part, locale));
  const finished = index === (frames?.length ?? 0) - 1;

  return (
    <figure className={`${styles.miniArena} m3-dark`}>
      <div className={styles.arenaDrawing} role="img" aria-label={`${names[0]} / ${names[1]} — ${frames ? copy.static : copy.unavailable}`}>
        <div className={styles.arenaGeometry} aria-hidden="true"><StadiumSignature /></div>
        <svg className={styles.arenaPaths} viewBox="0 0 1000 1000" aria-hidden="true">
          {paths.map((path, side) => <path key={side} d={path} className={styles.battlePath} data-side={side} />)}
          {frame?.contact && !running ? <circle cx={frame.contact.x} cy={frame.contact.y} r="14" className={styles.contactMarker} /> : null}
          {lastContact ? paths.map((_, side) => {
            const contactIndex = frames!.indexOf(lastContact);
            return <path key={`${side}-${contactIndex}`} className={styles.impactCurrent}
              d={battlePath(frames!.slice(Math.max(0, contactIndex - 5), contactIndex + 2), side as 0 | 1)}
              strokeWidth={2 + lastContact.contact!.strength * 3} />;
          }) : null}
        </svg>
        {[left, right].map((part, side) => {
          const pose = frame?.poses[side];
          return <div key={side} className={styles.arenaPart} data-side={side} aria-hidden="true"
            style={{ left: `${(pose?.x ?? (side === 0 ? 245 : 755)) / 10}%`, top: `${(pose?.y ?? 500) / 10}%` }}>
            <div style={{ transform: `rotate(${pose?.angle ?? 0}deg)` }}><PartSilhouette part={part} /></div>
          </div>;
        })}
      </div>
      <figcaption className={styles.arenaCaption}>
        <p>{copy.note}</p>
        <p>{frames ? `${copy.static}${staticFrame?.contact ? ` · ○ ${copy.impact}` : ""}` : copy.unavailable}</p>
        {frames && !reduced ? <button type="button" className="m3-button m3-button--outlined m3-state"
          onClick={() => {
            if (running) setRunning(false);
            else { if (finished || index === null) setIndex(0); setRunning(true); }
          }}>{running ? copy.pause : finished ? copy.replay : copy.play}</button> : null}
      </figcaption>
    </figure>
  );
}
