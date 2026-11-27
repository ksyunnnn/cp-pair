import { AnimatePresence, m } from "motion/react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { FADE, OFFSET, SPRING } from "../styles/motion.ts";
import { CpSymbol } from "./symbols.tsx";

export type ToastKind = "success" | "info" | "warn";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const ToastContext = createContext<(message: string, kind?: ToastKind, durationMs?: number) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const push = useCallback((message: string, kind: ToastKind = "success", durationMs = 2800) => {
    const id = ++seq.current;
    setItems((prev) => [...prev.slice(-1), { id, kind, message }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), durationMs);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="cp-toasts" aria-live="polite">
        {/* 上から spring で出て止まり、消えるときは同じ向きへ短く引く。reduced motion では opacity だけ */}
        <AnimatePresence>
          {items.map((t) => (
            <m.div
              key={t.id}
              className={`cp-toast cp-toast--${t.kind}`}
              role={t.kind === "warn" ? "alert" : "status"}
              initial={{ opacity: 0, y: OFFSET.toastY, scale: OFFSET.toastScale }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { default: SPRING.toast, opacity: FADE.quick } }}
              exit={{ opacity: 0, y: OFFSET.toastY, scale: OFFSET.toastScale, transition: FADE.out }}
            >
              <span className="cp-toast__icon">
                {t.kind === "success" && <CpSymbol name="Done" size={14} color="var(--text-inverse)" />}
                {t.kind === "info" && <CpSymbol name="Talk" size={16} eyeColor="var(--surface-sunken)" />}
                {t.kind === "warn" && <CpSymbol name="Secret" size={14} color="var(--text-inverse)" eyeColor="var(--accent)" />}
              </span>
              <span className="t-label">{t.message}</span>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
