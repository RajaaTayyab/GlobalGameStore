"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Outside a provider (e.g. server-rendered fallback): no-op.
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    } as ToastContextValue;
  }
  return ctx;
}

const TONE_STYLES: Record<ToastTone, { wrap: string; icon: string; Icon: typeof CheckCircle2 }> = {
  success: {
    wrap: "border-instock/40 bg-instock/15 text-instock",
    icon: "text-instock",
    Icon: CheckCircle2,
  },
  error: {
    wrap: "border-red-500/40 bg-red-500/15 text-red-300",
    icon: "text-red-400",
    Icon: AlertTriangle,
  },
  info: {
    wrap: "border-accent-chrome/40 bg-accent-chrome/15 text-accent-chrome",
    icon: "text-accent-chrome",
    Icon: Info,
  },
};

const AUTO_DISMISS_MS = 3500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, tone, message }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  const value: ToastContextValue = {
    show,
    success: (m) => show(m, "success"),
    error: (m) => show(m, "error"),
    info: (m) => show(m, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  // Mount on client only to avoid SSR mismatches; safe to render the
  // container unconditionally because empty arrays are fine.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((t) => {
        const style = TONE_STYLES[t.tone];
        const { Icon } = style;
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex animate-fade-up items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${style.wrap}`}
          >
            <Icon className={`mt-0.5 h-4 w-4 flex-none ${style.icon}`} />
            <p className="flex-1 leading-snug">{t.message}</p>
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
              className="flex-none rounded-md p-0.5 text-current/70 transition hover:bg-black/10 hover:text-current"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
