import { Check, Clock, PackageCheck, X, CreditCard, ShoppingBag } from "lucide-react";

type Status = "pending" | "paid" | "completed" | "cancelled";

interface Props {
  status: Status;
  createdAt: string;
}

/**
 * Vertical timeline shown on each order: Placed → Paid → Delivered.
 * Cancelled orders get a single inline cancelled state instead.
 */
export default function OrderTimeline({ status, createdAt }: Props) {
  if (status === "cancelled") {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-300">
        <X className="h-4 w-4" />
        <span className="font-semibold">Order cancelled</span>
      </div>
    );
  }

  const steps: { key: "placed" | "paid" | "delivered"; label: string; Icon: typeof Check; at?: string }[] = [
    { key: "placed", label: "Placed", Icon: ShoppingBag, at: createdAt },
    { key: "paid", label: "Paid", Icon: CreditCard },
    { key: "delivered", label: "Delivered", Icon: PackageCheck },
  ];

  const reached = (k: "placed" | "paid" | "delivered") => {
    if (k === "placed") return true;
    if (k === "paid") return status === "paid" || status === "completed";
    if (k === "delivered") return status === "completed";
    return false;
  };

  return (
    <ol className="mt-5 grid grid-cols-3 gap-2 sm:gap-4">
      {steps.map((s, i) => {
        const done = reached(s.key);
        const isLast = i === steps.length - 1;
        return (
          <li key={s.key} className="relative">
            <div className="flex flex-col items-center text-center">
              <div
                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                  done
                    ? "border-instock bg-instock text-white shadow-lg shadow-instock/30"
                    : s.key === "placed"
                    ? "border-accent-chrome bg-accent-chrome text-bg shadow-lg shadow-accent-chrome/30"
                    : "border-border bg-bg text-text-muted"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : s.key === "placed" ? <Clock className="h-4 w-4" /> : <s.Icon className="h-4 w-4" />}
              </div>
              <p
                className={`mt-2 text-xs font-semibold uppercase tracking-wider ${
                  done ? "text-instock" : "text-text-muted"
                }`}
              >
                {s.label}
              </p>
              {s.at && (
                <p className="mt-0.5 text-[10px] text-text-muted">
                  {new Date(s.at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
            {!isLast && (
              <div
                className={`absolute left-[calc(50%+1.1rem)] top-4 hidden h-0.5 w-[calc(100%-2.2rem)] sm:block ${
                  reached(steps[i + 1].key) ? "bg-instock" : "bg-border"
                }`}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
