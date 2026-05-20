type AudioMuteProps = {
  muted: boolean;
  onToggle: () => void;
};

export function AudioMute({ muted, onToggle }: AudioMuteProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={muted ? "Unmute audio" : "Mute audio"}
      aria-pressed={muted}
      style={{
        width: 36,
        height: 36,
        background: "rgba(0, 0, 0, 0.55)",
        border: "1px solid rgba(255, 255, 255, 0.40)",
        color: muted ? "var(--v1-mute)" : "var(--v1-fg)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
        {muted ? (
          <>
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </>
        ) : (
          <>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        )}
      </svg>
    </button>
  );
}
