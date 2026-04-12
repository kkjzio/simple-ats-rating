/**
 * 确认对话框组件
 * 基于@radix-ui/react-alert-dialog和shadcn/ui
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useUIStore } from "@/stores"
import { cn } from "@/lib/utils"

/**
 * 确认对话框组件
 * 用于显示需要用户确认的操作
 */
export const ConfirmDialog = () => {
  const { confirmDialog, closeConfirm } = useUIStore()

  const handleConfirm = () => {
    if (confirmDialog.onConfirm) {
      confirmDialog.onConfirm()
    }
    closeConfirm()
  }

  const handleCancel = () => {
    if (confirmDialog.onCancel) {
      confirmDialog.onCancel()
    }
    closeConfirm()
  }

  if (!confirmDialog.options) {
    return null
  }

  const { title, message, confirmText, cancelText, confirmType } = confirmDialog.options

  return (
    <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {cancelText || '取消'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={cn(
              confirmType === 'danger' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
              confirmType === 'warning' && 'bg-yellow-600 text-white hover:bg-yellow-700'
            )}
          >
            {confirmText || '确认'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDialog
