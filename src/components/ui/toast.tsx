'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { gsap } from '@/lib/animations/gsap-config';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <Check className="size-3.5 text-emerald-400" />,
  error: <X className="size-3.5 text-red-400" />,
  warning: <AlertTriangle className="size-3.5 text-amber-400" />,
  info: <Info className="size-3.5 text-blue-400" />,
};

const bgColors: Record<ToastType, string> = {
  success: 'border-emerald-500/15 bg-emerald-500/[0.06]',
  error: 'border-red-500/15 bg-red-500/[0.06]',
  warning: 'border-amber-500/15 bg-amber-500/[0.06]',
  info: 'border-blue-500/15 bg-blue-500/[0.06]',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col-reverse gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast: t }: { toast: Toast }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 12, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'deyaSmooth' }
    );
  }, []);

  return (
    <div
      ref={ref}
      className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-2.5 shadow-2xl backdrop-blur-xl ${bgColors[t.type]}`}
    >
      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.06]">
        {icons[t.type]}
      </div>
      <span className="text-[13px] font-medium text-white/80">{t.message}</span>
    </div>
  );
}
