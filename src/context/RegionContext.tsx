"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { COUNTRY_TO_REGION } from "@/lib/constants";
import type { RegionCode } from "@/lib/types";

const STORAGE_KEY = "gts-region";

interface RegionContextValue {
  region: RegionCode;
  detected: boolean;
  setRegion: (r: RegionCode) => void;
}

const RegionContext = createContext<RegionContextValue>({
  region: "global",
  detected: false,
  setRegion: () => {},
});

async function detectRegion(): Promise<RegionCode> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("https://ipapi.co/json/", {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return "global";
    const data = await res.json();
    const code = data?.country_code as string | undefined;
    return (code && COUNTRY_TO_REGION[code]) || "global";
  } catch {
    return "global";
  }
}

function readStoredRegion(): RegionCode | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY) as RegionCode | null;
  return stored && ["pk", "mena", "us", "global"].includes(stored) ? stored : null;
}

export function RegionProvider({
  children,
  initialRegion = null,
}: {
  children: ReactNode;
  initialRegion?: RegionCode | null;
}) {
  const [region, setRegionState] = useState<RegionCode>(initialRegion ?? "global");
  const [detected, setDetected] = useState(initialRegion != null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      const stored = readStoredRegion();
      if (stored !== null && stored !== initialRegion) {
        setRegionState(stored);
        setDetected(true);
        return;
      }
      if (initialRegion) return;
      detectRegion().then((r) => {
        if (!cancelled) {
          setRegionState(r);
          setDetected(true);
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [initialRegion]);

  const setRegion = useCallback((r: RegionCode) => {
    localStorage.setItem(STORAGE_KEY, r);
    document.cookie = `${STORAGE_KEY}=${r};path=/;max-age=2592000;samesite=lax`;
    setRegionState(r);
  }, []);

  return (
    <RegionContext.Provider value={{ region, detected, setRegion }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  return useContext(RegionContext);
}
