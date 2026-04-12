import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { SessionStatus } from '@/types';
import {
  getExportButtonLabel,
  getExportActionType,
} from './StatsOverviewPage';


describe('StatsOverviewPage export mode helpers', () => {
  test('getExportButtonLabel returns 导出 when not selecting', () => {
    expect(getExportButtonLabel(false, false, 0)).toBe('导出');
  });

  test('getExportButtonLabel returns 取消 when selecting', () => {
    expect(getExportButtonLabel(true, false, 0)).toBe('取消');
  });

  test('getExportButtonLabel returns 导出中... when exporting', () => {
    expect(getExportButtonLabel(true, true, 2)).toBe('导出中...');
  });

  test('getExportButtonLabel returns 确认导出(N) when selecting with items', () => {
    expect(getExportButtonLabel(true, false, 3)).toBe('确认导出 (3)');
  });

  test('getExportActionType returns enter-select when not selecting', () => {
    expect(getExportActionType(false, 0)).toBe('enter-select');
  });

  test('getExportActionType returns cancel when selecting with 0 selected', () => {
    expect(getExportActionType(true, 0)).toBe('cancel');
  });

  test('getExportActionType returns confirm when selecting with items', () => {
    expect(getExportActionType(true, 2)).toBe('confirm');
  });
});
