import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * 404页面
 * 当用户访问不存在的页面时显示
 */
export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardContent className="pt-12 pb-12">
          <div className="text-center space-y-6">
            {/* 404图标 */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="text-9xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  404
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Search className="h-16 w-16 text-gray-300" />
                </div>
              </div>
            </div>

            {/* 错误信息 */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                页面未找到
              </h1>
              <p className="text-gray-600 max-w-md mx-auto">
                抱歉，您访问的页面不存在或已被移除。请检查URL是否正确，或返回首页继续浏览。
              </p>
            </div>

            {/* 可能的原因 */}
            <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto">
              <h3 className="font-medium text-gray-900 mb-3">可能的原因：</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>您输入的网址有误</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>该页面已被删除或移动</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>您没有访问该页面的权限</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>链接已过期</span>
                </li>
              </ul>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                size="lg"
                onClick={() => navigate(-1)}
                variant="outline"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                返回上一页
              </Button>
              <Button
                size="lg"
                onClick={() => navigate('/')}
                className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Home className="h-4 w-4" />
                返回首页
              </Button>
            </div>

            {/* 帮助信息 */}
            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                如果您认为这是一个错误，请联系系统管理员
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
