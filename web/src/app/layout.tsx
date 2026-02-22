import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Header } from "@/components/header";
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
  title: "Prénoms de France — Explorez les tendances",
  description:
    "Recherchez, comparez et partagez les tendances des prénoms français de 1900 à 2022 (données INSEE).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NuqsAdapter>
          <Suspense>
            <Header />
            <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
          </Suspense>
        </NuqsAdapter>
      </body>
    </html>
  );
}
