import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { ActionResult } from "../state/store";

/** 极简 hash 路由：列表视图 #/ 与详情 #/specimen/SP-001，刷新后保留。 */
export function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash || "#/");
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

export function navigate(path: string) {
  window.location.hash = path;
}

/* ---------------- Toast ---------------- */

interface Toast extends ActionResult {
  id: number;
}

const ToastCtx = createContext<(r: ActionResult) => void>(() => {});

let toastSeq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((r: ActionResult) => {
    const id = ++toastSeq;
    setToasts((t) => [...t, { ...r, id }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 6500);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.ok ? "ok" : "bad"}`}>
            <div className="toast-head">
              <b>{t.title}</b>
              <button
                aria-label="关闭提示"
                onClick={() => setToasts((x) => x.filter((q) => q.id !== t.id))}
              >
                ×
              </button>
            </div>
            {t.detail && <p>{t.detail}</p>}
            {t.problems && t.problems.length > 0 && (
              <ul>
                {t.problems.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
