import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DP4 — Prontuário Digital de Bruxismo",
  description: "Prontuário clínico digital para diagnóstico e acompanhamento de bruxismo. SIBX - Sociedade Internacional de Bruxismo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
