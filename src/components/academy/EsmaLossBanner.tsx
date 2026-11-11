import React from 'react'

interface EsmaLossBannerProps {
  className?: string
}

/**
 * ESMA Statutory Risk Warning Component
 * Quiet, flat regulatory footnote adhering to taste-skill data-terminal rules:
 * no warning box, no icon in a tinted square, no uppercase pills.
 */
export function EsmaLossBanner({ className = '' }: EsmaLossBannerProps) {
  return (
    <aside
      aria-label="Regulatory Risk Warning"
      className={`border-t border-[#1a2030] pt-4 text-xs leading-relaxed text-[#94a3b8] ${className}`}
    >
      <p>
        <span className="text-white font-medium">Regulatory disclosure (ESMA Decision (EU) 2018/796):</span>{' '}
        Between 74% and 89% of retail investor accounts lose money when trading CFDs, leveraged derivatives, and speculative financial instruments. You should consider whether you understand how leveraged instruments work and whether you can afford to take the high risk of losing your capital.{' '}
        <a
          href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32018D0796"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white underline underline-offset-2 hover:text-[#cbd5e1] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff2e54]"
        >
          Official ESMA Decision (EU) 2018/796
        </a>
      </p>
    </aside>
  )
}
