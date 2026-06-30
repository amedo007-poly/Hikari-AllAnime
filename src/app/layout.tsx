import type { Metadata, Viewport } from "next";
import { Onest, Geist_Mono } from "next/font/google";
import "./globals.css";
import RegisterSW from "../components/RegisterSW";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Hikari",
  description: "Anime, your way.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Hikari" },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e17",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${onest.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
