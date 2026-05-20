"use client";

import { useEffect, useState } from "react";

type Check = { label: string; family: string; weight: number; loaded: boolean };

const CHECKS: Array<Omit<Check, "loaded">> = [
  { label: "Chakra Petch 500",  family: "chakra",   weight: 500 },
  { label: "Chakra Petch 600",  family: "chakra",   weight: 600 },
  { label: "Chakra Petch 700",  family: "chakra",   weight: 700 },
  { label: "Rajdhani 400",      family: "rajdhani", weight: 400 },
  { label: "Rajdhani 500",      family: "rajdhani", weight: 500 },
  { label: "Rajdhani 600",      family: "rajdhani", weight: 600 },
  { label: "Rajdhani 700",      family: "rajdhani", weight: 700 },
  { label: "IBM Plex Mono 400", family: "plexmono", weight: 400 },
  { label: "IBM Plex Mono 600", family: "plexmono", weight: 600 },
  { label: "B612 Mono 400",     family: "b612Mono", weight: 400 },
  { label: "B612 Mono 700",     family: "b612Mono", weight: 700 },
];

type RegisteredFace = { family: string; weight: string; style: string; status: string };

export default function FontLoadStatus() {
  const [status, setStatus] = useState<Check[]>(() => CHECKS.map((c) => ({ ...c, loaded: false })));
  const [ready, setReady] = useState(false);
  const [registered, setRegistered] = useState<RegisteredFace[]>([]);
  const [stylesheetCount, setStylesheetCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      setReady(true);
      setStatus(
        CHECKS.map((c) => ({
          ...c,
          loaded: document.fonts.check(`${c.weight} 16px "${c.family}"`),
        })),
      );
      const faces: RegisteredFace[] = [];
      document.fonts.forEach((f) => {
        faces.push({ family: f.family, weight: f.weight, style: f.style, status: f.status });
      });
      setRegistered(faces);
      setStylesheetCount(document.styleSheets.length);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = status.length;
  const passed = status.filter((s) => s.loaded).length;

  return (
    <section style={{ marginBottom: 40, padding: "16px 20px", border: "1px solid var(--v1-bg-line)", borderRadius: 2 }}>
      <div className="v1-h-eye" style={{ marginBottom: 8 }}>
        RUNTIME FONT-LOAD CHECK ·{" "}
        <span style={{ color: ready && passed === total ? "var(--v1-active)" : "var(--v1-orange-hot)" }}>
          {ready ? `${passed}/${total} loaded` : "checking…"}
        </span>
      </div>
      <p className="v1-mono" style={{ fontSize: 12, color: "var(--v1-mute)", marginBottom: 12 }}>
        Uses <code>document.fonts.check()</code>. If a row shows MISSING, the browser is still serving a cached version
        without that face — hard-reload (Cmd+Shift+R), or open DevTools → Network → tick &quot;Disable cache&quot;, then reload.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", rowGap: 4, fontSize: 12 }}>
        {status.map((s) => (
          <div key={s.label} style={{ display: "contents" }}>
            <div className="v1-mono">{s.label}</div>
            <div
              className="v1-mono"
              style={{ color: s.loaded ? "var(--v1-active)" : ready ? "var(--v1-inactive)" : "var(--v1-mute-dark)", textAlign: "right" }}
            >
              {ready ? (s.loaded ? "LOADED" : "MISSING") : "…"}
            </div>
          </div>
        ))}
      </div>

      <div className="v1-h-eye" style={{ marginTop: 20, marginBottom: 6 }}>
        document.fonts REGISTRY · {registered.length} face(s) · {stylesheetCount} stylesheet(s)
      </div>
      <p className="v1-mono" style={{ fontSize: 11, color: "var(--v1-mute)", marginBottom: 8 }}>
        If this list is empty, the @font-face declarations never reached the browser — that means a CSS load failure,
        not a font-file problem.
      </p>
      <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid var(--v1-bg-line)", padding: "8px 12px", fontSize: 11 }} className="v1-mono">
        {registered.length === 0 ? (
          <div style={{ color: "var(--v1-inactive)" }}>(empty — browser sees zero @font-face declarations)</div>
        ) : (
          registered.map((f, i) => (
            <div key={i}>
              {f.family} · weight {f.weight} · style {f.style} · status {f.status}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
