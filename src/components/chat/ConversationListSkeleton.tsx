const rows = [
  { nameWidth: 'w-28', msgWidth: 'w-44' },
  { nameWidth: 'w-20', msgWidth: 'w-36' },
  { nameWidth: 'w-32', msgWidth: 'w-52' },
  { nameWidth: 'w-24', msgWidth: 'w-40' },
  { nameWidth: 'w-28', msgWidth: 'w-32' },
  { nameWidth: 'w-16', msgWidth: 'w-48' },
]

export const ConversationListSkeleton = () => (
  <div className="min-h-screen bg-background pb-24 flex flex-col">
    {/* Header */}
    <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
        <div className="h-7 w-28 rounded bg-muted animate-pulse" />
        <div className="w-5 h-5 rounded bg-muted animate-pulse" />
      </div>
    </div>

    {/* Rows */}
    <div className="flex-1">
      <div className="max-w-2xl mx-auto w-full divide-y divide-border">
        {rows.map((row, i) => (
          <div key={i} className="w-full px-4 py-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className={`h-4 rounded bg-muted animate-pulse ${row.nameWidth}`} />
                <div className="h-3 w-10 rounded bg-muted animate-pulse" />
              </div>
              <div className={`h-3 rounded bg-muted animate-pulse ${row.msgWidth}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)
