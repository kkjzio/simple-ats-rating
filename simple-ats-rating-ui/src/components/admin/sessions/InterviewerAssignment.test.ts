import { describe, expect, test } from 'bun:test';
import { SessionStatus } from '@/types';
import { getInterviewerItemClassName } from './InterviewerAssignment';

describe('getInterviewerItemClassName', () => {
  test('uses muted style for archived session', () => {
    const archivedClass = getInterviewerItemClassName(SessionStatus.ARCHIVED);
    expect(archivedClass).toContain('opacity-60');
    expect(archivedClass).toContain('bg-muted/30');

    const draftClass = getInterviewerItemClassName(SessionStatus.DRAFT);
    expect(draftClass).not.toContain('opacity-60');
  });
});
