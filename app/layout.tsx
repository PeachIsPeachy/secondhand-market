import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MessagesAmbientNotifier } from "@/components/MessagesAmbientNotifier";
import { Navbar } from "@/components/Navbar";
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
  title: {
    default: "ReListed — Second-hand marketplace",
    template: "%s · ReListed",
  },
  description:
    "Buy and sell used items locally. Simple listings, search, and seller messaging.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground antialiased">
        <Navbar />
        <MessagesAmbientNotifier />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="text-center sm:text-left">
                <p className="text-base font-semibold tracking-tight text-foreground">
                  Re<span className="text-primary">Listed</span>
                </p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">
                  A focused marketplace for quality second-hand goods. Transparent listings, direct
                  seller contact.
                </p>
              </div>
              <p className="max-w-md text-center text-[11px] leading-relaxed text-muted sm:text-right">
                © {new Date().getFullYear()} ReListed 
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
