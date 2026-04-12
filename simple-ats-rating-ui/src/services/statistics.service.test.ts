import { describe, expect, test, mock } from 'bun:test';
import apiClient from './api';
import statisticsService from './statistics.service';


describe('statisticsService export apis', () => {
  test('calls overview export endpoint with blob response', async () => {
    const fakeBlob = new Blob(['xlsx']);
    const postSpy = mock(() => Promise.resolve({ data: fakeBlob }));
    (apiClient as any).post = postSpy;

    const result = await statisticsService.exportScoresBySessions(['s1', 's2']);

    expect(result).toBe(fakeBlob);
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith(
      '/exports/stats/scores',
      { session_ids: ['s1', 's2'] },
      { responseType: 'blob' }
    );
  });

  test('calls session detail export endpoint with blob response', async () => {
    const fakeBlob = new Blob(['xlsx']);
    const postSpy = mock(() => Promise.resolve({ data: fakeBlob }));
    (apiClient as any).post = postSpy;

    const result = await statisticsService.exportSessionScoreDetail('session-1');

    expect(result).toBe(fakeBlob);
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith(
      '/exports/stats/sessions/session-1/scores-detail',
      undefined,
      { responseType: 'blob' }
    );
  });
});
