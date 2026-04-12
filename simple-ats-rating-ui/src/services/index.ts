/**
 * 服务统一导出
 */

export { default as apiClient } from './api';
export { default as authService } from './auth.service';
export { default as userService } from './user.service';
export { default as templateService } from './template.service';
export { default as sessionService } from './session.service';
export { default as candidateService } from './candidate.service';
export { default as scoreService } from './score.service';
export { default as statisticsService } from './statistics.service';
export { default as logService } from './log.service';

// 导出所有服务方法
export * from './auth.service';
export * from './user.service';
export * from './template.service';
export * from './session.service';
export * from './candidate.service';
export * from './score.service';
export * from './statistics.service';
export * from './log.service';
