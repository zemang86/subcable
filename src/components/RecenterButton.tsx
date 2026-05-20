type RecenterButtonProps = {
  onRecenter: () => void;
  ariaLabel?: string;
};

// Per Figma V1.3 — labelled "Re-center" (not "Compass"). Stage geometry from
// the kit: 43.61×43.61, transform: rotate(180deg). Function unchanged — see
// resetView in GlobeScene (deselect cable, clear callout, camera home).
export function RecenterButton({
  onRecenter,
  ariaLabel = "Re-center",
}: RecenterButtonProps) {
  return (
    <button
      type="button"
      onClick={onRecenter}
      aria-label={ariaLabel}
      style={{
        width: 44,
        height: 44,
        background: "rgba(0, 0, 0, 0.55)",
        border: "1px solid rgba(255, 255, 255, 0.40)",
        color: "var(--v1-fg)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transform: "rotate(180deg)",
        borderRadius: "50%",
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <polygon
          points="12,5 14.4,12 12,19 9.6,12"
          fill="var(--v1-orange)"
          stroke="var(--v1-orange)"
        />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      </svg>
    </button>
  );
}
