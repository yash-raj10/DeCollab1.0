import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WalletAuthProvider } from "./contexts/SimpleWalletContext";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Collabify - Real-time Collaborative Platform",
  description:
    "Collaborate in real-time with ExcaliDraw whiteboard and Doc Online editor",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletAuthProvider>{children}</WalletAuthProvider>
      </body>
    </html>
  );
}
