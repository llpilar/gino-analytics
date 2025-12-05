import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen w-full bg-background p-4 pt-24">
      {/* Mobile Grid Layout Skeleton */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-surface-elevated" />
            <Skeleton className="h-4 w-32 bg-surface-elevated" />
          </div>
          <Skeleton className="h-10 w-24 rounded-full bg-surface-elevated" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 md:p-6 rounded-2xl bg-surface-elevated border border-border/50 space-y-3"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl bg-muted" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-20 bg-muted" />
                  <Skeleton className="h-2 w-16 bg-muted" />
                </div>
              </div>
              <Skeleton className="h-8 w-full bg-muted" />
              <Skeleton className="h-3 w-24 bg-muted" />
            </div>
          ))}
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Area */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-surface-elevated border border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32 bg-muted" />
              <Skeleton className="h-8 w-24 rounded-full bg-muted" />
            </div>
            <Skeleton className="h-64 w-full rounded-xl bg-muted" />
          </div>

          {/* Side Panel */}
          <div className="p-6 rounded-2xl bg-surface-elevated border border-border/50 space-y-4">
            <Skeleton className="h-5 w-28 bg-muted" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                  <Skeleton className="h-8 w-8 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-24 bg-muted" />
                    <Skeleton className="h-2 w-16 bg-muted" />
                  </div>
                  <Skeleton className="h-4 w-12 bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
