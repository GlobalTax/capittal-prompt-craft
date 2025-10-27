import { useQuery } from '@tanstack/react-query';
import { dashboardRepository } from '@/repositories/DashboardRepository';

export function useDashboardStats(userId: string | undefined) {
  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', userId],
    queryFn: () => dashboardRepository.getValuationStats(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const trendsQuery = useQuery({
    queryKey: ['dashboard-trends', userId],
    queryFn: () => dashboardRepository.getMonthlyTrends(userId!, 6),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const typeDistributionQuery = useQuery({
    queryKey: ['dashboard-type-distribution', userId],
    queryFn: () => dashboardRepository.getTypeDistribution(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const financialSummaryQuery = useQuery({
    queryKey: ['dashboard-financial-summary', userId],
    queryFn: () => dashboardRepository.getFinancialSummary(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const recentValuationsQuery = useQuery({
    queryKey: ['dashboard-recent-valuations', userId],
    queryFn: () => dashboardRepository.getRecentValuations(userId!, 5),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });

  const isLoading = 
    statsQuery.isLoading || 
    trendsQuery.isLoading || 
    typeDistributionQuery.isLoading ||
    financialSummaryQuery.isLoading ||
    recentValuationsQuery.isLoading;

  return {
    stats: statsQuery.data,
    trends: trendsQuery.data,
    typeDistribution: typeDistributionQuery.data,
    financialSummary: financialSummaryQuery.data,
    recentValuations: recentValuationsQuery.data,
    loading: isLoading,
    refetch: () => {
      statsQuery.refetch();
      trendsQuery.refetch();
      typeDistributionQuery.refetch();
      financialSummaryQuery.refetch();
      recentValuationsQuery.refetch();
    }
  };
}
