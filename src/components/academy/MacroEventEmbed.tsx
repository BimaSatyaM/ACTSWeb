'use client'

import React, { useState } from 'react'
import { MacroEventLink } from '@/types/academy'
import realMacroCalendar from '@/data/real_macro_calendar.json'
import { MacroEventModal, EconomicEvent } from '@/components/dashboard/MacroEventModal'

interface MacroEventEmbedProps {
  macroEvent: MacroEventLink
  className?: string
}

/**
 * Macro Event Intelligence Embed
 * Flat data-terminal table/strip linking lesson concepts to real economic calendar events.
 */
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
        className={`rounded-lg border border-[#1a2030] bg-[#0a0f1a] overflow-hidden ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1a2030] p-4 sm:px-5">
          <div>
            <h4 className="text-sm font-semibold text-white">
              {matchedEvent.title}
            </h4>
            <p className="text-xs text-[#94a3b8]">
              Source: {source.name}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="h-8 rounded border border-[#262f45] bg-[#070b14] px-3 text-xs font-medium text-white transition-colors hover:bg-[#141b29] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff2e54] self-start sm:self-center"
          >
            Open calendar release
          </button>
        </div>

        {/* Divided 3-column metrics strip */}
        <div className="grid grid-cols-3 divide-x divide-[#1a2030] border-b border-[#1a2030] bg-[#070b14]">
          <div className="p-3.5 sm:px-5">
            <span className="block text-xs text-[#94a3b8]">Release date</span>
            <span className="mt-1 block text-sm font-medium text-white [font-variant-numeric:tabular-nums]">
              {new Date(matchedEvent.date_time).toISOString().slice(0, 10)}
            </span>
          </div>

          <div className="p-3.5 sm:px-5">
            <span className="block text-xs text-[#94a3b8]">Consensus forecast</span>
            <span className="mt-1 block text-sm font-medium text-white [font-variant-numeric:tabular-nums]">
              {matchedEvent.forecast || macroEvent.forecast || '—'}
            </span>
          </div>

          <div className="p-3.5 sm:px-5">
            <span className="block text-xs text-[#94a3b8]">Prior print</span>
            <span className="mt-1 block text-sm font-medium text-[#cbd5e1] [font-variant-numeric:tabular-nums]">
              {matchedEvent.previous || macroEvent.previous || '—'}
            </span>
          </div>
        </div>

        <div className="p-4 sm:px-5 space-y-2 text-xs text-[#cbd5e1] leading-relaxed">
          <p>{macroEvent.historicalBtcImpact}</p>
          <div className="pt-1">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline underline-offset-2 hover:text-[#cbd5e1]"
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
