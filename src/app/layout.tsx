import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RegionProvider } from "@/context/RegionContext";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { getRegionFromCookie } from "@/lib/region";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GlobalGameStore - Game Top-ups, Gift Cards & Digital Keys",
    template: "%s | GlobalGameStore",
  },
  description:
    "Buy game top-ups, gift cards, and digital keys instantly with fast and secure delivery. Play more, wait less.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const initialRegion = await getRegionFromCookie();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <RegionProvider initialRegion={initialRegion}>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
          </CartProvider>
        </RegionProvider>
      </body>
    </html>
  );
}
