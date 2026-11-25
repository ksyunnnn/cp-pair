import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { CpSymbol } from "./symbols.tsx";

export type ToastKind = "success" | "info" | "warn";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const push = useCallback((message: string, kind: ToastKind = "success") => {
    const id = ++seq.current;
    setItems((prev) => [...prev.slice(-1), { id, kind, message }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2800);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="cp-toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`cp-toast cp-toast--${t.kind}`} role={t.kind === "warn" ? "alert" : "status"}>
            <span className="cp-toast__icon">
              {t.kind === "success" && <CpSymbol name="Done" size={14} color="var(--cp-paper)" />}
              {t.kind === "info" && <CpSymbol name="Talk" size={16} eyeColor="var(--cp-soft)" />}
              {t.kind === "warn" && <CpSymbol name="Secret" size={14} color="var(--cp-paper)" eyeColor="var(--cp-accent)" />}
            </span>
            <span className="t-label">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
