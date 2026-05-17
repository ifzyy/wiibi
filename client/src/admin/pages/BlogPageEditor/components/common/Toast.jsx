import React, { useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { TOAST_TYPES } from '../../types';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);
  
  const push = useCallback((msg, type = TOAST_TYPES.SUCCESS) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3600);
  }, []);
  
  return { toasts, push };
};

export const ToastStack = ({ toasts }) => (
  <div className="fixed bottom-28 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`flex items-center gap-3 pl-4 pr-5 py-3 rounded-2xl text-[13px] font-semibold shadow-2xl border
          ${t.type === TOAST_TYPES.SUCCESS
            ? "bg-[#0f0f0f] text-white border-white/8"
            : "bg-white text-red-600 border-red-100 shadow-red-100/60"
          }`}
      >
        {t.type === TOAST_TYPES.SUCCESS
          ? <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
          : <AlertCircle size={15} className="text-red-400 shrink-0" />}
        {t.msg}
      </div>
    ))}
  </div>
);