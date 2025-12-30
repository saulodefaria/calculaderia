import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getLocale } from "next-intl/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  // Default metadata - will be overridden by locale-specific layouts
  return {
    title: {
      default: "Calculadoras Financeiras",
      template: "%s | Calculadoras Financeiras",
    },
    description: "Ferramentas gratuitas para cálculos financeiros: financiamento, consórcio, aluguel, e muito mais.",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  // Map locale codes to HTML lang attribute values
  const htmlLang = locale === "pt-br" ? "pt-BR" : locale;

  return (
    <html lang={htmlLang}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
