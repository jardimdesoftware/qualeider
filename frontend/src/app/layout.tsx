import type { Metadata } from "next";
import { Open_Sans, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

// Open Sans é a tipografia oficial da marca do Instituto Federal
// (Manual de Aplicação da Marca, Rede Federal/MEC).
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuaLeiDer | IFPE",
  description: "Centralizador de informacoes sobre a qualidade do leite",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${openSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <QueryProvider>
          <Toaster position="top-right" />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
