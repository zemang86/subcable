"use client";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0E1A]">
      <div className="relative mb-8">
        <div className="h-16 w-16 rounded-full border-2 border-[#2362DD]/30 border-t-[#2362DD] animate-spin" />
        <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-transparent border-b-[#00BCD4]/50 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
      </div>
      <h2 className="text-lg font-semibold tracking-[0.2em] text-[#2362DD] mb-2">
        TM SUBMARINE CABLE NETWORK
      </h2>
      <p className="text-xs tracking-[0.15em] text-[#94A3B8] animate-pulse">
        INITIALIZING GLOBE...
      </p>
    </div>
  );
}
