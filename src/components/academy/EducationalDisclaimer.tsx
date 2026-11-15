import React from 'react'

interface EducationalDisclaimerProps {
  className?: string
}

// Educational & Compliance Disclaimer Component
// Quiet, flat footnote rendered at the base of every academy lesson.
export function EducationalDisclaimer({ className = '' }: EducationalDisclaimerProps) {
  return (
    <footer
      aria-label="Educational Disclaimer"
      className={`border-t border-slate-200/80 pt-4 text-xs leading-relaxed text-slate-600 ${className}`}
    >
      <p>
        <span className="text-slate-900 font-medium">Educational notice:</span>{' '}
        ACTS Academy materials are strictly educational and do not constitute financial advice, investment recommendations, or an endorsement of any asset or trading strategy. Past performance of historical setups or simulated backtests is not indicative of future results.
      </p>
    </footer>
  )
}
