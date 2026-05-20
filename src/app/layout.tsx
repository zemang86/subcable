import type { Metadata } from "next";
import "./globals.css";

// Font wiring: all 4 v1.0 families (Chakra Petch / Rajdhani / IBM Plex Mono /
// B612 Mono) are served as plain @font-face declarations in globals.css,
// pointing at TTFs in /public/fonts/. Space Mono comes from a Google Fonts
// @import in the same file. next/font was bypassed because Next.js 16
// Turbopack registered the faces but never applied them to elements.

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
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
