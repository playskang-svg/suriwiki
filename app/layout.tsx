import type { Metadata } from "next";
import { Noto_Sans_KR, Inter } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";

const notoSansKr = Noto_Sans_KR({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  preload: false,
  display: "swap",
  variable: "--font-noto",
});

const inter = Inter({
  weight: ["600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    template: `%s | ${siteConfig.brand.name}`,
    default: `${siteConfig.brand.name} - ${siteConfig.brand.tagline}`,
  },
  description: siteConfig.brand.tagline,
  openGraph: {
    title: siteConfig.brand.name,
    description: siteConfig.brand.tagline,
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${inter.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface font-body-md antialiased">
        {children}
      </body>
    </html>
  );
}
