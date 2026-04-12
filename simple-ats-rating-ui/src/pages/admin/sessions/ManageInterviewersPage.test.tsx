import { describe, expect, test } from 'bun:test';
import { SessionStatus } from '@/types';
import { canManageInterviewers } from './ManageInterviewersPage';

describe('canManageInterviewers', () => {
  test('returns true only for draft status', () => {
    expect(canManageInterviewers(SessionStatus.DRAFT)).toBe(true);
    expect(canManageInterviewers(SessionStatus.ACTIVE)).toBe(false);
    expect(canManageInterviewers(SessionStatus.COMPLETED)).toBe(false);
    expect(canManageInterviewers(SessionStatus.ARCHIVED)).toBe(false);
  });
});
