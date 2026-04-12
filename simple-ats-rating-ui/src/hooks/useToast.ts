/**
 * Toast通知Hook
 */

import { useUIStore } from '../stores';
import { ToastType } from '../types';

/**
 * 使用Toast通知
 */
export const useToast = () => {
  const { toasts, showToast, removeToast, clearToasts } = useUIStore();
  
  /**
   * 显示成功消息
   */
  const success = (message: string, title?: string, duration?: number) => {
    showToast(ToastType.SUCCESS, message, title, duration);
  };
  
  /**
   * 显示错误消息
   */
  const error = (message: string, title?: string, duration?: number) => {
    showToast(ToastType.ERROR, message, title, duration);
  };
  
  /**
   * 显示警告消息
   */
  const warning = (message: string, title?: string, duration?: number) => {
    showToast(ToastType.WARNING, message, title, duration);
  };
  
  /**
   * 显示信息消息
   */
  const info = (message: string, title?: string, duration?: number) => {
    showToast(ToastType.INFO, message, title, duration);
  };
  
  return {
    toasts,
    success,
    error,
    warning,
    info,
    remove: removeToast,
    clear: clearToasts,
  };
};
