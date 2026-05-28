import { Skeleton } from "@/components/ui/skeleton";

export default function AccountsLoading() {
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

      {/* Content Layout */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Balance Card Skeleton */}
        <Skeleton className="md:col-span-1 h-36 rounded-2xl" />

        {/* Individual Wallet/Account Cards Skeleton */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[80px] rounded-2xl" />
          ))}
        </div>
      </section>
    </div>
  );
}
