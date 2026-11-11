import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import changelogFallback from '@/data/changelog.json'

export const dynamic = 'force-dynamic'

export interface NotificationItem {
  id: string
  category: 'news' | 'system'
  tag: string
  title: string
  message: string
  timestamp: string
  link: string
  badgeColor: 'emerald' | 'rose' | 'amber' | 'indigo' | 'blue' | 'accent' | 'purple' | 'cyan' | 'zinc'
}

let cachedNotifications: NotificationItem[] = []
let lastFetchTime = 0

export async function GET() {
  const now = Date.now()
  // Cache for 2 seconds to keep UI ultra responsive to 1m price moves
  if (now - lastFetchTime < 2000 && cachedNotifications.length > 0) {
    return NextResponse.json({ notifications: cachedNotifications })
  }

  const notifications: NotificationItem[] = []

  // 1. Fetch System Updates (Git Commits & Release Changelog)
  try {
    let commits: Array<{ hash: string; date: string; message: string }> = []
    try {
      const gitLog = execSync('git log -n 8 --pretty=format:"%h|%aI|%s"', {
        encoding: 'utf-8',
        timeout: 2000,
      })
      commits = gitLog
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [hash, date, message] = line.split('|')
          return { hash, date, message }
        })
    } catch {
      commits = (changelogFallback || []).slice(0, 6).map((c: any) => ({
        hash: c.hash || Math.random().toString(36).slice(2, 8),
        date: c.date || new Date().toISOString(),
        message: c.message || 'System update released',
      }))
    }

    commits.forEach((c) => {
      const cleanMsg = (c.message || '').replace(/^(\w+)(\(.*?\))?:\s*/i, '').trim()
      const title = cleanMsg.charAt(0).toUpperCase() + cleanMsg.slice(1)
      notifications.push({
        id: `sys-${c.hash}`,
        category: 'system',
        tag: 'SYSTEM UPDATE',
        title: title || 'Core Engine Update',
        message: 'Engine update and performance improvements deployed.',
        timestamp: c.date,
        link: '/dashboard',
        badgeColor: 'accent',
      })
    })
  } catch (sysErr) {
    console.warn('[NOTIFICATIONS API] System updates notice:', sysErr)
  }

  // 2. Fetch Live Signals & Outcomes from Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jryweitdqvafagmcrvwe.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (supabaseUrl && supabaseKey) {
    // 2a. Fetch latest Signals, Auto-Trade Fills, Sentiment from event_log
    try {
      const evRes = await fetch(
        `${supabaseUrl}/rest/v1/event_log?event_type=in.(SignalFiredEvent,BinanceTradeExecutedEvent,SentimentAnalysisEvent)&order=published_at.desc&limit=40`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          signal: AbortSignal.timeout(3000),
        }
      )

      if (evRes.ok) {
        const events = await evRes.json()
        if (Array.isArray(events)) {
          // Group SignalFiredEvents by 15m candle window so every 15m candle has its evaluation present
          const signalsByCandle = new Map<string, any[]>()
          const otherEvents: any[] = []

          events.forEach((ev: any) => {
            const p = typeof ev.payload === 'string' ? JSON.parse(ev.payload) : ev.payload
            if (!p) return

            if (ev.event_type === 'SignalFiredEvent') {
              const candleKey = p.fired_at || (ev.published_at ? ev.published_at.slice(0, 16) : ev.event_id)
              if (!signalsByCandle.has(candleKey)) {
                signalsByCandle.set(candleKey, [])
              }
              signalsByCandle.get(candleKey)!.push({ ev, p })
            } else {
              otherEvents.push({ ev, p })
            }
          })

          // For each 15m candle, include the dominant setup (highest confluence score)
          signalsByCandle.forEach((candleSignals) => {
            // Sort candle signals by confluence score descending
            candleSignals.sort((a, b) => Number(b.p.confluence_score || 0) - Number(a.p.confluence_score || 0))

            // Keep dominant setup (or both if second one also has high confluence >= 25.0)
            const toInclude = [candleSignals[0]]
            if (candleSignals.length > 1 && Number(candleSignals[1].p.confluence_score || 0) >= 25.0) {
              toInclude.push(candleSignals[1])
            }

            toInclude.forEach(({ ev, p }) => {
              const scoreNum = Number(p.confluence_score || 0)
              const threshold = Number(p.confluence_result?.effective_threshold || 52.0)
              const isSignal = p.tier === 'SIGNAL' || scoreNum >= threshold
              const isImminent = !isSignal && (p.tier === 'WATCHLIST' || scoreNum >= 42.0)
              const isForming = !isSignal && !isImminent && scoreNum >= 20.0
              const dir = p.confluence_result?.direction || p.setup_context?.direction || 'BUY'

              const score = scoreNum.toFixed(1)
              const entry = p.setup_context?.entry_price ? `$${Number(p.setup_context.entry_price).toLocaleString(undefined, { maximumFractionDigits: 1 })}` : ''
              const tp1 = p.setup_context?.tp1?.target_price ? `$${Number(p.setup_context.tp1.target_price).toLocaleString(undefined, { maximumFractionDigits: 1 })}` : ''
              const sl = p.setup_context?.stop_loss ? `$${Number(p.setup_context.stop_loss).toLocaleString(undefined, { maximumFractionDigits: 1 })}` : ''

              const factors = Array.isArray(p.confluence_result?.breakdown)
                ? p.confluence_result.breakdown.filter((f: any) => Number(f.points) > 0).map((f: any) => f.factor_name)
                : []
              const factorsSummary = factors.length > 0 ? factors.slice(0, 2).join(', ') : 'EMA Trend & Volume'
              const ptsNeeded = Math.max(0, threshold - scoreNum).toFixed(1)
              const regimeStr = Array.isArray(p.regime_labels) ? p.regime_labels.join(' ') : (p.regime_labels || 'RANGING_CHOP')

              if (isSignal) {
                notifications.push({
                  id: `sig-${ev.event_id || Math.random()}`,
                  category: 'news',
                  tag: 'LIVE SIGNAL',
                  title: `${dir} Signal Fired • Score ${score}/100`,
                  message: `Confluence ${score} (${p.grade || 'Grade B'}) • Entry ~${entry} | SL: ${sl} | TP1: ${tp1}`,
                  timestamp: ev.published_at,
                  link: '/dashboard/signals',
                  badgeColor: dir === 'BUY' ? 'emerald' : 'rose',
                })
              } else if (isImminent) {
                notifications.push({
                  id: `sig-imm-${ev.event_id || Math.random()}`,
                  category: 'news',
                  tag: 'SIGNAL IMMINENT',
                  title: `Incoming ${dir} Signal: Confluence ${score}/${threshold.toFixed(1)}`,
                  message: `Setup within ${ptsNeeded} pts of execution threshold (${factorsSummary}). Monitoring next 15m candle close.`,
                  timestamp: ev.published_at,
                  link: '/dashboard/signals',
                  badgeColor: 'purple',
                })
              } else if (isForming) {
                notifications.push({
                  id: `sig-inc-${ev.event_id || Math.random()}`,
                  category: 'news',
                  tag: 'INCOMING SIGNAL',
                  title: `Incoming ${dir} Setup • Confluence ${score}/${threshold.toFixed(1)} (Forming)`,
                  message: `Setup forming on BTCUSDT (${factorsSummary}). ${ptsNeeded} pts needed to trigger auto-execution on 15m close.`,
                  timestamp: ev.published_at,
                  link: '/dashboard/signals',
                  badgeColor: 'purple',
                })
              } else {
                notifications.push({
                  id: `sig-eval-${ev.event_id || Math.random()}`,
                  category: 'news',
                  tag: 'INCOMING SIGNAL',
                  title: `15m Signal Evaluated • ${dir} Confluence ${score}/${threshold.toFixed(1)}`,
                  message: `15m candle closed for ${dir}. Confluence at ${score} pts in ${regimeStr}. ${ptsNeeded} pts needed to trigger auto-trade.`,
                  timestamp: ev.published_at,
                  link: '/dashboard/signals',
                  badgeColor: 'purple',
                })
              }
            })
          })

          // Process other events (trade executions, sentiment)
          otherEvents.forEach(({ ev, p }) => {
            if (ev.event_type === 'BinanceTradeExecutedEvent') {
              const dir = p.direction || 'BUY'
              const price = p.entry_price ? `$${Number(p.entry_price).toLocaleString(undefined, { maximumFractionDigits: 1 })}` : ''
              const tp = p.tp1_price ? `$${Number(p.tp1_price).toLocaleString(undefined, { maximumFractionDigits: 1 })}` : ''
              notifications.push({
                id: `trade-${ev.event_id || Math.random()}`,
                category: 'news',
                tag: 'AUTO-TRADE FILL',
                title: `Live Auto-Trade Executed: ${dir} BTCUSDT`,
                message: `Bracket order filled on Binance @ ~${price} • SL & TP1 (${tp}) resting on order book.`,
                timestamp: ev.published_at,
                link: '/dashboard/auto-trading',
                badgeColor: 'emerald',
              })
            } else if (ev.event_type === 'SentimentAnalysisEvent') {
              const bias = p.bias || 'NEUTRAL'
              const score = Number(p.sentiment_score || 0)
              notifications.push({
                id: `sent-${ev.event_id || Math.random()}`,
                category: 'news',
                tag: 'MACRO AI WIRE',
                title: `Gemini Macro Sentiment: ${bias} (${score >= 0 ? '+' : ''}${score.toFixed(2)})`,
                message: p.dominant_narrative || 'Macro and news intelligence updated from Federal Reserve and economic wires.',
                timestamp: ev.published_at,
                link: '/dashboard/live-news',
                badgeColor: 'indigo',
              })
            }
          })
        }
      }
    } catch (evErr) {
      console.warn('[NOTIFICATIONS API] event_log query notice:', evErr)
    }

    // 2b. Fetch latest Signal Outcomes (Target Profit Hits / Stop Loss Hits)
    try {
      const outRes = await fetch(
        `${supabaseUrl}/rest/v1/signal_outcomes?system_outcome=in.(TARGET_PROFIT_HIT,STOP_LOSS_HIT)&order=created_at.desc&limit=6`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          signal: AbortSignal.timeout(3000),
        }
      )

      if (outRes.ok) {
        const outcomes = await outRes.json()
        if (Array.isArray(outcomes)) {
          outcomes.forEach((out: any) => {
            const isTP = out.system_outcome === 'TARGET_PROFIT_HIT'
            const detail = out.system_outcome_detail || (isTP ? 'Target Profit 1 reached' : 'Stop loss triggered')
            const price = out.resolution_price ? `$${Number(out.resolution_price).toLocaleString(undefined, { maximumFractionDigits: 1 })}` : ''

            notifications.push({
              id: `out-${out.id || out.signal_event_id || Math.random()}`,
              category: 'news',
              tag: isTP ? 'TARGET HIT' : 'STOP LOSS HIT',
              title: isTP
                ? `Target Profit Hit on BTCUSDT`
                : `Stop Loss Hit on BTCUSDT`,
              message: isTP
                ? `Position target achieved at ${price} (${detail}). Realized profit secured in USDT.`
                : `Risk protection triggered at ${price}. Position closed automatically to preserve capital.`,
              timestamp: out.resolved_at || out.created_at || new Date().toISOString(),
              link: '/dashboard/signals',
              badgeColor: isTP ? 'emerald' : 'rose',
            })
          })
        }
      }
    } catch (outErr) {
      console.warn('[NOTIFICATIONS API] signal_outcomes query notice:', outErr)
    }
  }

  // 3. Add Live Market Price Events, 1m Momentum Milestones & Breakouts
  try {
    const [tickerRes, klinesRes] = await Promise.all([
      fetch('https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT', {
        signal: AbortSignal.timeout(2500),
        cache: 'no-store',
      }).catch(() => null),
      fetch('https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=5', {
        signal: AbortSignal.timeout(2500),
        cache: 'no-store',
      }).catch(() => null),
    ])

    if (tickerRes && tickerRes.ok) {
      const tick = await tickerRes.json()
      const lastPrice = parseFloat(tick.lastPrice || '0')
      const priceChangePct = parseFloat(tick.priceChangePercent || '0')
      const high24h = parseFloat(tick.highPrice || '0')
      const low24h = parseFloat(tick.lowPrice || '0')
      const volume24h = parseFloat(tick.volume || '0')

      // 3a. Rapid 1-Minute Candle Momentum Detection
      if (klinesRes && klinesRes.ok) {
        try {
          const klines = await klinesRes.json()
          if (Array.isArray(klines) && klines.length > 0) {
            const latest = klines[klines.length - 1]
            const cOpen = parseFloat(latest[1] || '0')
            const cHigh = parseFloat(latest[2] || '0')
            const cLow = parseFloat(latest[3] || '0')
            const cClose = parseFloat(latest[4] || '0')
            const cVol = parseFloat(latest[5] || '0')
            const move1m = cClose - cOpen
            const move1mPct = cOpen > 0 ? (move1m / cOpen) * 100 : 0

            // 1m Bullish Surge or Bearish Reaction
            if (move1m >= 15) {
              notifications.push({
                id: `btc-1m-surge-${Math.floor(now / 60000)}`,
                category: 'news',
                tag: 'BULLISH MOMENTUM',
                title: `BTC 1m Surge: $${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} (+${move1mPct.toFixed(2)}%)`,
                message: `Rapid buying impulse of +$${move1m.toFixed(1)} in 1m (1m Vol: ${cVol.toFixed(1)} BTC). Local momentum expanding.`,
                timestamp: new Date().toISOString(),
                link: '/dashboard',
                badgeColor: 'emerald',
              })
            } else if (move1m <= -15) {
              notifications.push({
                id: `btc-1m-drop-${Math.floor(now / 60000)}`,
                category: 'news',
                tag: 'BEARISH PRESSURE',
                title: `BTC 1m Pullback: $${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} (${move1mPct.toFixed(2)}%)`,
                message: `Quick downside reaction of -$${Math.abs(move1m).toFixed(1)} in 1m (1m Vol: ${cVol.toFixed(1)} BTC). Testing local support.`,
                timestamp: new Date().toISOString(),
                link: '/dashboard',
                badgeColor: 'rose',
              })
            }

            // 3b. Key Psychological Round Level Milestone ($500 / $1000 brackets)
            const nearestLevel = Math.round(lastPrice / 500) * 500
            const distToLevel = Math.abs(lastPrice - nearestLevel)
            const breachedInCandle = cLow <= nearestLevel && cHigh >= nearestLevel

            if (distToLevel <= 85 || breachedInCandle) {
              notifications.push({
                id: `btc-level-${nearestLevel}-${Math.floor(now / 180000)}`,
                category: 'news',
                tag: 'PRICE MILESTONE',
                title: `BTC Hit $${nearestLevel.toLocaleString()} Milestone`,
                message: `Price actively testing major psychological $${nearestLevel.toLocaleString()} level. Current: $${lastPrice.toLocaleString(undefined, { maximumFractionDigits: 1 })} (24h High: $${high24h.toLocaleString()}).`,
                timestamp: new Date().toISOString(),
                link: '/dashboard',
                badgeColor: 'zinc',
              })
            }
          }
        } catch {
          // optional klines parsing
        }
      }

      // 3c. 24h High / Low Extreme Testing
      if (high24h > 0 && lastPrice >= high24h - 120) {
        notifications.push({
          id: `btc-24h-high-${Math.floor(now / 120000)}`,
          category: 'news',
          tag: 'PRICE MILESTONE',
          title: `BTC Testing 24h High: $${high24h.toLocaleString()}`,
          message: `Trading within 0.15% of the daily high. Breakout above could trigger accelerated upside.`,
          timestamp: new Date().toISOString(),
          link: '/dashboard',
          badgeColor: 'zinc',
        })
      } else if (low24h > 0 && lastPrice <= low24h + 120) {
        notifications.push({
          id: `btc-24h-low-${Math.floor(now / 120000)}`,
          category: 'news',
          tag: 'PRICE MILESTONE',
          title: `BTC Testing 24h Low: $${low24h.toLocaleString()}`,
          message: `Trading near the 24h daily low. Monitoring key support defense.`,
          timestamp: new Date().toISOString(),
          link: '/dashboard',
          badgeColor: 'zinc',
        })
      }

      // 3d. 24h Momentum Alert
      if (Math.abs(priceChangePct) >= 0.25) {
        const isBullish = priceChangePct > 0
        notifications.push({
          id: `market-momentum-${Math.floor(now / 120000)}`,
          category: 'news',
          tag: isBullish ? 'BULLISH MOMENTUM' : 'BEARISH PRESSURE',
          title: isBullish
            ? `BTC Bullish Momentum: $${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} (+${priceChangePct.toFixed(2)}%)`
            : `BTC Bearish Pressure: $${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} (${priceChangePct.toFixed(2)}%)`,
          message: `24h High: $${high24h.toLocaleString()} • 24h Low: $${low24h.toLocaleString()} • 24h Vol: ${volume24h.toFixed(0)} BTC`,
          timestamp: new Date().toISOString(),
          link: '/dashboard',
          badgeColor: isBullish ? 'emerald' : 'rose',
        })
      }
    }
  } catch {
    // optional
  }

  // 4. Add Top Breaking News Wire
  try {
    const newsRes = await fetch('http://localhost:3000/api/news', {
      signal: AbortSignal.timeout(2000),
      cache: 'no-store',
    }).catch(() => null)

    if (newsRes && newsRes.ok) {
      const newsData = await newsRes.json()
      if (Array.isArray(newsData.articles) && newsData.articles.length > 0) {
        newsData.articles.slice(0, 3).forEach((art: any, i: number) => {
          notifications.push({
            id: `news-${i}-${(art.title || '').slice(0, 12)}`,
            category: 'news',
            tag: 'MARKET WIRE',
            title: art.title,
            message: `Source: ${art.source || 'Crypto Market Wire'} • High impact industry development.`,
            timestamp: art.published_at || new Date().toISOString(),
            link: art.url || '/dashboard/live-news',
            badgeColor: 'blue',
          })
        })
      }
    }
  } catch {
    // optional
  }

  // 5. Sort chronologically descending (newest first)
  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Deduplicate by ID
  const seenIds = new Set<string>()
  const deduped = notifications.filter((n) => {
    if (seenIds.has(n.id)) return false
    seenIds.add(n.id)
    return true
  })

  cachedNotifications = deduped
  lastFetchTime = now

  return NextResponse.json({ notifications: deduped })
}
