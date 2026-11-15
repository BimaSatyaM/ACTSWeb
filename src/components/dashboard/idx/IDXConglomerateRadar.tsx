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
    <div className="rounded-xl bg-[#fdfaf3] border border-slate-900/10 p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-900/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-600" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
              Conglomerate M&amp;A &amp; Rumor Radar
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200/70 font-bold">
              Big Money Moves
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">
            Monitor real-time corporate restructuring, asset acquisitions, buybacks, and insider flows.
          </p>
        </div>

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
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-[#faf2df]/80 text-slate-600 hover:text-slate-900 hover:bg-[#faf2df] border border-slate-900/10'
                }`}
              >
                <span>{cgMeta.icon}</span>
                <span>{cgMeta.name}</span>
                <span className="text-[10px] font-mono opacity-60 tabular-nums font-semibold">
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-3.5 rounded-lg bg-[#faf2df] border border-slate-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono tabular-nums">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span>{meta.name} Universe</span>
              <span className="text-slate-500 text-[11px]">
                ({meta.tickers.join(', ')})
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-sans">{meta.description}</p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold font-sans">
            Monitored Rumors
          </span>
          <span className="text-lg font-black text-sky-800">
            {groupArticles.length} Headlines
          </span>
        </div>
      </div>

      {groupArticles.length === 0 ? (
        <div className="rounded-lg bg-[#faf2df] border border-slate-900/10 p-8 text-center space-y-2">
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
                className="rounded-xl bg-[#faf2df] border border-slate-900/10 hover:border-slate-900/20 transition-all p-4 space-y-3 flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {article.tickers.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded font-black bg-[#fdfaf3] text-slate-900 border border-slate-900/10"
                        >
                          {t}
                        </span>
                      ))}
                      <span className="text-slate-500 text-[10px]">{article.source}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[10px] tabular-nums">
                        {article.publishedTimeAgo}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBullish
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : isBearish
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-900/10'
                        }`}
                      >
                        {isBullish ? '▲ Bullish' : isBearish ? '▼ Bearish' : '● Neutral'}
                        {article.sentimentScore !== 0 && ` (${article.sentimentScore > 0 ? '+' : ''}${article.sentimentScore})`}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-sky-800 transition-colors leading-snug">
                    {article.title}
                  </h4>

                  <div className="p-2.5 rounded-lg bg-[#fdfaf3] border border-slate-900/10 text-[11px] font-mono text-slate-600 leading-relaxed">
                    <span className="text-[#0369a1] font-bold mr-1.5">Desk Impact:</span>
                    <span>{article.aiImpactSummary}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900/10 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500 tabular-nums">{article.publishedAt.slice(0, 16)}</span>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#0369a1] hover:text-slate-900 hover:underline flex items-center gap-1"
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
