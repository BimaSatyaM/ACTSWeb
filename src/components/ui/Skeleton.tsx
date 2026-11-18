import React from 'react'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-slate-900/10 ${className}`}
    />
  )
}

export function DashboardWorkspaceSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading workspace">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-900/10 pb-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-7 w-64" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-slate-900/10 bg-[#faf2df] p-4 space-y-2.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-900/10 bg-[#faf2df] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-52" />
          </div>
          <Skeleton className="h-7 w-40" />
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    </div>
  )
}
