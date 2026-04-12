/**
 * 实时大屏页面
 * 全屏展示实时评分数据
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loading } from '@/components/common';
import { RealTimeDisplay } from '@/components/admin/stats';
import { getSessionDashboard } from '@/services/session.service';
import type { DashboardResponse } from '@/types/score';

/**
 * RealTimeDashboardPage - 实时大屏页面
 */
export const RealTimeDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 获取实时大屏数据，10秒自动刷新
  const {
    data: dashboard,
    isLoading,
    error,
    refetch,
  } = useQuery<DashboardResponse>({
    queryKey: ['session-dashboard', id],
    queryFn: () => getSessionDashboard(id!),
    enabled: !!id,
    refetchInterval: 10000, // 10秒自动刷新
  });

  // 切换全屏
  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      // 进入全屏
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      // 退出全屏
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // 退出大屏
  const handleExit = () => {
    if (isFullscreen) {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
    navigate(`/admin/stats/sessions/${id}`);
  };

  // 监听全屏变化
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (isLoading) {
    return <Loading text="加载实时数据..." />;
  }

  if (error || !dashboard) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">加载实时数据失败</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <RealTimeDisplay
      data={dashboard}
      isFullscreen={isFullscreen}
      refreshInterval={10}
      autoRefresh={true}
      onRefresh={refetch}
      onExit={handleExit}
      onToggleFullscreen={handleToggleFullscreen}
    />
  );
};

export default RealTimeDashboardPage;
