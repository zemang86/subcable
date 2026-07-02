import type { Metadata } from "next";
import "./globals.css";

// Font wiring: all 5 v1.0 families (Chakra Petch / Rajdhani / IBM Plex Mono /
// B612 Mono / Space Mono) are served as plain @font-face declarations in
// globals.css, pointing at TTFs in /public/fonts/ — the kiosk runs offline,
// so no CDN fonts. next/font was bypassed because Next.js 16 Turbopack
// registered the faces but never applied them to elements.

export const metadata: Metadata = {
  title: "TM Global · Submarine Cable Network",
  description:
    "Interactive 3D globe visualization of TM Global submarine cable systems",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
