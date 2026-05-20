import type { DialogId } from "@/lib/types";

type RightClusterProps = {
  openDialog: DialogId;
  onOpen: (id: Exclude<DialogId, null>) => void;
  /** When false, dialogs that require a selected cable render disabled. */
  cableSelected?: boolean;
};

export function RightCluster({
  openDialog,
  onOpen,
  cableSelected = true,
}: RightClusterProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        alignItems: "center",
      }}
    >
      <ClusterButton
        active={openDialog === "howto"}
        onClick={() => onOpen("howto")}
        ariaLabel="How to use"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
      </ClusterButton>

      <ClusterButton
        active={openDialog === "funfact"}
        onClick={() => onOpen("funfact")}
        ariaLabel="Information"
        disabled={!cableSelected}
      >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="6.5" />
        <path d="M12 8h.01M11 12h1v4h1" />
      </ClusterButton>

      <ClusterButton
        active={openDialog === "morse"}
        onClick={() => onOpen("morse")}
        ariaLabel="Morse Code"
        disabled={!cableSelected}
      >
        {/* 5 dots + 5 dashes per Figma V1.3 (kit Chrome.jsx lines 78–89) */}
        <g fill="currentColor" stroke="none">
          <circle cx="7" cy="4.5" r="1.2" />
          <circle cx="7" cy="8" r="1.2" />
          <circle cx="7" cy="11.5" r="1.2" />
          <circle cx="7" cy="15" r="1.2" />
          <circle cx="7" cy="18.5" r="1.2" />
          <rect x="11" y="3.4" width="7" height="1.7" rx="0.6" />
          <rect x="11" y="6.9" width="7" height="1.7" rx="0.6" />
          <rect x="11" y="10.4" width="7" height="1.7" rx="0.6" />
          <rect x="11" y="13.9" width="7" height="1.7" rx="0.6" />
          <rect x="11" y="17.4" width="7" height="1.7" rx="0.6" />
        </g>
      </ClusterButton>
    </div>
  );
}

function ClusterButton({
  active,
  onClick,
  ariaLabel,
  disabled = false,
  children,
}: {
  active: boolean;
  onClick: () => void;
  ariaLabel: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={active}
      style={{
        width: 76,
        height: 76,
        borderRadius: "50%",
        cursor: disabled ? "not-allowed" : "pointer",
        background:
          "radial-gradient(ellipse at 50% 110%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0) 80%), rgba(255,255,255,0.03)",
        border: `1.5px solid ${active ? "var(--v1-active)" : "rgba(255, 255, 255, 0.85)"}`,
        boxShadow: active ? "0 0 24px rgba(143, 255, 63, 0.5)" : "none",
        color: active ? "var(--v1-active)" : "var(--v1-fg)",
        opacity: disabled ? 0.35 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 200ms",
      }}
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {children}
      </svg>
    </button>
  );
}
