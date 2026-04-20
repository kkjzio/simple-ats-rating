/**
 * UI状态管理
 */

import { create } from 'zustand';
import type { Toast, ToastType, ConfirmOptions } from '../types';

interface UIState {
  // 侧边栏状态
  sidebarCollapsed: boolean;
  
  // 加载状态
  globalLoading: boolean;
  
  // Toast通知列表
  toasts: Toast[];
  
  // 确认对话框
  confirmDialog: {
    open: boolean;
    options: ConfirmOptions | null;
    onConfirm: (() => void) | null;
    onCancel: (() => void) | null;
  };
  
  // 操作
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  showConfirm: (
    options: ConfirmOptions,
    onConfirm: () => void,
    onCancel?: () => void
  ) => void;
  closeConfirm: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // 初始状态
  sidebarCollapsed: true,
  globalLoading: false,
  toasts: [],
  confirmDialog: {
    open: false,
    options: null,
    onConfirm: null,
    onCancel: null,
  },
  
  // 切换侧边栏
  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },
  
  // 设置侧边栏折叠状态
  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed });
  },
  
  // 设置全局加载状态
  setGlobalLoading: (loading: boolean) => {
    set({ globalLoading: loading });
  },
  
  // 显示Toast通知
  showToast: (
    type: ToastType,
    message: string,
    title?: string,
    duration?: number
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = {
      id,
      type,
      message,
      title,
      duration: duration || 3000,
    };
    
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));
    
    // 自动移除
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, toast.duration);
    }
  },
  
  // 移除Toast通知
  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  
  // 清除所有Toast通知
  clearToasts: () => {
    set({ toasts: [] });
  },
  
  // 显示确认对话框
  showConfirm: (
    options: ConfirmOptions,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    set({
      confirmDialog: {
        open: true,
        options,
        onConfirm,
        onCancel: onCancel || null,
      },
    });
  },
  
  // 关闭确认对话框
  closeConfirm: () => {
    set({
      confirmDialog: {
        open: false,
        options: null,
        onConfirm: null,
        onCancel: null,
      },
    });
  },
}));
