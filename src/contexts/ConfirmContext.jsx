import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null,
    isDestructive: false
  });

  const confirm = useCallback(({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDestructive = false }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        isDestructive,
        onConfirm: () => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {confirmState.isOpen && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={confirmState.onCancel}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl p-8 text-center"
            >
              <div className={`mx-auto h-16 w-16 mb-6 rounded-3xl flex items-center justify-center ${confirmState.isDestructive ? 'bg-red-50 text-red-500' : 'bg-primary-50 text-primary-500'}`}>
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 tracking-tight mb-2">
                {confirmState.title}
              </h3>
              <p className="text-slate-500 text-sm font-medium mb-8">
                {confirmState.message}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={confirmState.onCancel}
                  className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 font-semibold text-xs tracking-widest uppercase rounded-2xl hover:bg-slate-100 transition-all"
                >
                  {confirmState.cancelText}
                </button>
                <button
                  onClick={confirmState.onConfirm}
                  className={`flex-1 px-6 py-4 font-semibold text-xs tracking-widest uppercase rounded-2xl transition-all shadow-lg ${
                    confirmState.isDestructive 
                      ? 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600'
                      : 'bg-primary-600 text-white shadow-primary-600/20 hover:bg-primary-700'
                  }`}
                >
                  {confirmState.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};
