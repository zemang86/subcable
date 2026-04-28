"use client";

interface InfoModalProps {
  onClose: () => void;
}

export default function InfoModal({ onClose }: InfoModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
      <div className="relative w-full max-w-[820px] rounded-2xl bg-[#06013A]/95 backdrop-blur-xl border border-[#1800E7]/40 shadow-[0_8px_60px_rgba(0,0,0,0.6)]">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 border border-[#1800E7]/40 text-white flex items-center justify-center active:bg-white/10"
        >
          <span className="text-base leading-none">✕</span>
        </button>

        <div className="px-8 pt-8 pb-2 text-center">
          <div className="font-display font-bold text-[10px] tracking-[0.3em] text-[#A8B0D6] uppercase">
            Submarine Cable Network
          </div>
          <h2 className="font-display font-black text-2xl tracking-[0.15em] text-white uppercase mt-1">
            How to Use SCN
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-4 px-8 py-6">
          <Tile
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-10 h-10">
                <path d="M9 11.5V7a2 2 0 0 1 4 0v6" />
                <path d="M13 8a2 2 0 0 1 4 0v5" />
                <path d="M17 9a2 2 0 0 1 4 0v6a6 6 0 0 1-6 6h-3a6 6 0 0 1-5.66-4l-2.21-6a2 2 0 0 1 3.76-1.34l1.11 3" />
              </svg>
            }
            title="Tap to interact"
            body="Tap the screen to interact with buttons, items, animations and more."
          />
          <Tile
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-10 h-10">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
                <path d="M11 8v6M8 11h6" />
              </svg>
            }
            title="Zoom in and out"
            body="On the globe, you can zoom in and out to get a better view of the submarine cables."
          />
          <Tile
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-10 h-10">
                <path d="M3 12h18" />
                <path d="M9 6l-6 6 6 6" />
                <path d="M15 6l6 6-6 6" />
              </svg>
            }
            title="Swipe"
            body="Some features allow you to swipe through. Go ahead and explore it yourself."
          />
        </div>

        <div className="px-8 pb-8 flex justify-center">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-lg bg-[#1800E7] font-display font-bold text-xs tracking-[0.25em] text-white uppercase active:bg-[#1500B8]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Tile({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl bg-white/5 border border-[#1800E7]/30 p-5 flex flex-col items-center text-center gap-3">
      <div className="text-[#FF5E00]">{icon}</div>
      <div className="font-display font-bold text-[13px] tracking-[0.15em] text-white uppercase">
        {title}
      </div>
      <p className="text-[11px] leading-relaxed text-[#A8B0D6]">{body}</p>
    </div>
  );
}
