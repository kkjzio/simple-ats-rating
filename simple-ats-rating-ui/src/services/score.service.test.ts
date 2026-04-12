import { describe, expect, test } from 'bun:test';
import { mapMyCandidatesResponse } from './score.service';

describe('mapMyCandidatesResponse', () => {
  test('仅有 pending_count 时，draft 应由 candidates 中 draft 状态统计', () => {
    const backendData = {
      session: { session_id: 's1', name: '场次A' },
      candidates: [
        { candidate_id: 'c1', name: '张三', score_status: 'pending' },
        { candidate_id: 'c2', name: '李四', score_status: 'draft' },
        { candidate_id: 'c3', name: '王五', score_status: 'submitted' },
      ],
      progress: { total_candidates: 3, completed_count: 1, pending_count: 2 },
    };

    const result = mapMyCandidatesResponse(backendData, 's1');

    expect(result.total).toBe(3);
    expect(result.completed).toBe(1);
    expect(result.draft).toBe(1);
  });

  test('存在 draft_count 时优先使用 draft_count', () => {
    const backendData = {
      session: { session_id: 's2', name: '场次B' },
      candidates: [
        { candidate_id: 'c1', name: '甲', score_status: 'pending' },
        { candidate_id: 'c2', name: '乙', score_status: 'draft' },
      ],
      progress: { total_candidates: 5, completed_count: 2, pending_count: 3, draft_count: 2 },
    };

    const result = mapMyCandidatesResponse(backendData, 's2');
    expect(result.total).toBe(5);
    expect(result.completed).toBe(2);
    expect(result.draft).toBe(2);
  });
});
