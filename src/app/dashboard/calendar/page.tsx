'use client'

import React from 'react'
import { CalendarGrid } from '@/components/dashboard/CalendarGrid'

export default function CalendarPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Performance Calendar</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Full-month historical aggregation of model signals, target hits, and daily net outcomes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-muted px-2.5 py-1 bg-white/[0.03] border border-white/[0.06]">
            UTC Day Aggregations
          </span>
        </div>
      </div>

      {/* ── Full Width Interactive Calendar ── */}
      <div className="pt-1">
        <CalendarGrid />
      </div>
    </div>
  )
}
