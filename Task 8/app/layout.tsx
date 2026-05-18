import type { Metadata } from "next";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Task 8 Auth App",
  description: "Next.js authentication flow with MongoDB and Server Actions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentYear = new Date().getFullYear();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-slate-100">
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">

              <span className="font-semibold text-slate-800">Mustafa Auth</span>
            </div>
            <p>Copyright {currentYear} Mustafa. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
