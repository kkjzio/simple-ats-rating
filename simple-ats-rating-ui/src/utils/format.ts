/**
 * 格式化工具函数
 */

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @param format 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
 */
export const formatDate = (
  date: string | Date | null | undefined,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * 格式化日期为相对时间
 * @param date 日期字符串或Date对象
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) {
    return formatDate(d, 'YYYY-MM-DD');
  } else if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else if (minutes > 0) {
    return `${minutes}分钟前`;
  } else {
    return '刚刚';
  }
};

/**
 * 格式化数字
 * @param num 数字
 * @param decimals 小数位数，默认2位
 */
export const formatNumber = (num: number | null | undefined, decimals: number = 2): string => {
  if (num === null || num === undefined) return '';
  return num.toFixed(decimals);
};

/**
 * 格式化百分比
 * @param num 数字（0-100）
 * @param decimals 小数位数，默认1位
 */
export const formatPercent = (num: number | null | undefined, decimals: number = 1): string => {
  if (num === null || num === undefined) return '';
  return `${num.toFixed(decimals)}%`;
};

/**
 * 格式化文件大小
 * @param bytes 字节数
 */
export const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * 格式化手机号
 * @param phone 手机号
 */
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // 隐藏中间4位
  if (phone.length === 11) {
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
  
  return phone;
};

/**
 * 格式化邮箱
 * @param email 邮箱
 */
export const formatEmail = (email: string | null | undefined): string => {
  if (!email) return '';
  
  // 隐藏部分字符
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  
  const [name, domain] = parts;
  if (!name || name.length <= 3) {
    return email;
  }
  
  const visibleChars = Math.ceil(name.length / 3);
  const hiddenPart = '*'.repeat(name.length - visibleChars);
  
  return `${name.substring(0, visibleChars)}${hiddenPart}@${domain}`;
};

/**
 * 截断文本
 * @param text 文本
 * @param maxLength 最大长度
 * @param suffix 后缀，默认'...'
 */
export const truncate = (
  text: string | null | undefined,
  maxLength: number,
  suffix: string = '...'
): string => {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * 首字母大写
 * @param str 字符串
 */
export const capitalize = (str: string | null | undefined): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * 格式化分数
 * @param score 分数
 * @param maxScore 最高分
 */
export const formatScore = (
  score: number | null | undefined,
  maxScore?: number
): string => {
  if (score === null || score === undefined) return '';
  
  const formattedScore = formatNumber(score, 1);
  
  if (maxScore) {
    return `${formattedScore}/${maxScore}`;
  }
  
  return formattedScore;
};
