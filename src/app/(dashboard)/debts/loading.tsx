import { Skeleton } from "@/components/ui/skeleton";

export default function DebtsLoading() {
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>

      {/* Debts Table Placeholder */}
      <div className="border rounded-2xl overflow-hidden bg-card">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b bg-muted/10">
                <th className="px-6 py-4"><Skeleton className="h-4 w-10" /></th>
                <th className="px-6 py-4"><Skeleton className="h-4 w-20" /></th>
                <th className="px-6 py-4"><Skeleton className="h-4 w-16" /></th>
                <th className="px-6 py-4"><Skeleton className="h-4 w-28" /></th>
                <th className="px-6 py-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></th>
                <th className="px-6 py-4 text-center"><Skeleton className="h-4 w-14 mx-auto" /></th>
                <th className="px-6 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/30">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="w-8 h-8 rounded-full" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  <td className="px-6 py-4 text-center"><Skeleton className="h-5 w-16 rounded-full mx-auto" /></td>
                  <td className="px-6 py-4 text-right"><Skeleton className="h-6 w-20 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
