import type { Metadata } from "next";
import "./globals.css";
import { RegionProvider } from "@/context/RegionContext";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { getRegionFromCookie } from "@/lib/region";

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

  return (
    <html
      lang="en"
      className="h-full antialiased"
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
            </CartProvider>
          </RegionProvider>
        </div>
      </body>
    </html>
  );
}
