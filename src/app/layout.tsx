import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "SpendSense", template: "%s · SpendSense" },
  description:
    "Upload your bank statement and see where your UPI money went: food, travel, subscriptions and the small payments that add up.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#121210" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh">
        {children}
        <Toaster
          position="top-center"
          offset={16}
          toastOptions={{ className: "ss-toast", duration: 4000 }}
        />
      </body>
    </html>
  );
}
