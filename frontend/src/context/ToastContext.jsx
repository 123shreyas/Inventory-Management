import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  return useContext(ToastContext);
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-6 py-4 rounded-xl shadow-lg border flex items-center gap-3 transform transition-all duration-300 animate-in slide-in-from-right-8 fade-in ${
              toast.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : toast.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-100'
                : 'bg-white text-slate-800 border-slate-200'
            }`}
          >
            <div className={`h-2 w-2 rounded-full animate-pulse ${
              toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-slate-500'
            }`} />
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
            <button 
              onClick={() => removeToast(toast.id)}
              className="ml-4 opacity-50 hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
