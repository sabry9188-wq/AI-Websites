import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

import { SerwistProvider } from "@serwist/next/react";

import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Cambria is a system font (ships with Windows and MS Office), referenced
// directly by name in globals.css (--font-sans) rather than loaded here —
// it isn't a font Google Fonts/next/font can serve. See globals.css for
// the fallback stack used on devices that don't have it installed.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "netlog",
  description: "Net lifecycle tracker for the farm's cage nets",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SerwistProvider swUrl="/sw.js" disable={process.env.NODE_ENV === "development"}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <TooltipProvider delay={200}>
                {children}
                <Toaster richColors closeButton position="top-right" />
              </TooltipProvider>
            </QueryProvider>
          </ThemeProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
