"use client";

import { useEffect, useState } from "react";

const SURFACE_STEPS = [950, 900, 800, 700, 600, 500, 400, 300, 200, 100, 50];
const ROLE_VARS = ["--ink-on-dark", "--ink-on-light", "--accent-on-dark", "--accent-on-light"];

/**
 * Reads the *actual* computed CSS custom property values at runtime rather
 * than duplicating hex literals here — this page's entire point is being a
 * trustworthy regression check (ticket 08's "token 變更後立即反映"), so the
 * printed value must never be able to drift from what colors.css really
 * defines.
 */
export function ColorSwatches() {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const next: Record<string, string> = {};
    for (const step of SURFACE_STEPS) next[`--surface-${step}`] = style.getPropertyValue(`--surface-${step}`).trim();
    for (const role of ROLE_VARS) next[role] = style.getPropertyValue(role).trim();
    setValues(next);
  }, []);

  return (
    <div>
      <h3>Surface ramp（場上 950 → 場邊 50）</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {SURFACE_STEPS.map((step) => (
          <div key={step} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 72,
                height: 72,
                background: `var(--surface-${step})`,
                border: "1px solid var(--surface-500)",
              }}
            />
            <div style={{ fontSize: 12 }}>surface-{step}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{values[`--surface-${step}`] ?? "…"}</div>
          </div>
        ))}
      </div>

      <h3>Ink & accent 角色</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {ROLE_VARS.map((role) => (
          <div key={role} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 72,
                height: 72,
                background: `var(${role})`,
                border: "1px solid var(--surface-500)",
              }}
            />
            <div style={{ fontSize: 12 }}>{role}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{values[role] ?? "…"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
