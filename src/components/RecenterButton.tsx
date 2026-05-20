type RecenterButtonProps = {
  onRecenter: () => void;
  ariaLabel?: string;
};

// Per Figma V1.3 — labelled "Re-center" (not "Compass"). The button is the
// SVG itself: 44×44, transform: rotate(180deg). Function unchanged — see
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
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        transform: "rotate(180deg)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <circle
          cx="21.8041"
          cy="21.8043"
          r="21.4634"
          fill="url(#recenter_paint0)"
        />
        <circle
          cx="21.8041"
          cy="21.8043"
          r="21.4634"
          fill="url(#recenter_paint1)"
        />
        <circle
          cx="21.8041"
          cy="21.8043"
          r="21.4634"
          stroke="white"
          strokeWidth="0.681378"
        />
        <circle
          cx="22.125"
          cy="22.123"
          r="5.90558"
          transform="rotate(45 22.125 22.123)"
          fill="white"
        />
        <path
          d="M22.1406 30.5748C23.9934 30.5748 25.793 29.9553 27.2532 28.815C28.7134 27.6746 29.7504 26.0787 30.1994 24.2811C30.6483 22.4836 30.4833 20.5875 29.7307 18.8945C28.9781 17.2015 27.6811 15.8087 26.0459 14.9376C24.4107 14.0665 22.5311 13.7671 20.7062 14.0871C18.8813 14.4071 17.2157 15.328 15.9744 16.7034C14.733 18.0788 13.9872 19.8298 13.8554 21.6779C13.7237 23.5259 14.2136 25.365 15.2472 26.9026"
          stroke="white"
          strokeWidth="1.98628"
        />
        <path
          d="M7.19917 22.3826L13.6522 22.4606"
          stroke="white"
          strokeWidth="2.29517"
        />
        <path
          d="M29.7386 22.3325L36.4205 22.3822"
          stroke="white"
          strokeWidth="2.29517"
        />
        <path
          d="M21.8853 13.969L21.808 6.88512"
          stroke="white"
          strokeWidth="2.29517"
        />
        <path
          d="M22.6948 36.551L22.7802 29.4666"
          stroke="white"
          strokeWidth="2.29517"
        />
        <defs>
          <linearGradient
            id="recenter_paint0"
            x1="-16.702"
            y1="-16.8511"
            x2="53.6036"
            y2="27.9081"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.124727" stopColor="#F05A22" stopOpacity="0.6" />
            <stop offset="0.789012" stopColor="#F05A22" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="recenter_paint1"
            x1="82.4512"
            y1="82.7471"
            x2="-13.6865"
            y2="21.4745"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#034DA1" />
            <stop offset="0.760608" stopColor="#034DA1" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </button>
  );
}
