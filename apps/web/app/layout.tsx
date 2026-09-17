import type { Metadata } from "next";
import { Golos_Text, Unbounded } from "next/font/google";
import "./globals.css";

const body = Golos_Text({
  variable: "--font-body",
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Unbounded({
  variable: "--font-display",
  subsets: ["cyrillic", "latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TakeStart",
  description: "Витрины для малого бизнеса с заказом через WhatsApp",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-body">{children}</body>
    </html>
  );
}
