import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Figtree } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { LATEST_YEAR } from "@/lib/dataset-meta";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const figtree = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prénoms — l'almanach des prénoms français",
  description: `Un siècle de prénoms français (INSEE, 1900–${LATEST_YEAR}). Cherchez, comparez, partagez d'un simple lien.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${fraunces.variable} ${figtree.variable} font-body antialiased`}
      >
        <NuqsAdapter>
          <Suspense>{children}</Suspense>
        </NuqsAdapter>
      </body>
    </html>
  );
}
