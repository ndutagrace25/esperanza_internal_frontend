import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/StoreProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Esperanza - Digital Solutions",
  description: "Esperanza Internal Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} font-sans antialiased`}>
        <StoreProvider>
          <AuthGuard>{children}</AuthGuard>
        </StoreProvider>
      </body>
    </html>
  );
}
