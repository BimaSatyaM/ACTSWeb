'use client'

import React, { useState } from 'react'
import { MacroEventLink } from '@/types/academy'
import realMacroCalendar from '@/data/real_macro_calendar.json'
import { MacroEventModal, EconomicEvent } from '@/components/dashboard/MacroEventModal'

interface MacroEventEmbedProps {
  macroEvent: MacroEventLink
  className?: string
}

// Macro Event Intelligence Embed
// Daylight 2.1 data-terminal table/strip linking lesson concepts to real economic calendar events.
export function MacroEventEmbed({ macroEvent, className = '' }: MacroEventEmbedProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const matchedEvent: EconomicEvent = (realMacroCalendar as EconomicEvent[]).find(
    (e) =>
      e.title.toLowerCase().includes(macroEvent.title.toLowerCase()) ||
      macroEvent.title.toLowerCase().includes(e.title.toLowerCase())
  ) || {
    title: macroEvent.title,
    country: 'USD',
    impact: 'HIGH',
    date_time: macroEvent.releaseDate,
    forecast: macroEvent.forecast || '0.2%',
    previous: macroEvent.previous || '0.2%',
    actual: macroEvent.actual || null,
  }

  const getSourceDetails = (agency: string) => {
    const a = agency.toLowerCase()
    if (a.includes('bls') || a.includes('labor statistics')) {
      return {
        name: 'U.S. Bureau of Labor Statistics (BLS)',
        url: 'https://www.bls.gov/',
      }
    }
    if (a.includes('federal reserve') || a.includes('fed') || a.includes('fomc')) {
      return {
        name: 'Federal Reserve Board & FOMC',
        url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
      }
    }
    if (a.includes('bea') || a.includes('economic analysis') || a.includes('gdp')) {
      return {
        name: 'U.S. Bureau of Economic Analysis (BEA)',
        url: 'https://www.bea.gov/',
      }
    }
    if (a.includes('fred')) {
      return {
        name: 'Federal Reserve Economic Data (FRED)',
        url: 'https://fred.stlouisfed.org/',
      }
    }
    return {
      name: macroEvent.agency,
      url: 'https://fred.stlouisfed.org/',
    }
  }

  const source = getSourceDetails(macroEvent.agency)

  return (
    <>
      <section
        aria-label="Macroeconomic Release Data"
        className={`rounded-xl border border-slate-900/10 bg-[#faf2df] overflow-hidden ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900/10 bg-[#f3ead2]/50 p-4 sm:px-5">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {matchedEvent.title}
            </h4>
            <p className="text-xs text-slate-500">
              Source: {source.name}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="h-8 rounded-lg border border-slate-900/15 bg-[#faf2df] px-3 text-xs font-semibold text-slate-800 transition-colors hover:bg-[#f3ead2] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0284c7] self-start sm:self-center cursor-pointer"
          >
            Open calendar release
          </button>
        </div>

        <div className="grid grid-cols-3 divide-x divide-slate-900/10 border-b border-slate-900/10 bg-[#fdfaf3]">
          <div className="p-3.5 sm:px-5">
            <span className="block text-xs font-medium text-slate-500">Release date</span>
            <span className="mt-1 block text-sm font-bold text-slate-900 font-mono tabular-nums">
              {new Date(matchedEvent.date_time).toISOString().slice(0, 10)}
            </span>
          </div>

          <div className="p-3.5 sm:px-5">
            <span className="block text-xs font-medium text-slate-500">Consensus forecast</span>
            <span className="mt-1 block text-sm font-bold text-slate-900 font-mono tabular-nums">
              {matchedEvent.forecast || macroEvent.forecast || '-'}
            </span>
          </div>

          <div className="p-3.5 sm:px-5">
            <span className="block text-xs font-medium text-slate-500">Prior print</span>
            <span className="mt-1 block text-sm font-bold text-slate-700 font-mono tabular-nums">
              {matchedEvent.previous || macroEvent.previous || '-'}
            </span>
          </div>
        </div>

        <div className="p-4 sm:px-5 space-y-2 text-xs text-slate-700 leading-relaxed">
          <p>{macroEvent.historicalBtcImpact}</p>
          <div className="pt-1">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0369a1] underline underline-offset-2 hover:text-[#0284c7] font-semibold"
            >
              Official data series ({source.name})
            </a>
          </div>
        </div>
      </section>

      {isModalOpen && (
        <MacroEventModal
          event={matchedEvent}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}
