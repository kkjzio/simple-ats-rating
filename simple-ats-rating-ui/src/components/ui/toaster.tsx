import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"
import { ToastType } from "@/types"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function (toast) {
        // 根据类型映射到shadcn/ui的variant
        const variant = toast.type === ToastType.ERROR 
          ? 'destructive' 
          : toast.type === ToastType.SUCCESS 
          ? 'success' 
          : 'default'

        return (
          <Toast key={toast.id} variant={variant}>
            <div className="grid gap-1">
              {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
              {toast.message && (
                <ToastDescription>{toast.message}</ToastDescription>
              )}
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
