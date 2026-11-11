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
// Flat data-terminal layout presenting primary-source principles and attributed quotes.
export function LegendsProfileCard({ profile, className = '' }: LegendsProfileCardProps) {
  const isInfrastructureBuilder = profile.category === 'INFRASTRUCTURE_BUILDER'

  return (
    <article
      aria-label={`Investor Profile: ${profile.name}`}
      className={`rounded-lg border border-[#1a2030] bg-[#0a0f1a] p-5 sm:p-6 space-y-5 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#1a2030] pb-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white">
            {profile.name}
          </h3>
          <p className="text-xs text-[#94a3b8]">{profile.title}</p>
        </div>

        <div className="text-left sm:text-right">
          <span className="block text-xs text-[#94a3b8]">Documented record</span>
          <span className="block text-xs font-medium text-white [font-variant-numeric:tabular-nums]">
            {profile.trackRecord}
          </span>
        </div>
      </div>

      {isInfrastructureBuilder && (
        <p className="border-l-2 border-[#ff2e54] pl-3 text-xs text-[#cbd5e1] leading-relaxed">
          <span className="font-medium text-white">Category note:</span> {profile.name} built commercial and financial infrastructure (refining, logistics, exchange matching engines) rather than trading technical chart patterns.
        </p>
      )}

      <div className="space-y-3">
        <h4 className="text-xs font-medium text-[#94a3b8]">
          Operating principles
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {profile.principles.map((pr, idx) => (
            <div
              key={`principle-${idx}`}
              className="rounded border border-[#1a2030] bg-[#070b14] p-3.5 space-y-1"
            >
              <span className="text-xs font-semibold text-white block">
                {pr.title}
              </span>
              <p className="text-xs text-[#94a3b8] leading-relaxed">{pr.description}</p>
            </div>
          ))}
        </div>
      </div>

      {profile.quotes && profile.quotes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-[#94a3b8]">
            Documented quotes
          </h4>
          <div className="space-y-3">
            {profile.quotes.map((q, idx) => (
              <blockquote
                key={`quote-${idx}`}
                className="border-l-2 border-[#2e3852] pl-4 py-1 text-xs space-y-1.5"
              >
                <p className="text-[#e2e8f0] text-sm leading-relaxed">
                  &ldquo;{q.quote}&rdquo;
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#94a3b8]">
                  <span>
                    {q.attribution} {q.yearOrContext && `(${q.yearOrContext})`}
                  </span>
                  <a
                    href={q.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white underline underline-offset-2 hover:text-[#cbd5e1]"
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
        <div className="pt-3 border-t border-[#1a2030]">
          <h5 className="text-xs font-medium text-[#94a3b8] mb-2">
            Primary sources
          </h5>
          <ul className="space-y-1.5 text-xs">
            {profile.primarySources.map((ps, idx) => (
              <li key={`ps-${idx}`}>
                <a
                  href={ps.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#cbd5e1] underline underline-offset-2"
                >
                  {ps.title}
                </a>
                {ps.note && <span className="text-[#94a3b8] ml-1.5">— {ps.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
