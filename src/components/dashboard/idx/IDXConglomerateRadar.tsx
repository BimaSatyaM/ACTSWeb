'use client'

import React, { useState } from 'react'
import {
  IDXNewsArticle,
  ConglomerateId,
  CONGLOMERATE_METADATA,
} from '@/lib/idxNews'

interface Props {
  articles: IDXNewsArticle[]
}

const CONGLOMERATES: ConglomerateId[] = [
  'BAKRIE',
  'BARITO',
  'SALIM',
  'ASTRA',
  'BIG_BANKS',
]

export function IDXConglomerateRadar({ articles }: Props) {
  const [selectedGroup, setSelectedGroup] = useState<ConglomerateId>('BAKRIE')

  const meta = CONGLOMERATE_METADATA[selectedGroup]

  const groupArticles = articles.filter((a) => a.conglomerate === selectedGroup)

  return (
    <div className="rounded-xl bg-[#0d121f] border border-white/[0.08] p-5 sm:p-6 space-y-5">
      {/* ── Header & Conglomerate Group Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-primary" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white font-mono">
              Conglomerate M&amp;A &amp; Rumor Radar
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              Big Money Moves
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Monitor real-time corporate restructuring, asset acquisitions, buybacks, and insider flows.
          </p>
        </div>

        {/* Group Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {CONGLOMERATES.map((cg) => {
            const cgMeta = CONGLOMERATE_METADATA[cg]
            const count = articles.filter((a) => a.conglomerate === cg).length
            const isSelected = selectedGroup === cg

            return (
              <button
                key={cg}
                onClick={() => setSelectedGroup(cg)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#ff2e54] text-white'
                    : 'bg-[#070b14] text-slate-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                <span>{cgMeta.icon}</span>
                <span>{cgMeta.name}</span>
                <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px]">
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Group Profile Banner ── */}
      <div className="p-3.5 rounded-lg bg-[#070b14] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>{meta.name} Universe</span>
              <span className="text-slate-500 text-[11px]">
                ({meta.tickers.join(', ')})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{meta.description}</p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">
            Monitored Rumors
          </span>
          <span className="text-lg font-black text-cyan-400">
            {groupArticles.length} Headlines
          </span>
        </div>
      </div>

      {/* ── Articles Grid for Selected Conglomerate ── */}
      {groupArticles.length === 0 ? (
        <div className="rounded-lg bg-[#070b14] border border-white/[0.06] p-8 text-center space-y-2">
          <p className="text-xs font-mono text-slate-500">
            No recent rumors or headlines recorded for {meta.name} in the current session.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupArticles.map((article) => {
            const isBullish = article.sentiment === 'BULLISH'
            const isBearish = article.sentiment === 'BEARISH'

            return (
              <div
                key={article.id}
                className="rounded-xl bg-[#070b14] border border-white/[0.08] hover:border-white/[0.14] transition-all p-4 space-y-3 flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  {/* Tickers & Time */}
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {article.tickers.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded font-black bg-white/[0.06] text-white border border-white/[0.08]"
                        >
                          {t}
                        </span>
                      ))}
                      <span className="text-slate-500 text-[10px]">{article.source}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[10px]">
                        {article.publishedTimeAgo}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBullish
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : isBearish
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-white/[0.06] text-slate-400'
                        }`}
                      >
                        {isBullish ? '▲ Bullish' : isBearish ? '▼ Bearish' : '● Neutral'}
                        {article.sentimentScore !== 0 && ` (${article.sentimentScore > 0 ? '+' : ''}${article.sentimentScore})`}
                      </span>
                    </div>
                  </div>

                  {/* Headline Title */}
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-brand-primary transition-colors leading-snug">
                    {article.title}
                  </h4>

                  {/* AI Impact Summary */}
                  <div className="p-2.5 rounded-lg bg-[#0d121f] border border-white/[0.06] text-[11px] font-mono text-slate-400 leading-relaxed">
                    <span className="text-brand-primary font-bold mr-1.5">⚡ AI Impact:</span>
                    <span>{article.aiImpactSummary}</span>
                  </div>
                </div>

                {/* Read Link */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">{article.publishedAt.slice(0, 16)}</span>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-brand-primary hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span>Read Full Story</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
