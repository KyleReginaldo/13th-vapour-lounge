export function AdminPageSkeleton() {
  return (
    <div className="p-4 md:p-8 animate-pulse">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-40 bg-gray-200 rounded-md" />
        <div className="h-9 w-32 bg-gray-200 rounded-md" />
      </div>

      {/* Filter / search bar */}
      <div className="flex gap-3 mb-4">
        <div className="h-9 w-64 bg-gray-200 rounded-md" />
        <div className="h-9 w-32 bg-gray-200 rounded-md" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="flex gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50">
          {[20, 25, 20, 15, 10].map((w, i) => (
            <div
              key={i}
              className="h-4 bg-gray-200 rounded"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="flex gap-4 px-4 py-4 border-b border-gray-100 last:border-0"
          >
            {[20, 25, 20, 15, 10].map((w, colIdx) => (
              <div
                key={colIdx}
                className="h-4 bg-gray-100 rounded"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
