type CompassButtonProps = {
  onRecenter: () => void;
  ariaLabel?: string;
};

export function CompassButton({ onRecenter, ariaLabel = "Recenter on Malaysia" }: CompassButtonProps) {
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
