import { Skeleton } from "@/components/ui/skeleton";

export default function GuideLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Intro box */}
      <Skeleton className="h-28 rounded-2xl w-full" />

      {/* Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border rounded-2xl p-5 space-y-4 bg-card">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
            <Skeleton className="h-14 rounded-xl w-full" />
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <div className="flex justify-center pt-4">
        <Skeleton className="h-12 w-48 rounded-2xl" />
      </div>
    </div>
  );
}
