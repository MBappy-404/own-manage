import { Skeleton } from "@/components/ui/skeleton";

export default function ExpensesLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      {/* Charts Grid 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>

      {/* Charts Grid 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>

      {/* Expense List Card */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <div className="border rounded-2xl overflow-hidden">
          <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <Skeleton className="h-6 w-48" />
            <div className="flex gap-2 w-full sm:w-auto">
              <Skeleton className="h-9 w-32 rounded-lg flex-1 sm:flex-none" />
              <Skeleton className="h-9 w-32 rounded-lg flex-1 sm:flex-none" />
              <Skeleton className="h-9 w-32 rounded-lg flex-1 sm:flex-none" />
            </div>
          </div>
          <div className="divide-y">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3.5 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
