'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Badge } from '@/components/ui/Badge'
import { AssetIcon } from '@/components/ui/AssetIcon'
import { formatUtcTime } from '@/lib/time'

interface SignalOutcome {
  system_outcome: string | null
  system_outcome_detail?: string | null
  system_target_hit?: string | null
  status?: string | null
  user_confirmed: boolean | null
  user_outcome: string | null
  resolution_price?: number | null
  resolved_at?: string | null
  system_resolved_at?: string | null
  entry_price?: number | null
  stop_loss?: number | null
  tp1?: number | null
  tp2?: number | null
  tp3?: number | null
}

interface SignalItem {
  event_id: string
  published_at: string
  symbol: string
  direction: string
  tier: string
  confluence_score: number
  regime_labels: string[]
  entry_price?: number
  target_tp1?: number
  target_tp2?: number
  target_tp3?: number
  stop_loss?: number
  outcome: SignalOutcome | null
}

interface RegimeItem {
  published_at: string
  regimes: string[]
  confidence?: number | null
}

interface DayDetailData {
  date: string
  summary: {
    signal_count: number
    watchlist_count: number
    total_signals: number
    profit_count: number
    loss_count: number
    net_outcome: 'positive' | 'negative' | 'neutral'
  }
  signals: SignalItem[]
  regimes: RegimeItem[]
}

interface DayDetailModalProps {
  date: string | null
  isOpen: boolean
  onClose: () => void
}

function getSignalDetails(sig: SignalItem) {
  const outcome = sig.outcome
  const isProfit = outcome?.system_outcome === 'TARGET_PROFIT_HIT' || outcome?.user_outcome === 'PROFIT'
  const isLoss = outcome?.system_outcome === 'STOP_LOSS_HIT' || outcome?.user_outcome === 'LOSS'
  const isNotHit = outcome?.system_outcome === 'NOT_HIT' || outcome?.system_outcome === 'SUPERSEDED' || outcome?.system_outcome === 'EXPIRED' || outcome?.user_outcome === 'NOT_HIT'

  const det = (outcome?.system_outcome_detail || outcome?.system_target_hit || '').toUpperCase()

  const isTP3 = isProfit && det.includes('TP3')
  const isTP2 = isProfit && (det.includes('TP2') || det.includes('TP3'))
  const isMidTrailing = isProfit && (det.includes('MID') || det.includes('BREAKEVEN') || det.includes('TRAILING'))

  // Highest target hit price & labels
  let highestHitPrice: number | undefined = undefined
  let targetLabel = 'Target'
  let badgeText = 'Awaiting Outcome'

  if (isProfit) {
    if (isTP3) {
      highestHitPrice = sig.target_tp3 || outcome?.tp3 || undefined
      targetLabel = 'Target Hit (TP3)'
      badgeText = isMidTrailing ? 'Target Profit Hit (TP3 · Mid Trailing)' : 'Target Profit Hit (TP3)'
    } else if (isTP2) {
      highestHitPrice = sig.target_tp2 || outcome?.tp2 || undefined
      targetLabel = 'Target Hit (TP2)'
      badgeText = isMidTrailing ? 'Target Profit Hit (TP2 · Mid Trailing)' : 'Target Profit Hit (TP2)'
    } else {
      highestHitPrice = sig.target_tp1 || outcome?.tp1 || undefined
      targetLabel = 'Target Hit (TP1)'
      badgeText = isMidTrailing ? 'Target Profit Hit (TP1 · Mid Trailing)' : 'Target Profit Hit (TP1)'
    }
  } else if (isLoss) {
    highestHitPrice = sig.stop_loss || outcome?.stop_loss || undefined
    targetLabel = 'Stop Loss Hit'
    badgeText = 'Stop Loss Hit'
  } else if (isNotHit) {
    badgeText = 'NOT HIT'
  }

  const entry = sig.entry_price || outcome?.entry_price || 0
  const sl = sig.stop_loss || outcome?.stop_loss || 0

  return {
    isProfit,
    isLoss,
    isNotHit,
    highestHitPrice,
    targetLabel,
    badgeText,
    entry,
    sl,
  }
}

export function DayDetailModal({ date, isOpen, onClose }: DayDetailModalProps) {
  const [data, setData] = useState<DayDetailData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen || !date) return

    let isMounted = true
    setLoading(true)
    setError(null)

    const fetchDayDetail = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        const res = await fetch(`${supabaseUrl}/functions/v1/get-calendar-summary?date=${date}`, {
          headers: {
            apikey: supabaseAnonKey || '',
            Authorization: `Bearer ${supabaseAnonKey || ''}`,
          },
        })

        if (!res.ok) {
          throw new Error(`Failed to load calendar day details (${res.status})`)
        }

        const json = await res.json()

        // Enrich signals with complete multi-tier outcome details from signal_outcomes table
        if (json && json.signals && json.signals.length > 0 && supabaseUrl) {
          const eventIds = json.signals.map((s: any) => s.event_id).filter(Boolean)
          if (eventIds.length > 0) {
            try {
              const outcomesRes = await fetch(
                `${supabaseUrl}/rest/v1/signal_outcomes?signal_event_id=in.(${eventIds.join(',')})&select=*`,
                {
                  headers: {
                    apikey: supabaseAnonKey || '',
                    Authorization: `Bearer ${supabaseAnonKey || ''}`,
                  },
                }
              )
              if (outcomesRes.ok) {
                const outcomesList = await outcomesRes.json()
                const outcomesMap: Record<string, any> = {}
                for (const o of outcomesList) {
                  outcomesMap[o.signal_event_id] = o
                }

                json.signals = json.signals.map((s: any) => {
                  const out = outcomesMap[s.event_id]
                  if (out) {
                    return {
                      ...s,
                      entry_price: s.entry_price || out.entry_price,
                      target_tp1: s.target_tp1 || out.tp1,
                      target_tp2: s.target_tp2 || out.tp2,
                      target_tp3: s.target_tp3 || out.tp3,
                      stop_loss: s.stop_loss || out.stop_loss,
                      outcome: {
                        ...(s.outcome || {}),
                        system_outcome: out.system_outcome,
                        system_outcome_detail: out.system_outcome_detail,
                        status: out.status,
                        system_resolved_at: out.system_resolved_at,
                        entry_price: out.entry_price,
                        stop_loss: out.stop_loss,
                        tp1: out.tp1,
                        tp2: out.tp2,
                        tp3: out.tp3,
                      },
                    }
                  }
                  return s
                })
              }
            } catch (postgrestErr) {
              console.warn('Could not enrich day details via PostgREST:', postgrestErr)
            }
          }
        }

        if (isMounted) {
          setData(json)
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load day summary')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDayDetail()

    return () => {
      isMounted = false
    }
  }, [isOpen, date])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !date || !mounted) return null

  // Format header date (e.g. Monday, August 17, 2026)
  const formattedDate = (() => {
    try {
      const [y, m, d] = date.split('-').map((n) => parseInt(n, 10))
      const dObj = new Date(Date.UTC(y, m - 1, d))
      return dObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      })
    } catch {
      return date
    }
  })()

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div className="relative z-10 w-full max-w-3xl max-h-[88vh] flex flex-col p-6 sm:p-7 rounded-2xl bg-[#0c0e16]/98 border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.85)] my-auto overflow-hidden">
        
        {/* ─── MODAL HEADER ─── */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted block">
              Daily History Drilldown
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
              {formattedDate}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ─── MODAL CONTENT ─── */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <span className="w-8 h-8 border-3 border-accent-theme border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-text-secondary">Loading daily summary telemetry...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed">
              {error}
            </div>
          ) : !data ? (
            <p className="text-xs text-text-secondary text-center py-8">No records available for this date.</p>
          ) : (
            <>
              {/* ─── SUMMARY STATS (Clean Tabular Metrics, No Rounded Boxes) ─── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-1 border-b border-white/[0.06]">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold block">Total Signals</span>
                  <span className="text-2xl font-bold text-white mt-0.5 block">{data.summary.total_signals}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold block">Watchlist Setups</span>
                  <span className="text-2xl font-bold text-amber-400 mt-0.5 block">{data.summary.watchlist_count}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold block">Target Profit</span>
                  <span className="text-2xl font-bold text-emerald-400 mt-0.5 block">
                    {data.summary.profit_count} <span className="text-xs font-normal text-emerald-400/70">Hits</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold block">Stop Losses</span>
                  <span className="text-2xl font-bold text-rose-400 mt-0.5 block">
                    {data.summary.loss_count} <span className="text-xs font-normal text-rose-400/70">Hits</span>
                  </span>
                </div>
              </div>

              {/* ─── ACTIVE REGIMES SECTION ─── */}
              {data.regimes && data.regimes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Market Regimes on {date}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.regimes.map((r, idx) => {
                      const timeStr = formatUtcTime(r.published_at)
                      return (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.07] text-xs"
                        >
                          <span className="text-text-muted text-[10px] font-mono">{timeStr}</span>
                          <span className="text-white font-semibold">
                            {r.regimes.map((lbl) => lbl.replace(/_/g, ' ')).join(' + ')}
                          </span>
                          {r.confidence && (
                            <span className="text-accent-blue text-[10px] font-mono">
                              ({(r.confidence * 100).toFixed(0)}%)
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ─── SIGNALS LIST SECTION ─── */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Signals Fired ({data.signals.length})
                </h4>

                {data.signals.length === 0 ? (
                  <div className="p-6 rounded-xl bg-white/[0.01] border border-white/[0.04] text-center text-xs text-text-muted">
                    No trade setups or watchlist signals were recorded on this date.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {data.signals.map((sig) => {
                      const timeStr = formatUtcTime(sig.published_at)
                      const isSignal = sig.tier === 'SIGNAL'
                      const details = getSignalDetails(sig)

                      return (
                        <div
                          key={sig.event_id}
                          className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AssetIcon symbol={sig.symbol} size="xs" />
                              <span className="text-text-muted text-xs font-mono">{timeStr}</span>
                              <span className="font-bold text-white text-sm">{sig.symbol}</span>
                              <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold ${
                                sig.direction === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {sig.direction === 'BUY' ? (
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                    <polyline points="17 6 23 6 23 12" />
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                                    <polyline points="17 18 23 18 23 12" />
                                  </svg>
                                )}
                                <span>{sig.direction}</span>
                              </span>
                              <span className="h-3 w-[1px] bg-white/[0.12]" />
                              <Badge variant={isSignal ? 'SIGNAL' : 'WATCHLIST'}>
                                {sig.tier}
                              </Badge>
                            </div>

                            {/* Outcome Capsule */}
                            <div>
                              {details.isProfit ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 font-mono">
                                  <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                                    <polyline points="16 7 22 7 22 13" />
                                  </svg>
                                  <span>{details.badgeText}</span>
                                </span>
                              ) : details.isLoss ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-400 font-mono">
                                  <svg className="w-3.5 h-3.5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                                    <polyline points="16 17 22 17 22 11" />
                                  </svg>
                                  <span>{details.badgeText}</span>
                                </span>
                              ) : details.isNotHit ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 font-mono">
                                  <span>{details.badgeText}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 font-mono">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                  <span>Awaiting Outcome</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Setup Targets / Parameters Strip */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-text-secondary border-t border-white/[0.03]">
                            <div>
                              <span className="text-text-muted block text-[10px]">Confluence Score</span>
                              <span className="font-semibold text-white font-mono">{sig.confluence_score.toFixed(1)}/100</span>
                            </div>
                            {details.entry > 0 && (
                              <div>
                                <span className="text-text-muted block text-[10px]">Entry Price</span>
                                <span className="font-semibold text-white font-mono">
                                  ${details.entry.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}
                            {details.isProfit ? (
                              <div>
                                <span className="text-text-muted block text-[10px]">{details.targetLabel}</span>
                                <span className="font-semibold text-emerald-400 font-mono">
                                  ${details.highestHitPrice ? details.highestHitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 }) : sig.target_tp1?.toLocaleString()}
                                </span>
                              </div>
                            ) : details.isLoss ? (
                              <div>
                                <span className="text-text-muted block text-[10px]">Stop Loss Hit</span>
                                <span className="font-semibold text-rose-400 font-mono">
                                  ${(details.highestHitPrice || details.sl)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                                </span>
                              </div>
                            ) : (
                              <>
                                {sig.target_tp1 && (
                                  <div>
                                    <span className="text-text-muted block text-[10px]">Target (TP1)</span>
                                    <span className="font-semibold text-emerald-400 font-mono">${sig.target_tp1.toLocaleString()}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
