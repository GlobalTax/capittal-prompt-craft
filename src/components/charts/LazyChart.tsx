import { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load individual Recharts components
const RechartsBarChart = lazy(() => 
  import('recharts').then(module => ({ default: module.BarChart }))
);
const RechartsLineChart = lazy(() => 
  import('recharts').then(module => ({ default: module.LineChart }))
);
const RechartsPieChart = lazy(() => 
  import('recharts').then(module => ({ default: module.PieChart }))
);
const RechartsBar = lazy(() => 
  import('recharts').then(module => ({ default: module.Bar }))
);
const RechartsLine = lazy(() => 
  import('recharts').then(module => ({ default: module.Line }))
);
const RechartsPie = lazy(() => 
  import('recharts').then(module => ({ default: module.Pie }))
);
const RechartsXAxis = lazy(() => 
  import('recharts').then(module => ({ default: module.XAxis }))
);
const RechartsYAxis = lazy(() => 
  import('recharts').then(module => ({ default: module.YAxis }))
);
const RechartsCartesianGrid = lazy(() => 
  import('recharts').then(module => ({ default: module.CartesianGrid }))
);
const RechartsTooltip = lazy(() => 
  import('recharts').then(module => ({ default: module.Tooltip }))
);
const RechartsResponsiveContainer = lazy(() => 
  import('recharts').then(module => ({ default: module.ResponsiveContainer }))
);
const RechartsLegend = lazy(() => 
  import('recharts').then(module => ({ default: module.Legend }))
);
const RechartsCell = lazy(() => 
  import('recharts').then(module => ({ default: module.Cell }))
);

// Chart loading skeleton
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="w-full" style={{ height }}>
    <Skeleton className="w-full h-full rounded-lg" />
  </div>
);

// Wrapper component to handle Suspense
function withSuspense<P extends object>(
  Component: ComponentType<P>,
  fallback: React.ReactNode = <ChartSkeleton />
) {
  return (props: P) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}

// Export lazy-loaded chart components
export const LazyBarChart = withSuspense(RechartsBarChart);
export const LazyLineChart = withSuspense(RechartsLineChart);
export const LazyPieChart = withSuspense(RechartsPieChart);
export const LazyBar = withSuspense(RechartsBar);
export const LazyLine = withSuspense(RechartsLine);
export const LazyPie = withSuspense(RechartsPie);
export const LazyXAxis = withSuspense(RechartsXAxis);
export const LazyYAxis = withSuspense(RechartsYAxis);
export const LazyCartesianGrid = withSuspense(RechartsCartesianGrid);
export const LazyTooltip = withSuspense(RechartsTooltip);
export const LazyResponsiveContainer = withSuspense(RechartsResponsiveContainer);
export const LazyLegend = withSuspense(RechartsLegend);
export const LazyCell = withSuspense(RechartsCell);

// Convenience exports for common chart patterns
export { ChartSkeleton };
