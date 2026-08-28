import type { Metadata } from "next";
import { Instrument_Serif, Karla, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { RegionProvider } from "@/context/RegionContext";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getRegionFromCookie } from "@/lib/region";
import { getWhatsappNumber } from "@/lib/settings";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const splineMono = Spline_Sans_Mono({
  variable: "--font-spline-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "GlobalGameStore - Game Top-ups, Gift Cards & Digital Keys",
    template: "%s | GlobalGameStore",
  },
  description:
    "Buy game top-ups, gift cards, and digital keys instantly with fast and secure delivery. Play more, wait less.",
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialRegion = await getRegionFromCookie();
  const whatsappPhone = await getWhatsappNumber();

  return (
    <html
      lang="en"
      className={`${karla.variable} ${splineMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="ambient-particles pointer-events-none fixed inset-0 z-0" aria-hidden="true" />
        <div className="relative z-10 flex w-full grow flex-col">
          <RegionProvider initialRegion={initialRegion}>
            <CartProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <CartDrawer />
              <WhatsAppFloat phone={whatsappPhone} />
            </CartProvider>
          </RegionProvider>
        </div>
      </body>
    </html>
  );
}
