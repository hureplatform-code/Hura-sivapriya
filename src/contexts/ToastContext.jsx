import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'success', duration = 4000 }) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((current) => [...current, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const success = useCallback((message, duration) => addToast({ message, type: 'success', duration }), [addToast]);
  const error = useCallback((message, duration) => addToast({ message, type: 'error', duration }), [addToast]);
  const warning = useCallback((message, duration) => addToast({ message, type: 'warning', duration }), [addToast]);
  const info = useCallback((message, duration) => addToast({ message, type: 'info', duration }), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-3 w-full max-w-md pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const icons = {
              success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
              error: <XCircle className="h-5 w-5 text-slate-500" />,
              warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
              info: <Info className="h-5 w-5 text-blue-500" />
            };

            const colors = {
              success: 'bg-emerald-50 border-emerald-100',
              error: 'bg-slate-900 border-slate-700 text-white',
              warning: 'bg-amber-50 border-amber-100',
              info: 'bg-blue-50 border-blue-100'
            };

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border w-auto pointer-events-auto ${colors[toast.type]}`}
              >
                {icons[toast.type]}
                <p className={`text-sm font-medium ${
                  toast.type === 'error' ? 'text-white' :
                  toast.type === 'success' ? 'text-emerald-800' :
                  toast.type === 'warning' ? 'text-amber-800' :
                  'text-blue-800'
                }`}>
                  {toast.message}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
