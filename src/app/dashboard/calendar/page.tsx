'use client'

import React from 'react'
import { CalendarGrid } from '@/components/dashboard/CalendarGrid'

export default function CalendarPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-slate-900/10 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Performance Calendar</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Full-month historical aggregation of model signals, target hits, and daily net outcomes.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500">
          UTC Day Aggregations
        </span>
      </div>

      <div className="pt-1">
        <CalendarGrid />
      </div>
    </div>
  )
}
