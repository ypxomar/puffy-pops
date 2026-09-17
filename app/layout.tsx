/* eslint-disable @next/next/no-css-tags -- Cloudflare needs this explicit static fallback. */
import type { Metadata } from "next";
import { Caveat, DM_Sans, DM_Serif_Display, Geist, Pacifico, Shrikhand } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const display = DM_Serif_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

// Soft-serve landing typography, used by app/soft-serve-landing.css.
const softServeDisplay = Shrikhand({
  variable: "--font-shrikhand",
  subsets: ["latin"],
  weight: "400",
});

const softServeBody = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const softServeHand = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

// The rounded script used by the Puffy Pops logo, for brand sign-off moments.
const softServeScript = Pacifico({
  variable: "--font-pacifico",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Puffy Pops Egypt | Spreading Joy",
  description:
    "Order Puffy Pops, cookies, brownies, coffee and more from your nearest Puffy Pops branch in Egypt.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/puffy-pops-logo.png",
    shortcut: "/puffy-pops-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/assets/storefront.css" />
        <link rel="stylesheet" href="/assets/soft-serve-landing.css" />
      </head>
      <body
        className={`${geistSans.variable} ${display.variable} ${softServeDisplay.variable} ${softServeBody.variable} ${softServeHand.variable} ${softServeScript.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
