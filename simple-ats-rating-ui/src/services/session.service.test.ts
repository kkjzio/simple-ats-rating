import { describe, expect, test, mock } from 'bun:test';
import apiClient from './api';
import { removeInterviewer } from './session.service';

describe('removeInterviewer', () => {
  test('calls DELETE /sessions/:sessionId/interviewers/:interviewerId', async () => {
    const deleteSpy = mock(() => Promise.resolve({} as any));
    (apiClient as any).delete = deleteSpy;

    await removeInterviewer('s1', 'u1');

    expect(deleteSpy).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalledWith('/sessions/s1/interviewers/u1');
  });
});
