import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReviewLens AI — Turn Customer Reviews into Verifiable Product Insights",
  description:
    "Upload review CSVs, PDFs, and screenshots. AI extracts sentiment and provides clickable citations back to every source review.",
  openGraph: {
    title: "ReviewLens AI — Turn Customer Reviews into Verifiable Product Insights",
    description:
      "Upload review CSVs, PDFs, and screenshots. AI extracts sentiment and provides clickable citations back to every source review.",
    siteName: "ReviewLens AI",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="font-[family-name:var(--font-body)] antialiased">
        {children}
      </body>
    </html>
  );
}
