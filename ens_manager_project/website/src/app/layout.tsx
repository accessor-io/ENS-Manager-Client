import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Navigation from "@/components/Navigation";
import "./globals.css";
import { ENSProvider } from '../contexts/ENSContext';

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "ENS Manager",
  description: "Next-generation ENS domain management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} scroll-smooth`}>
      <body className="bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 min-h-screen text-white antialiased">
        <div className="relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          <Navigation />
          <main className="relative pt-16">
            <ENSProvider>
              {children}
            </ENSProvider>
          </main>
        </div>
      </body>
    </html>
  );
}
