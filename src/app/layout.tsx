import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

// Roboto = TM Global body/subhead font. HK Grotesk Wide (headlines) is
// self-hosted via @font-face in globals.css.
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
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
  return (
    <html lang="en">
      <body className={`${roboto.variable} antialiased font-light`}>{children}</body>
    </html>
  );
}
