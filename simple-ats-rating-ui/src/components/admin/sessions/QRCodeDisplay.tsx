/**
 * 二维码显示组件
 * 用于显示场次二维码，支持刷新和下载
 */

import { useRef } from 'react';
import QRCodeLib from 'react-qr-code';
import { RefreshCw, Download, Copy } from 'lucide-react';

// 提取实际的组件
const QRCode = (QRCodeLib as any).default || QRCodeLib;

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import type { QRCodeResponse } from '@/types';

interface QRCodeDisplayProps {
  qrCodeData?: QRCodeResponse;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

/**
 * 二维码显示组件
 */
export function QRCodeDisplay({
  qrCodeData,
  onRefresh,
  isRefreshing = false,
}: QRCodeDisplayProps) {
  const { success, error } = useToast();
  const qrCodeRef = useRef<HTMLDivElement>(null);

  /**
   * 复制Token到剪贴板
   */
  const handleCopyToken = async () => {
    if (!qrCodeData?.qr_code_token) return;

    try {
      await navigator.clipboard.writeText(qrCodeData.qr_code_token);
      success('Token已复制到剪贴板', '复制成功');
    } catch (err) {
      error('请手动复制Token', '复制失败');
    }
  };

  /**
   * 下载二维码
   */
  const handleDownload = () => {
    if (!qrCodeRef.current) return;

    const svg = qrCodeRef.current.querySelector('svg');
    if (!svg) return;

    // 创建canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置canvas尺寸
    const size = 512;
    canvas.width = size;
    canvas.height = size;

    // 将SVG转换为图片
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);

      // 下载图片
      canvas.toBlob((blob) => {
        if (!blob) return;
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `session-qrcode-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(downloadUrl);
      });

      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  /**
   * 格式化过期时间
   */
  const formatExpiresAt = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (!qrCodeData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>场次二维码</CardTitle>
          <CardDescription>暂无二维码数据</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            请先生成二维码
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>场次二维码</CardTitle>
        <CardDescription>
          评委可扫描此二维码加入场次
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 二维码显示 */}
        <div className="flex justify-center">
          <div
            ref={qrCodeRef}
            className="rounded-lg border p-4 bg-white"
          >
            <QRCode
              value={qrCodeData.qr_code_token}
              size={256}
              level="H"
            />
          </div>
        </div>

        {/* Token信息 */}
        <div className="space-y-2">
          <Label>场次Token</Label>
          <div className="flex gap-2">
            <Input
              value={qrCodeData.qr_code_token}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyToken}
              title="复制Token"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 过期时间 */}
        {qrCodeData.expires_at && (
          <div className="text-sm text-muted-foreground">
            过期时间: {formatExpiresAt(qrCodeData.expires_at)}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex-1"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              刷新二维码
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDownload}
            className="flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            下载二维码
          </Button>
        </div>

        {/* 使用说明 */}
        <div className="rounded-lg bg-muted p-4 text-sm">
          <p className="font-medium mb-2">使用说明：</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>评委使用微信或其他扫码工具扫描二维码</li>
            <li>或手动输入Token加入场次</li>
            <li>二维码有效期为24小时，过期后需要刷新</li>
            <li>可以下载二维码图片分享给评委</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
