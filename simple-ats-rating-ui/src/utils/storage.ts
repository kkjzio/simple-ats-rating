/**
 * localStorage封装
 * 用于保存和获取token等数据
 */

const TOKEN_KEY = 'ats_access_token';
const REFRESH_TOKEN_KEY = 'ats_refresh_token';
const USER_KEY = 'ats_user_info';
const AUTH_STORE_KEY = 'auth-storage'; // Zustand persist 的 key

/**
 * 保存token
 */
export const setToken = (accessToken: string, refreshToken?: string): void => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

/**
 * 获取访问token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * 获取刷新token
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * 移除token
 */
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * 保存用户信息
 */
export const setUserInfo = (userInfo: any): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
};

/**
 * 获取用户信息
 */
export const getUserInfo = (): any | null => {
  const userInfo = localStorage.getItem(USER_KEY);
  return userInfo ? JSON.parse(userInfo) : null;
};

/**
 * 移除用户信息
 */
export const removeUserInfo = (): void => {
  localStorage.removeItem(USER_KEY);
};

/**
 * 清除所有存储数据（含 Zustand 持久化状态）
 */
export const clearStorage = (): void => {
  removeToken();
  removeUserInfo();
  localStorage.removeItem(AUTH_STORE_KEY);
};

/**
 * 保存数据到localStorage
 */
export const setItem = <T>(key: string, value: T): void => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

/**
 * 从localStorage获取数据
 */
export const getItem = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

/**
 * 从localStorage移除数据
 */
export const removeItem = (key: string): void => {
  localStorage.removeItem(key);
};
