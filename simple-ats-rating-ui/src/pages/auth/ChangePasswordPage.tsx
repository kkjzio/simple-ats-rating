import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { authService } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

/**
 * 密码要求检查项组件
 */
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <X className="h-3 w-3 text-gray-400" />
      )}
      <span className={met ? 'text-green-600' : 'text-gray-500'}>
        {text}
      </span>
    </div>
  );
}

// 密码强度验证规则
const passwordStrengthRules = {
  minLength: (password: string) => password.length >= 8,
  hasUpperCase: (password: string) => /[A-Z]/.test(password),
  hasLowerCase: (password: string) => /[a-z]/.test(password),
  hasNumber: (password: string) => /\d/.test(password),
  hasSpecialChar: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
};

// 计算密码强度（0-100）
const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;
  
  let strength = 0;
  const rules = Object.values(passwordStrengthRules);
  const passedRules = rules.filter(rule => rule(password)).length;
  
  strength = (passedRules / rules.length) * 100;
  return strength;
};

// 获取密码强度文本和颜色
const getPasswordStrengthInfo = (strength: number): { text: string; color: string } => {
  if (strength === 0) return { text: '', color: '' };
  if (strength < 40) return { text: '弱', color: 'bg-red-500' };
  if (strength < 70) return { text: '中等', color: 'bg-yellow-500' };
  return { text: '强', color: 'bg-green-500' };
};

// 修改密码表单验证schema
const changePasswordSchema = z.object({
  oldPassword: z.string()
    .min(1, '请输入当前密码'),
  newPassword: z.string()
    .min(8, '新密码至少8个字符')
    .regex(/[A-Z]/, '新密码必须包含大写字母')
    .regex(/[a-z]/, '新密码必须包含小写字母')
    .regex(/\d/, '新密码必须包含数字')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, '新密码必须包含特殊字符'),
  confirmPassword: z.string()
    .min(1, '请确认新密码'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
}).refine((data) => data.oldPassword !== data.newPassword, {
  message: '新密码不能与当前密码相同',
  path: ['newPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

/**
 * 修改密码页面组件
 * 提供修改密码功能，包括密码强度指示器、显示/隐藏密码等
 */
export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // 初始化表单
  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // 监听新密码变化，更新密码强度
  const newPassword = form.watch('newPassword');
  const strength = calculatePasswordStrength(newPassword);
  const strengthInfo = getPasswordStrengthInfo(strength);

  // 处理提交
  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setIsLoading(true);
      
      // 调用修改密码接口
      await authService.changePassword({
        old_password: data.oldPassword,
        new_password: data.newPassword,
        confirm_password: data.confirmPassword,
      });

      // 成功提示
      success('密码修改成功，请重新登录', '修改成功');

      // 延迟跳转到登录页
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      // 失败提示
      showError(err.message || '密码修改失败，请重试', '修改失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          
          {/* 标题 */}
          <div>
            <CardTitle className="text-2xl font-bold">修改密码</CardTitle>
            <CardDescription className="mt-2">
              请输入当前密码和新密码
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* 当前密码输入 */}
              <FormField
                control={form.control}
                name="oldPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>当前密码</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showOldPassword ? 'text' : 'password'}
                          placeholder="请输入当前密码"
                          autoComplete="current-password"
                          disabled={isLoading}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          disabled={isLoading}
                        >
                          {showOldPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 新密码输入 */}
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>新密码</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="请输入新密码"
                          autoComplete="new-password"
                          disabled={isLoading}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setPasswordStrength(calculatePasswordStrength(e.target.value));
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          disabled={isLoading}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    
                    {/* 密码强度指示器 */}
                    {newPassword && (
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">密码强度</span>
                          <span className={`font-medium ${
                            strength < 40 ? 'text-red-500' : 
                            strength < 70 ? 'text-yellow-500' : 
                            'text-green-500'
                          }`}>
                            {strengthInfo.text}
                          </span>
                        </div>
                        <Progress 
                          value={strength} 
                          className="h-2"
                        />
                        
                        {/* 密码要求检查列表 */}
                        <div className="space-y-1 text-xs">
                          <PasswordRequirement 
                            met={passwordStrengthRules.minLength(newPassword)}
                            text="至少8个字符"
                          />
                          <PasswordRequirement 
                            met={passwordStrengthRules.hasUpperCase(newPassword)}
                            text="包含大写字母"
                          />
                          <PasswordRequirement 
                            met={passwordStrengthRules.hasLowerCase(newPassword)}
                            text="包含小写字母"
                          />
                          <PasswordRequirement 
                            met={passwordStrengthRules.hasNumber(newPassword)}
                            text="包含数字"
                          />
                          <PasswordRequirement 
                            met={passwordStrengthRules.hasSpecialChar(newPassword)}
                            text="包含特殊字符"
                          />
                        </div>
                      </div>
                    )}
                    
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 确认密码输入 */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>确认新密码</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="请再次输入新密码"
                          autoComplete="new-password"
                          disabled={isLoading}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 按钮组 */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(-1)}
                  disabled={isLoading}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      修改中...
                    </>
                  ) : (
                    '确认修改'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
