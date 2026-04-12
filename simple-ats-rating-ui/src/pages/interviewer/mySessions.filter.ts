import type { MySessionItem } from '@/services/score.service';

export const filterMySessions = (
  sessions: MySessionItem[],
  statusFilter: string,
  searchKeyword: string
): MySessionItem[] => {
  let result = sessions;

  if (statusFilter !== 'all') {
    result = result.filter((session) => session.status === statusFilter);
  }

  if (searchKeyword) {
    const keyword = searchKeyword.toLowerCase();
    result = result.filter(
      (session) =>
        session.name.toLowerCase().includes(keyword) ||
        session.position.toLowerCase().includes(keyword)
    );
  }

  return result;
};
