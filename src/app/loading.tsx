import React from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="min-h-full bg-[#edf7fe] py-12" aria-busy="true" aria-label="Loading page">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-7 space-y-6 pt-2">
          <Skeleton className="h-3 w-64" />
          <div className="space-y-3">
            <Skeleton className="h-14 w-11/12" />
            <Skeleton className="h-14 w-8/12" />
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full max-w-xl" />
            <Skeleton className="h-4 w-4/5 max-w-lg" />
          </div>
          <div className="flex gap-4 pt-2">
            <Skeleton className="h-12 w-44 rounded-xl" />
            <Skeleton className="h-12 w-40 rounded-xl" />
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-900/10 bg-[#faf2df] p-6 space-y-5">
            <div className="flex justify-between">
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-[220px] w-full rounded-xl" />
            <div className="grid grid-cols-3 gap-4 border-t border-slate-900/10 pt-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
