import { describe, expect, test } from 'bun:test';
import { filterMySessions } from './mySessions.filter';

describe('filterMySessions', () => {
  const sessions = [
    { id: '1', name: 'Java后端一面', position: '后端', status: 'active' },
    { id: '2', name: '前端终面', position: '前端', status: 'completed' },
  ];

  test('按状态过滤 active', () => {
    const result = filterMySessions(sessions as any, 'active', '');
    expect(result.map((item: any) => item.id)).toEqual(['1']);
  });

  test('按关键词过滤 position/name', () => {
    const result = filterMySessions(sessions as any, 'all', '前端');
    expect(result.map((item: any) => item.id)).toEqual(['2']);
  });

  test('先状态再关键词过滤', () => {
    const result = filterMySessions(sessions as any, 'completed', '前');
    expect(result.map((item: any) => item.id)).toEqual(['2']);
  });
});
