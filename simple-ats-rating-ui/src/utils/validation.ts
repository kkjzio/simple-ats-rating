/**
 * 验证工具函数
 */

/**
 * 验证邮箱格式
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证手机号格式（中国大陆）
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * 验证密码强度
 * 要求：8-20位，必须包含大小写字母、数字和特殊字符
 */
export const isValidPassword = (password: string): boolean => {
  if (password.length < 8 || password.length > 20) {
    return false;
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
};

/**
 * 获取密码强度提示
 */
export const getPasswordStrengthMessage = (password: string): string => {
  if (password.length < 8) {
    return '密码长度至少8位';
  }
  if (password.length > 20) {
    return '密码长度最多20位';
  }
  
  const missing: string[] = [];
  
  if (!/[A-Z]/.test(password)) {
    missing.push('大写字母');
  }
  if (!/[a-z]/.test(password)) {
    missing.push('小写字母');
  }
  if (!/\d/.test(password)) {
    missing.push('数字');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    missing.push('特殊字符');
  }
  
  if (missing.length > 0) {
    return `密码必须包含${missing.join('、')}`;
  }
  
  return '';
};

/**
 * 验证用户名格式
 * 要求：3-50位，只能包含字母、数字、下划线
 */
export const isValidUsername = (username: string): boolean => {
  if (username.length < 3 || username.length > 50) {
    return false;
  }
  
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return usernameRegex.test(username);
};

/**
 * 验证分数范围
 */
export const isValidScore = (score: number, min: number = 0, max: number = 100): boolean => {
  return score >= min && score <= max;
};

/**
 * 验证必填字段
 */
export const isRequired = (value: any): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  return true;
};

/**
 * 验证字符串长度
 */
export const isValidLength = (
  value: string,
  min?: number,
  max?: number
): boolean => {
  const length = value.length;
  
  if (min !== undefined && length < min) {
    return false;
  }
  
  if (max !== undefined && length > max) {
    return false;
  }
  
  return true;
};

/**
 * 验证数字范围
 */
export const isInRange = (
  value: number,
  min?: number,
  max?: number
): boolean => {
  if (min !== undefined && value < min) {
    return false;
  }
  
  if (max !== undefined && value > max) {
    return false;
  }
  
  return true;
};

/**
 * 验证URL格式
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 验证日期格式（YYYY-MM-DD）
 */
export const isValidDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }
  
  const d = new Date(date);
  return !isNaN(d.getTime());
};

/**
 * 验证日期不能为过去时间
 */
export const isNotPastDate = (date: string): boolean => {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return d >= today;
};
