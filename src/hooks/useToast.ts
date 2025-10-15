import { useState, useCallback } from 'react';
import { Toast, ToastType } from '../components/shared/Toast';

interface ShowToastOptions {
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface UseToastReturn {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, options?: ShowToastOptions) => string;
  showSuccess: (message: string, options?: ShowToastOptions) => string;
  showError: (message: string, options?: ShowToastOptions) => string;
  showWarning: (message: string, options?: ShowToastOptions) => string;
  showInfo: (message: string, options?: ShowToastOptions) => string;
  closeToast: (id: string) => void;
  clearAllToasts: () => void;
}

/**
 * Custom hook for managing toast notifications
 * 
 * Features:
 * - Multiple toast types (success, error, warning, info)
 * - Auto-dismiss with configurable duration
 * - Manual dismiss functionality
 * - Action buttons support
 * - Unique IDs for each toast
 * - Helper methods for common toast types
 */
export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((
    type: ToastType,
    message: string,
    options: ShowToastOptions = {}
  ): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const toast: Toast = {
      id,
      type,
      message,
      title: options.title,
      duration: options.duration,
      action: options.action,
    };

    setToasts(prev => [...prev, toast]);
    return id;
  }, []);

  const closeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Helper methods for common toast types
  const showSuccess = useCallback((message: string, options?: ShowToastOptions) => {
    return showToast('success', message, options);
  }, [showToast]);

  const showError = useCallback((message: string, options?: ShowToastOptions) => {
    return showToast('error', message, options);
  }, [showToast]);

  const showWarning = useCallback((message: string, options?: ShowToastOptions) => {
    return showToast('warning', message, options);
  }, [showToast]);

  const showInfo = useCallback((message: string, options?: ShowToastOptions) => {
    return showToast('info', message, options);
  }, [showToast]);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeToast,
    clearAllToasts,
  };
};
