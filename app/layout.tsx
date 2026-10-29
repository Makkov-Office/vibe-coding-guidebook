import type { Metadata } from "next";
import "./tokens.css";
import "./globals.css";
import "./motion.css";
import "../src/design/home-route.css";
import "../src/design/tool-reviews.css";
import "../src/design/product-logos.css";
import "../src/design/primitives.css";
// Глобально, не в компоненте: <link> из компонента поднимается в <head>, и vinext пропускает фокус main#reader после навигации.
import "../src/design/chapter-template.css";
import "../src/design/home.css";
import "../src/components/drill.css";
import "../src/design/glossary.css";
import "../src/design/page-hero.css";
import {brandTitle} from "../src/design/brand";
import {uiPrefsScript} from "../src/design/ui-prefs.mjs";

export const metadata: Metadata = {
  title: brandTitle,
  description: "Русскоязычное руководство по управляемой разработке с AI: контекст, агенты, evidence, review и интеграция.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The inline script applies the stored theme and animation choice before the first paint (P3-04);
    // it changes attributes of <html>, hence suppressHydrationWarning.
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html:uiPrefsScript}} />
        <link rel="preload" href="/fonts/geist-cyrillic-400-600.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/geist-latin-400-600.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
