import { createContext, useContext } from 'react';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Toast toasts={toast.toasts} dismiss={toast.dismiss} />
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useAppToast must be used within a ToastProvider');
  return ctx;
}
