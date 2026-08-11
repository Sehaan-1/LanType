import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Background, { CursorSpotlight } from "@/components/Background";

export const metadata: Metadata = {
  title: "LAN Share — AirDrop for everyone",
  description:
    "Share files across phones, tablets, and laptops on the same Wi‑Fi. No cloud, no accounts.",
  appleWebApp: {
    capable: true,
    title: "LAN Share",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100 antialiased">
        <Background />
        <CursorSpotlight />
        {children}
      </body>
    </html>
  );
}
