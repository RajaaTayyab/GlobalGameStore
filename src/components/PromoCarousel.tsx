"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRegion } from "@/context/RegionContext";
import type { RegionCode } from "@/lib/types";

interface Slide {
  id: string;
  href: string;
  eyebrow: string;
  title: string;
  badge: string;
  subtitle: string;
  image: string;
  imageAlt: string;
  accent: "chrome" | "oxblood";
}

// One promo set per region a Pakistani visitor sees PUBG/Free Fire/Jawaker,
// a US visitor sees PSN USA/Xbox/Apple, a KSA visitor sees PSN KSA/Amazon
// KSA/Netflix KSA, and so on. Falls back to `global` for anything else.
const REGION_SLIDES: Record<RegionCode, Slide[]> = {
  pk: [
    {
      id: "pubg",
      href: "/product/pubg-mobile",
      eyebrow: "PUBG MOBILE GLOBAL",
      title: "UC delivered the second payment clears",
      badge: "Up to 40,500 UC",
      subtitle: "Instant delivery, no waiting for a code by email.",
      image: "/images/pubg-mobile.jpg",
      imageAlt: "PUBG Mobile",
      accent: "chrome",
    },
    {
      id: "freefire",
      href: "/product/free-fire",
      eyebrow: "FREE FIRE",
      title: "Diamonds for every drop, every match",
      badge: "From 0.94 USDT",
      subtitle: "Top up in seconds, straight from your browser.",
      image: "/images/Free-Fire.jpg",
      imageAlt: "Free Fire",
      accent: "oxblood",
    },
    {
      id: "jawaker",
      href: "/product/jawaker",
      eyebrow: "JAWAKER",
      title: "Stack tokens for every table",
      badge: "From 0.87 USDT",
      subtitle: "Card game tokens, delivered instantly.",
      image: "/images/Jawaker.jpeg",
      imageAlt: "Jawaker",
      accent: "chrome",
    },
  ],
  us: [
    {
      id: "psn-us",
      href: "/product/psn",
      eyebrow: "PLAYSTATION NETWORK · USA",
      title: "PSN credit for games, add-ons & subs",
      badge: "$25 – $250",
      subtitle: "USA store wallet top-ups, delivered instantly.",
      image: "/images/psn.png",
      imageAlt: "PlayStation",
      accent: "chrome",
    },
    {
      id: "xbox-us",
      href: "/product/xbox",
      eyebrow: "XBOX GIFT CARD · USA",
      title: "Load up your Xbox wallet",
      badge: "$15 – $100",
      subtitle: "Games, Game Pass, and add-ons on the US store.",
      image: "/images/xbox.png",
      imageAlt: "Xbox",
      accent: "oxblood",
    },
    {
      id: "apple-us",
      href: "/product/itunes",
      eyebrow: "APPLE GIFT CARD",
      title: "App Store & iTunes credit, any amount",
      badge: "$5 – $400",
      subtitle: "Apps, subscriptions, storage, all covered.",
      image: "/images/Apple_Card.png",
      imageAlt: "Apple Gift Card",
      accent: "chrome",
    },
  ],
  sa: [
    {
      id: "psn-ksa",
      href: "/product/psn-ksa",
      eyebrow: "PLAYSTATION NETWORK · KSA",
      title: "PSN credit for the Saudi store",
      badge: "10 – 200 USDT",
      subtitle: "Region-matched PSN wallet top-ups.",
      image: "/images/psn.png",
      imageAlt: "PlayStation",
      accent: "chrome",
    },
    {
      id: "amazon-ksa",
      href: "/product/amazon-ksa",
      eyebrow: "AMAZON · KSA",
      title: "Amazon.sa gift cards, instant delivery",
      badge: "SAR 50 – 500",
      subtitle: "Shop Amazon Saudi Arabia with store credit.",
      image: "/images/Amazon.png",
      imageAlt: "Amazon",
      accent: "oxblood",
    },
    {
      id: "netflix-ksa",
      href: "/product/netflix-ksa",
      eyebrow: "NETFLIX · KSA",
      title: "Keep streaming without a local card",
      badge: "SAR 100 – 300",
      subtitle: "Netflix gift cards for the Saudi region.",
      image: "/images/Netflix.png",
      imageAlt: "Netflix",
      accent: "chrome",
    },
  ],
  ae: [
    {
      id: "psn-uae",
      href: "/product/psn-uae",
      eyebrow: "PLAYSTATION NETWORK · UAE",
      title: "PSN credit for the UAE store",
      badge: "10 – 200 USDT",
      subtitle: "Region-matched PSN wallet top-ups.",
      image: "/images/psn.png",
      imageAlt: "PlayStation",
      accent: "chrome",
    },
    {
      id: "amazon-uae",
      href: "/product/amazon-uae",
      eyebrow: "AMAZON · UAE",
      title: "Amazon.ae gift cards, instant delivery",
      badge: "AED 50 – 500",
      subtitle: "Shop Amazon UAE with store credit.",
      image: "/images/Amazon.png",
      imageAlt: "Amazon",
      accent: "oxblood",
    },
    {
      id: "noon-ae",
      href: "/product/noon-ae",
      eyebrow: "NOON · UAE",
      title: "Noon gift cards for the UAE store",
      badge: "100 – 500 USDT",
      subtitle: "Electronics, fashion and more on Noon.",
      image: "/images/noon.png",
      imageAlt: "Noon",
      accent: "chrome",
    },
  ],
  kw: [
    {
      id: "psn-kw",
      href: "/product/psn-kuwait",
      eyebrow: "PLAYSTATION NETWORK · KUWAIT",
      title: "PSN credit for the Kuwait store",
      badge: "10 – 200 USDT",
      subtitle: "Region-matched PSN wallet top-ups.",
      image: "/images/psn.png",
      imageAlt: "PlayStation",
      accent: "chrome",
    },
    {
      id: "xbox-us-kw",
      href: "/product/xbox",
      eyebrow: "XBOX GIFT CARD",
      title: "Load up your Xbox wallet",
      badge: "$15 – $100",
      subtitle: "Games, Game Pass, and add-ons.",
      image: "/images/xbox.png",
      imageAlt: "Xbox",
      accent: "oxblood",
    },
    {
      id: "apple-kw",
      href: "/product/itunes",
      eyebrow: "APPLE GIFT CARD",
      title: "App Store & iTunes credit, any amount",
      badge: "$5 – $400",
      subtitle: "Apps, subscriptions, storage, all covered.",
      image: "/images/Apple_Card.png",
      imageAlt: "Apple Gift Card",
      accent: "chrome",
    },
  ],
  global: [
    {
      id: "pubg",
      href: "/product/pubg-mobile",
      eyebrow: "PUBG MOBILE GLOBAL",
      title: "UC delivered the second payment clears",
      badge: "Up to 40,500 UC",
      subtitle: "Instant delivery, no waiting for a code by email.",
      image: "/images/pubg-mobile.jpg",
      imageAlt: "PUBG Mobile",
      accent: "chrome",
    },
    {
      id: "freefire",
      href: "/product/free-fire",
      eyebrow: "FREE FIRE",
      title: "Diamonds for every drop, every match",
      badge: "From 0.94 USDT",
      subtitle: "Top up in seconds, straight from your browser.",
      image: "/images/Free-Fire.jpg",
      imageAlt: "Free Fire",
      accent: "oxblood",
    },
    {
      id: "cards",
      href: "/shop?category=psn",
      eyebrow: "GIFT CARDS",
      title: "PlayStation, Xbox & Apple, all regions",
      badge: "USA · KSA · UAE · Kuwait",
      subtitle: "One store credit balance, every region covered.",
      image: "/images/psn.png",
      imageAlt: "PlayStation",
      accent: "chrome",
    },
  ],
};

const AUTOPLAY_MS = 5000;

export default function PromoCarousel() {
  const { region } = useRegion();
  const slides = useMemo(() => REGION_SLIDES[region] ?? REGION_SLIDES.global, [region]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // Region can change client-side (geolocation resolves after first paint),
  // which swaps the slide set always land back on slide 1 when that happens
  // instead of pointing at an index that belonged to the old set.
  useEffect(() => {
    setIndex(0);
  }, [region]);

  const goTo = useCallback(
    (i: number) => {
      setIndex(((i % slides.length) + slides.length) % slides.length);
    },
    [slides.length]
  );

  // Autoplay, paused on hover/drag/touch so it never fights the visitor.
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    dragDeltaX.current = 0;
    setPaused(true);
    trackRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    dragDeltaX.current = e.clientX - dragStartX.current;
  };
  const onPointerUp = () => {
    if (dragStartX.current === null) return;
    const delta = dragDeltaX.current;
    const threshold = 50;
    if (delta > threshold) goTo(index - 1);
    else if (delta < -threshold) goTo(index + 1);
    dragStartX.current = null;
    dragDeltaX.current = 0;
    setPaused(false);
  };

  return (
    <div
      className="group/carousel relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-border shadow-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex touch-pan-y transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {slides.map((slide) => (
          <Link
            key={slide.id}
            href={slide.href}
            draggable={false}
            className="relative flex min-h-[26rem] w-full flex-none select-none flex-col items-center overflow-hidden bg-bg px-6 pb-14 pt-8 sm:h-72 sm:min-h-0 sm:flex-row sm:justify-between sm:gap-10 sm:px-10 sm:py-0 lg:h-80 lg:gap-16"
          >
            {/* Ambient backdrop tone per accent */}
            <div
              className={`pointer-events-none absolute inset-0 ${
                slide.accent === "oxblood"
                  ? "bg-[radial-gradient(ellipse_at_right,rgba(139,26,26,0.35),transparent_60%)]"
                  : "bg-[radial-gradient(ellipse_at_right,rgba(201,175,140,0.22),transparent_60%)]"
              }`}
            />
            <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />

            {/* Text block a normal flex item now (was absolute-positioned
                art + padding-hack on the text, which choked the text down to
                ~128px on any screen since the padding ate into its own
                max-w-md cap, not the actual free space). flex-1 lets it use
                whatever room is really left next to the art. */}
            <div className="relative z-10 w-full min-w-0 flex-1 text-center sm:text-left">
              <p
                className={`font-mono text-xs font-bold tracking-[0.2em] ${
                  slide.accent === "oxblood" ? "text-accent-oxblood" : "text-accent-chrome"
                }`}
              >
                {slide.eyebrow}
              </p>
              <h3 className="mt-2 font-serif text-2xl font-bold leading-tight text-text-primary sm:text-3xl">
                {slide.title}
              </h3>
              <p className="mt-3 text-sm text-text-muted">{slide.subtitle}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                Shop now
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/carousel:translate-x-1" />
              </span>
            </div>

            {/* Art normal flex item too now, not absolutely positioned.
                Big, "cover image" scale as requested, but sitting in flow so
                it can never overlap or steal width from the text. */}
            <div className="relative z-10 h-40 w-40 flex-none rounded-2xl bg-white p-4 shadow-2xl sm:h-60 sm:w-60 lg:h-72 lg:w-72">
              <div className="relative h-full w-full">
                <Image
                  src={slide.image}
                  alt={slide.imageAlt}
                  fill
                  className="object-contain p-3"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Dot pagination */}
      <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-accent-chrome" : "w-2 bg-text-muted/50 hover:bg-text-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
