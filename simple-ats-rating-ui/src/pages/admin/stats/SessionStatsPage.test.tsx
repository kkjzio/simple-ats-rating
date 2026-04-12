import { describe, expect, test, mock, beforeEach, spyOn } from 'bun:test';
import statisticsService from '@/services/statistics.service';

describe('SessionStatsPage handleExport', () => {
  beforeEach(() => {
    mock.restore();
  });

  test('exportSessionScoreDetail is called with session id and blob is downloaded', async () => {
    const fakeBlob = new Blob(['xlsx']);
    const exportSpy = spyOn(statisticsService, 'exportSessionScoreDetail').mockResolvedValue(fakeBlob);
    const downloadSpy = spyOn(statisticsService, 'downloadExcelBlob').mockImplementation(() => {});

    await statisticsService.exportSessionScoreDetail('session-abc');
    statisticsService.downloadExcelBlob(fakeBlob, 'session-abc_scores_detail.xlsx');

    expect(exportSpy).toHaveBeenCalledWith('session-abc');
    expect(downloadSpy).toHaveBeenCalledWith(fakeBlob, 'session-abc_scores_detail.xlsx');
  });
});
