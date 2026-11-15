import React from 'react'
import { PrimarySource } from '@/types/academy'

export interface LegendQuote {
  quote: string
  attribution: string
  sourceTitle: string
  sourceUrl: string
  yearOrContext?: string
}

export interface LegendProfile {
  name: string
  title: string
  trackRecord: string
  category: 'INVESTOR' | 'MACRO_TRADER' | 'INFRASTRUCTURE_BUILDER'
  principles: { title: string; description: string }[]
  quotes: LegendQuote[]
  primarySources: PrimarySource[]
}

interface LegendsProfileCardProps {
  profile: LegendProfile
  className?: string
}

// Legends Profile Card Component
// Daylight 2.1 data-terminal layout presenting primary-source principles and attributed quotes.
export function LegendsProfileCard({ profile, className = '' }: LegendsProfileCardProps) {
  const isInfrastructureBuilder = profile.category === 'INFRASTRUCTURE_BUILDER'

  return (
    <article
      aria-label={`Investor Profile: ${profile.name}`}
      className={`rounded-xl border border-slate-900/10 bg-[#faf2df] p-5 sm:p-6 space-y-5 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-900/10 pb-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">
            {profile.name}
          </h3>
          <p className="text-xs text-slate-500">{profile.title}</p>
        </div>

        <div className="text-left sm:text-right">
          <span className="block text-xs text-slate-500">Documented record</span>
          <span className="block text-xs font-bold text-slate-900 font-mono tabular-nums">
            {profile.trackRecord}
          </span>
        </div>
      </div>

      {isInfrastructureBuilder && (
        <p className="border-l-2 border-[#0369a1] pl-3 text-xs text-slate-700 leading-relaxed py-1">
          <span className="font-bold text-slate-900">Category note:</span> {profile.name} built commercial and financial infrastructure (refining, logistics, exchange matching engines) rather than trading technical chart patterns.
        </p>
      )}

      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Operating principles
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.principles.map((pr, idx) => (
            <div
              key={`principle-${idx}`}
              className="border-l-2 border-slate-900/20 pl-3.5 py-1 space-y-1"
            >
              <span className="text-xs font-bold text-slate-900 block">
                {pr.title}
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">{pr.description}</p>
            </div>
          ))}
        </div>
      </div>

      {profile.quotes && profile.quotes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Documented quotes
          </h4>
          <div className="space-y-3">
            {profile.quotes.map((q, idx) => (
              <blockquote
                key={`quote-${idx}`}
                className="border-l-2 border-[#0369a1] pl-4 py-1 text-xs space-y-1.5"
              >
                <p className="text-slate-800 text-sm leading-relaxed italic">
                  &ldquo;{q.quote}&rdquo;
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>
                    {q.attribution} {q.yearOrContext && `(${q.yearOrContext})`}
                  </span>
                  <a
                    href={q.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0369a1] underline underline-offset-2 hover:text-[#0284c7] font-semibold"
                  >
                    {q.sourceTitle}
                  </a>
                </div>
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {profile.primarySources && profile.primarySources.length > 0 && (
        <div className="pt-3 border-t border-slate-900/10">
          <h5 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Primary sources
          </h5>
          <ul className="space-y-1.5 text-xs">
            {profile.primarySources.map((ps, idx) => (
              <li key={`ps-${idx}`}>
                <a
                  href={ps.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0369a1] hover:text-[#0284c7] underline underline-offset-2 font-semibold"
                >
                  {ps.title}
                </a>
                {ps.note && <span className="text-slate-500 ml-1.5">- {ps.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
