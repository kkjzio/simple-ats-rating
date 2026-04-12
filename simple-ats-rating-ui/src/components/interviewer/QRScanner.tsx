/**
 * 二维码扫描组件
 * 用于评委扫码绑定场次
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Keyboard } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface QRScannerProps {
  /** 是否打开对话框 */
  open: boolean;
  /** 关闭对话框回调 */
  onClose: () => void;
  /** 扫描成功回调 */
  onSuccess: (token: string) => void;
}

/**
 * 二维码扫描组件
 */
export const QRScanner: React.FC<QRScannerProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { error } = useToast();
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 处理手动输入提交
   */
  const handleManualSubmit = async () => {
    if (!token.trim()) {
      error('请输入场次Token', '错误');
      return;
    }

    setIsLoading(true);
    try {
      await onSuccess(token.trim());
      setToken('');
    } catch (error: any) {
      error(error.message || '无效的Token或场次已过期', '绑定失败');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理对话框关闭
   */
  const handleClose = () => {
    setToken('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>绑定场次</DialogTitle>
          <DialogDescription>
            扫描管理员提供的二维码或手动输入Token来绑定场次
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan" disabled>
              <QrCode className="mr-2 h-4 w-4" />
              扫描二维码
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Keyboard className="mr-2 h-4 w-4" />
              手动输入
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <QrCode className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                摄像头扫描功能暂不可用
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                请切换到"手动输入"标签页
              </p>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">场次Token</Label>
              <Input
                id="token"
                placeholder="请输入管理员提供的Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleManualSubmit();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Token通常是一串字母和数字组成的字符串
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button onClick={handleManualSubmit} disabled={isLoading}>
                {isLoading ? '绑定中...' : '确认绑定'}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default QRScanner;
