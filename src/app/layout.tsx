import type { Metadata } from "next";
import { Chakra_Petch, Rajdhani, IBM_Plex_Mono, B612_Mono, Space_Mono } from "next/font/google";
import "./globals.css";

// v1.0 tactical-HUD type stack. Only the weights actually consumed by the spec
// are loaded; `display: 'swap'` so the system fallback paints first.
const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const b612Mono = B612_Mono({
  variable: "--font-b612-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

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
  const fontVars = [
    chakra.variable,
    rajdhani.variable,
    plexMono.variable,
    b612Mono.variable,
    spaceMono.variable,
  ].join(" ");
  return (
    <html lang="en">
      <body className={`${fontVars} antialiased`}>{children}</body>
    </html>
  );
}
