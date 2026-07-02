import { memo } from "react";
import type { DialogId } from "@/lib/types";

type RightClusterProps = {
  openDialog: DialogId;
  onOpen: (id: Exclude<DialogId, null>) => void;
  /** When false, dialogs that require a selected cable render disabled. */
  cableSelected?: boolean;
};

// Memoized: shields the cluster from GlobeScene's 30fps marker-tracking
// re-renders — requires onOpen to be a stable useCallback at the call site.
export const RightCluster = memo(RightClusterBase);

function RightClusterBase({
  openDialog,
  onOpen,
  cableSelected = true,
}: RightClusterProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 31,
        alignItems: "center",
      }}
    >
      <ClusterButton
        stemId="morse"
        active={openDialog === "morse"}
        onClick={() => onOpen("morse")}
        ariaLabel="Morse Code"
        icon={<MorseIcon />}
      />

      <ClusterButton
        stemId="funfact"
        active={openDialog === "funfact"}
        onClick={() => onOpen("funfact")}
        ariaLabel="Information"
        dimmed={!cableSelected}
        icon={<FactIcon />}
      />

      <ClusterButton
        stemId="howto"
        active={openDialog === "howto"}
        onClick={() => onOpen("howto")}
        ariaLabel="How to use"
        icon={<HelpIcon />}
      />
    </div>
  );
}

function ClusterButton({
  stemId,
  active,
  onClick,
  ariaLabel,
  disabled = false,
  dimmed = false,
  icon,
}: {
  stemId: string;
  active: boolean;
  onClick: () => void;
  ariaLabel: string;
  disabled?: boolean;
  // Looks disabled (greyed, not-allowed) but stays clickable — the tap is
  // intercepted upstream to surface a "choose a network first" hint instead
  // of opening the dialog. Distinct from `disabled`, which is fully inert.
  dimmed?: boolean;
  icon: React.ReactNode;
}) {
  const muted = disabled || dimmed;
  return (
    <button
      type="button"
      data-stem-btn={stemId}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={active}
      className="v1-pressable"
      style={{
        position: "relative",
        width: 76,
        height: 76,
        padding: 0,
        border: "none",
        background: "transparent",
        cursor: muted ? "not-allowed" : "pointer",
        opacity: muted ? 0.35 : 1,
        transition: "opacity 200ms",
        overflow: "visible",
      }}
    >
      {icon}
      {active && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: -20,
            left: -20,
            width: 116,
            height: 116,
            pointerEvents: "none",
          }}
        >
          <SelectedOverlay />
        </span>
      )}
    </button>
  );
}

function SelectedOverlay() {
  return (
    <svg
      width="116"
      height="116"
      viewBox="0 0 116 116"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle
        cx="58"
        cy="58"
        r="56"
        fill="#80FF4E"
        fillOpacity="0.22"
        stroke="#80FF4E"
        strokeWidth="4"
      />
    </svg>
  );
}

function MorseIcon() {
  return (
    <svg
      width="76"
      height="76"
      viewBox="0 0 76 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="38" cy="38" r="37.4062" fill="url(#mb_grad_a)" />
      <circle cx="38" cy="38" r="37.4062" fill="url(#mb_grad_b)" />
      <circle cx="38" cy="38" r="37.4062" stroke="white" strokeWidth="1.1875" />
      <circle
        cx="2.15778"
        cy="2.15778"
        r="2.04181"
        transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 13.4258 44.9966)"
        fill="#F05A22"
        stroke="white"
        strokeWidth="0.231938"
      />
      <circle
        cx="2.15778"
        cy="2.15778"
        r="2.04181"
        transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 13.4258 36.9971)"
        fill="#F05A22"
        stroke="white"
        strokeWidth="0.231938"
      />
      <circle
        cx="2.15778"
        cy="2.15778"
        r="2.04181"
        transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 59.9453 29.8594)"
        fill="#F05A22"
        stroke="white"
        strokeWidth="0.231938"
      />
      <circle
        cx="2.15778"
        cy="2.15778"
        r="2.04181"
        transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 43.5781 64.687)"
        fill="#F05A22"
        stroke="white"
        strokeWidth="0.231938"
      />
      <circle
        cx="2.15778"
        cy="2.15778"
        r="2.04181"
        transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 26.1016 52.1343)"
        fill="#F05A22"
        stroke="white"
        strokeWidth="0.231938"
      />
      <circle
        cx="2.15778"
        cy="2.15778"
        r="2.04181"
        transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 49.7305 29.8594)"
        fill="#F05A22"
        stroke="white"
        strokeWidth="0.231938"
      />
      <circle
        cx="2.15778"
        cy="2.15778"
        r="2.04181"
        transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 30.0391 17.4297)"
        fill="#F05A22"
        stroke="white"
        strokeWidth="0.231938"
      />
      <path
        d="M62.3374 33.7841C63.2368 39.1294 62.3423 44.6215 59.7926 49.4078C57.2429 54.1942 53.1807 58.0072 48.2364 60.2551"
        stroke="white"
        strokeWidth="2.2152"
      />
      <path
        d="M52.7635 31.5478C54.0526 34.5396 54.3948 37.8519 53.7443 41.0425C53.0939 44.233 51.4817 47.15 49.1232 49.4037C46.7647 51.6575 43.7721 53.1409 40.545 53.6557C37.3179 54.1705 34.0099 53.6922 31.0628 52.2848"
        stroke="white"
        strokeWidth="2.2152"
      />
      <path
        d="M23.2974 44.2836C21.9849 41.302 21.6167 37.9924 22.2421 34.7969C22.8675 31.6013 24.4567 28.6719 26.7974 26.3998C29.1382 24.1278 32.1191 22.6211 35.342 22.0812C38.565 21.5413 41.8766 21.9937 44.8346 23.3781"
        stroke="white"
        strokeWidth="2.2152"
      />
      <path
        d="M35.931 62.3848C31.3861 62.0027 27.0364 60.3716 23.3647 57.6726C19.693 54.9736 16.8431 51.3122 15.1315 47.0951"
        stroke="white"
        strokeWidth="2.2152"
      />
      <path
        d="M15.0029 28.945C16.893 24.0922 20.2771 19.9621 24.6686 17.1487"
        stroke="white"
        strokeWidth="2.2152"
      />
      <path
        d="M33.7422 13.6148C38.3027 12.8173 42.9961 13.3159 47.286 15.0534C51.5758 16.7909 55.289 19.6974 58.0012 23.4405"
        stroke="white"
        strokeWidth="2.2152"
      />
      <defs>
        <linearGradient
          id="mb_grad_a"
          x1="41.8919"
          y1="25.1076"
          x2="41.8919"
          y2="221.391"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.05" stopColor="white" stopOpacity="0" />
          <stop offset="0.95" stopColor="white" />
        </linearGradient>
        <linearGradient
          id="mb_grad_b"
          x1="41.8919"
          y1="59.0361"
          x2="41.8919"
          y2="-238.178"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.05" stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="white" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function FactIcon() {
  return (
    <svg
      width="76"
      height="76"
      viewBox="0 0 76 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="38" cy="38" r="37.4062" fill="url(#fb_grad_a)" />
      <circle cx="38" cy="38" r="37.4062" fill="url(#fb_grad_b)" />
      <circle cx="38" cy="38" r="37.4062" stroke="white" strokeWidth="1.1875" />
      <path
        d="M34.875 25.3547V21.0009C34.875 20.3336 35.209 20 35.877 20H40.2355C40.9035 20 41.2375 20.3169 41.2375 20.9508V25.3547C41.2375 26.0219 40.9035 26.3556 40.2355 26.3556H35.877C35.209 26.3556 34.875 26.0219 34.875 25.3547ZM34.875 54.1299V30.7094C34.875 30.0088 35.209 29.6585 35.877 29.6585H40.1854C40.8868 29.6585 41.2375 30.0088 41.2375 30.7094V54.1299C41.2375 54.5636 41.154 54.8472 40.987 54.9807C40.8534 55.1141 40.6029 55.1809 40.2355 55.1809H35.9271C35.2257 55.1809 34.875 54.8305 34.875 54.1299Z"
        fill="white"
      />
      <circle cx="38" cy="38" r="28" stroke="white" strokeWidth="2" />
      <defs>
        <linearGradient
          id="fb_grad_a"
          x1="41.8919"
          y1="25.1076"
          x2="41.8919"
          y2="221.391"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.05" stopColor="white" stopOpacity="0" />
          <stop offset="0.95" stopColor="white" />
        </linearGradient>
        <linearGradient
          id="fb_grad_b"
          x1="41.8919"
          y1="59.0361"
          x2="41.8919"
          y2="-238.178"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.05" stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="white" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg
      width="76"
      height="76"
      viewBox="0 0 76 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="38" cy="38" r="37.4062" fill="url(#hb_grad_a)" />
      <circle cx="38" cy="38" r="37.4062" fill="url(#hb_grad_b)" />
      <circle cx="38" cy="38" r="37.4062" stroke="white" strokeWidth="1.1875" />
      <path
        d="M42.4489 41.0829V43.0016C42.4489 44.0347 41.9323 44.5513 40.8992 44.5513H35.0693C34.0362 44.5513 33.5196 44.0347 33.5196 43.0016V41.0091C33.5196 39.3856 33.7902 38.0819 34.3314 37.0979C34.8725 36.0648 35.7827 35.0317 37.0618 33.9985L41.1943 30.604C42.7686 29.374 43.5558 28.0211 43.5558 26.5452V26.1024C43.5558 24.5773 43.1868 23.495 42.4489 22.8554C41.7601 22.1667 40.604 21.8223 38.9805 21.8223H37.6522C36.127 21.8223 35.0201 22.1421 34.3314 22.7817C33.6918 23.4212 33.372 24.5281 33.372 26.1024V27.6521C33.372 28.7345 32.8555 29.2756 31.8223 29.2756H25.5497C24.5166 29.2756 24 28.7345 24 27.6521V25.9549C24 22.1175 25.0577 19.1657 27.1732 17.0994C29.2887 15.0331 32.2897 14 36.1762 14H40.5302C44.4167 14 47.4177 15.0331 49.5332 17.0994C51.6487 19.1657 52.7064 22.1175 52.7064 25.9549V26.988C52.7064 29.3986 51.5995 31.5633 49.3856 33.482L44.3675 37.5407C43.0884 38.7214 42.4489 39.9022 42.4489 41.0829Z"
        stroke="white"
      />
      <path
        d="M42.5239 59.8271V50.7503C42.5239 49.8155 42.0566 49.3482 41.1218 49.3482H34.554C33.5701 49.3482 33.0781 49.8401 33.0781 50.8241V59.7533C33.0781 60.8356 33.5701 61.3768 34.554 61.3768H41.1218C42.0566 61.3768 42.5239 60.8602 42.5239 59.8271Z"
        fill="white"
      />
      <defs>
        <linearGradient
          id="hb_grad_a"
          x1="41.8919"
          y1="25.1076"
          x2="41.8919"
          y2="221.391"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.05" stopColor="white" stopOpacity="0" />
          <stop offset="0.95" stopColor="white" />
        </linearGradient>
        <linearGradient
          id="hb_grad_b"
          x1="41.8919"
          y1="59.0361"
          x2="41.8919"
          y2="-238.178"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.05" stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="white" />
        </linearGradient>
      </defs>
    </svg>
  );
}
