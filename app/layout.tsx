import type { Metadata } from "next";
import "./globals.css";
import "../src/design/home-route.css";
import {brandTitle} from "../src/design/brand";

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
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
