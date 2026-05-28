import { Skeleton } from "@/components/ui/skeleton";

export default function InsightsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">
          <Skeleton className="h-8 w-48" />
        </h1>
        <Skeleton className="h-4 w-72" />
      </div>

      {/* AI Summary Card (Large Card) */}
      <Skeleton className="h-60 rounded-3xl w-full" />

      {/* Insights List */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl w-full" />
        ))}
      </div>

      {/* Average Monthly Report Grid */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* AI Financial Projection Card */}
      <Skeleton className="h-44 rounded-2xl w-full" />

      {/* Recommended Spending 50/30/20 Comparison split */}
      <div className="border rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-card/65">
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-16" /></div>
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
