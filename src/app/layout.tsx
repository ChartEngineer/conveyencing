import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deeds360 — Conveyancing & Legal Practice Suite",
  description: "Conveyancing and legal practice management for Zimbabwe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
