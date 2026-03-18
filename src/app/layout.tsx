import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DP4 — Prontuário Digital de Bruxismo",
  description: "Prontuário clínico digital para diagnóstico e acompanhamento de bruxismo. SIBX - Sociedade Internacional de Bruxismo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-[#07070C] text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
