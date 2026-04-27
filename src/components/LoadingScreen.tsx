"use client";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#06013A] overflow-hidden">
      {/* Brand chevron motif corners — subtle */}
      <div
        className="absolute top-0 left-0 w-32 h-32 opacity-30"
        style={{
          background:
            "repeating-linear-gradient(135deg, #1800E7 0 14px, transparent 14px 24px, #FF5E00 24px 30px, transparent 30px 44px)",
          maskImage: "linear-gradient(135deg, black, transparent 70%)",
          WebkitMaskImage: "linear-gradient(135deg, black, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-32 h-32 opacity-30"
        style={{
          background:
            "repeating-linear-gradient(135deg, #1800E7 0 14px, transparent 14px 24px, #FF5E00 24px 30px, transparent 30px 44px)",
          maskImage: "linear-gradient(-45deg, black, transparent 70%)",
          WebkitMaskImage: "linear-gradient(-45deg, black, transparent 70%)",
        }}
      />

      <div className="flex items-center gap-2 px-4 py-2 bg-white rounded mb-6">
        <span className="font-display font-black text-[#1800E7] text-2xl leading-none tracking-tight">
          TM
        </span>
        <span className="font-display font-bold text-[#06013A] text-xs leading-none tracking-[0.25em]">
          GLOBAL
        </span>
      </div>

      <div className="relative mb-8">
        <div className="h-12 w-12 rounded-full border-2 border-[#1800E7]/30 border-t-[#1800E7] animate-spin" />
        <div
          className="absolute inset-0 h-12 w-12 rounded-full border-2 border-transparent border-b-[#FF5E00]/60 animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        />
      </div>

      <h2 className="font-display text-base font-bold tracking-[0.25em] text-white mb-2 uppercase">
        Submarine Cable Network
      </h2>
      <p className="text-[10px] tracking-[0.2em] text-[#A8B0D6] animate-pulse uppercase font-medium">
        Initializing globe…
      </p>
    </div>
  );
}
