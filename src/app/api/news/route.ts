import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface NewsArticle {
  title: string
  source: string
  url: string
  published_at: string
  category: 'crypto' | 'rumor' | 'macro'
  image_url?: string
}

interface EconomicEvent {
  title: string
  country: string
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  date_time: string
  forecast?: string | null
  previous?: string | null
  actual?: string | null
  image_url?: string
}

interface SentimentAnalysis {
  sentiment_score: number
  bias: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH'
  speaker_entity: string
  dominant_narrative: string
  fed_statement_quote?: string
  confluence_impact: string
  high_impact_warning: boolean
  key_factors: string[]
  evaluated_at: string
}

// In-Memory Server Caches to prevent rate-limiting
let cachedArticles: NewsArticle[] = []
let lastArticlesFetch = 0

let cachedMacroEvents: EconomicEvent[] = []
let lastMacroFetch = 0

let cachedSentiment: SentimentAnalysis | null = null
let lastSentimentFetch = 0

export function getMacroEventImage(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('treasury') || t.includes('fiscal') || t.includes('bond') || t.includes('bessent')) {
    return 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80' // US Treasury / Fiscal Policy Ledger
  }
  if (t.includes('fomc') || t.includes('fed') || t.includes('powell') || t.includes('rate decision') || t.includes('jackson hole') || t.includes('warsh') || t.includes('speaks')) {
    return 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=500&auto=format&fit=crop&q=80' // Federal Reserve Central Bank Podium & Financial Wire
  }
  if (t.includes('cpi') || t.includes('inflation') || t.includes('pce') || t.includes('retail') || t.includes('ppi')) {
    return 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=500&auto=format&fit=crop&q=80' // US Dollar / Inflation / Treasury Bills
  }
  if (t.includes('payroll') || t.includes('nfp') || t.includes('jobless') || t.includes('employment') || t.includes('unemployment') || t.includes('claims') || t.includes('revision')) {
    return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop&q=80' // Financial District Headquarters / Labor Economy
  }
  if (t.includes('pmi') || t.includes('manufacturing') || t.includes('gdp') || t.includes('services') || t.includes('sentiment')) {
    return 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=80' // Industrial Manufacturing / Economic Output
  }
  if (t.includes('trump') || t.includes('white house') || t.includes('capitol')) {
    return 'https://images.unsplash.com/photo-1565372195458-9de0b320ef04?w=500&auto=format&fit=crop&q=80' // US Capitol Grand Hall
  }
  // Default institutional financial chart photo
  return 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=500&auto=format&fit=crop&q=80'
}

function cleanText(raw?: string): string {
  if (!raw) return ''
  return raw
    .replace(/<!\[CDATA\[/gi, '')
    .replace(/\]\]>/gi, '')
    .trim()
}

function extractImageUrl(xmlSnippet: string): string | undefined {
  const enclosureMatch = /<enclosure[^>]+url=["']([^"']+)["']/i.exec(xmlSnippet)
  if (enclosureMatch && enclosureMatch[1]) return cleanText(enclosureMatch[1])

  const mediaMatch = /<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i.exec(xmlSnippet)
  if (mediaMatch && mediaMatch[1]) return cleanText(mediaMatch[1])

  return undefined
}

async function fetchRssFeed(
  sourceName: string,
  feedUrl: string,
  destination: NewsArticle[],
  limit: number = 8
) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const res = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ACTS/1.0',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) return

    const xml = await res.text()
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi
    let match: RegExpExecArray | null
    let count = 0

    while ((match = itemRegex.exec(xml)) !== null && count < limit) {
      const itemContent = match[1]
      const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(itemContent)
      const linkMatch = /<link>([\s\S]*?)<\/link>/i.exec(itemContent)
      const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(itemContent)
      const imageUrl = extractImageUrl(itemContent)

      if (titleMatch && linkMatch) {
        const title = cleanText(titleMatch[1])
        const link = cleanText(linkMatch[1])
        const pubDate = pubDateMatch ? cleanText(pubDateMatch[1]) : new Date().toISOString()

        let category: NewsArticle['category'] = 'crypto'
        const lowerTitle = title.toLowerCase()
        if (lowerTitle.includes('rumor') || lowerTitle.includes('unconfirmed') || lowerTitle.includes('alleged') || lowerTitle.includes('speculat')) {
          category = 'rumor'
        } else if (
          lowerTitle.includes('fed') ||
          lowerTitle.includes('fomc') ||
          lowerTitle.includes('rate') ||
          lowerTitle.includes('inflation') ||
          lowerTitle.includes('cpi') ||
          lowerTitle.includes('treasury') ||
          lowerTitle.includes('macro') ||
          sourceName.includes('Federal Reserve')
        ) {
          category = 'macro'
        }

        if (title && link) {
          destination.push({
            title,
            source: sourceName,
            url: link,
            published_at: pubDate,
            category,
            image_url: imageUrl,
          })
          count++
        }
      }
    }
  } catch (err) {
    console.warn(`Error fetching ${sourceName} RSS:`, err)
  }
}

import realMacroCalendar from '@/data/real_macro_calendar.json'

function getUpcomingMacroEvents(liveEvents: EconomicEvent[]): EconomicEvent[] {
  const now = Date.now()

  // Use live events from ForexFactory if present, otherwise fallback to authentic real calendar schedule
  const baseList: EconomicEvent[] =
    liveEvents && liveEvents.length > 0 ? liveEvents : (realMacroCalendar as unknown as EconomicEvent[])

  const validLive = baseList
    .filter((ev) => {
      const eventTime = new Date(ev.date_time).getTime()
      return !isNaN(eventTime) && eventTime >= now - 86400000
    })
    .map((ev) => ({
      ...ev,
      actual: ev.actual ?? undefined,
      forecast: ev.forecast ?? undefined,
      previous: ev.previous ?? undefined,
      image_url: ev.image_url || getMacroEventImage(ev.title),
    }))

  // Sort chronologically ascending (upcoming nearest first)
  validLive.sort((a, b) => {
    const timeA = new Date(a.date_time).getTime() || 0
    const timeB = new Date(b.date_time).getTime() || 0
    return timeA - timeB
  })

  return validLive
}

function calculateCalibratedSentiment(articles: NewsArticle[], macroEvents: EconomicEvent[]): SentimentAnalysis {
  // Institutional weighting: Only major macro policy shifts and systemic events move scores > ±0.40.
  // Routine Bitcoin news and company announcements are scaled moderately (+0.05 to +0.15)
  // to avoid false 'Strong Bullish' market hype, honoring institutional risk discipline.
  const bullishPatterns = [
    // Tier 1: Systemic Macro & Monetary Policy (High Impact: ±0.30 - ±0.35)
    { regex: /\b(rate cuts?|fomc rate cuts?|cuts? interest rates?|monetary easing|fomc cut|lower rates|easing cycle)\b/i, points: 0.30, category: 'macro_easing', maxTotal: 0.30 },
    { regex: /\b(cpi cool(s|ing)?|cpi falls?|cpi drops?|pce cool(s|ing)?|disinflation|inflation falls?)\b/i, points: 0.25, category: 'cooling_inflation', maxTotal: 0.25 },
    { regex: /\b(strategic (?:bitcoin )?reserve passed|us sovereign reserve|crypto bill signed)\b/i, points: 0.35, category: 'sovereign_adoption', maxTotal: 0.35 },

    // Tier 2: Spot ETF & Institutional Balance Sheet (Medium Impact: +0.10 - +0.15)
    { regex: /\b(etf inflows?|spot etf.*inflows?|inflows? of \$?\d+|buys? \$?\d+.*(?:million|billion)|adds? \d+.*bitcoin|purchases? \d+.*bitcoin|bitcoin treasury)\b/i, points: 0.15, category: 'institutional_buy', maxTotal: 0.15 },
    { regex: /\b(sec drops? lawsuit|sec dismisses?|court victory|pro-crypto regulation|regulatory approval)\b/i, points: 0.15, category: 'regulatory_clarity', maxTotal: 0.15 },
    { regex: /\b(golden cross|multi-month breakout|all-time high|ath|record high)\b/i, points: 0.10, category: 'technical_momentum', maxTotal: 0.10 },

    // Tier 3: General Corporate Adoption & Minor Headlines (Low Impact: +0.02 - +0.05)
    { regex: /\b(robinhood|visa|mastercard|paypal|institutional investment|strategic partnership)\b/i, points: 0.03, category: 'adoption_partnership', maxTotal: 0.05 },
  ]

  const bearishPatterns = [
    // Tier 1: Systemic Macro Tightening & Systemic Crises (High Impact: -0.30 - -0.35)
    { regex: /\b(rate hikes?|hawkish surprise|hikes? interest rates?|monetary tightening|fomc hike|higher for longer)\b/i, points: -0.30, category: 'macro_tightening', maxTotal: 0.30 },
    { regex: /\b(inflation surge|inflation rise|cpi rise|cpi jump|hot cpi|hotter than expected)\b/i, points: -0.25, category: 'hot_inflation', maxTotal: 0.25 },
    { regex: /\b(ban on crypto|bans? crypto|banning bitcoin|outlaw(s|ed)? bitcoin)\b/i, points: -0.35, category: 'crypto_ban', maxTotal: 0.35 },
    { regex: /\b(insolvency|insolvent|bankrupt(cy)?|chapter 11|liquidation cascade|systemic default|contagion)\b/i, points: -0.30, category: 'insolvency_risk', maxTotal: 0.30 },

    // Tier 2: Regulatory Enforcement & Protocol Exploits (Medium Impact: -0.15)
    { regex: /\b(sec sues|sec lawsuit|sec charges|doj charges|subpoena|regulatory clampdown|crackdown on crypto)\b/i, points: -0.15, category: 'regulatory_enforcement', maxTotal: 0.15 },
    { regex: /\b(exploited|hacked|\$?\d+.*million.*exploit|stolen funds|drainer|rugpull)\b/i, points: -0.15, category: 'security_exploit', maxTotal: 0.15 },
  ]

  let score = 0.0
  const categoryTally: Record<string, number> = {}
  let topDriverArticle: NewsArticle | null = null
  let maxDriverMagnitude = 0

  // Evaluate top 15 incoming headlines
  for (const article of articles.slice(0, 15)) {
    const title = article.title

    for (const pat of bullishPatterns) {
      if (pat.regex.test(title)) {
        const currentTotal = categoryTally[pat.category] || 0
        if (currentTotal < pat.maxTotal) {
          const added = Math.min(pat.points, pat.maxTotal - currentTotal)
          score += added
          categoryTally[pat.category] = currentTotal + added
          if (pat.points > maxDriverMagnitude) {
            maxDriverMagnitude = pat.points
            topDriverArticle = article
          }
        }
        break
      }
    }

    for (const pat of bearishPatterns) {
      if (pat.regex.test(title)) {
        const currentTotal = categoryTally[pat.category] || 0
        if (currentTotal < pat.maxTotal) {
          const added = Math.min(Math.abs(pat.points), pat.maxTotal - currentTotal)
          score -= added
          categoryTally[pat.category] = currentTotal + added
          if (Math.abs(pat.points) > maxDriverMagnitude) {
            maxDriverMagnitude = Math.abs(pat.points)
            topDriverArticle = article
          }
        }
        break
      }
    }
  }

  // Check upcoming high-impact economic events within 24h
  const hasHighImpactEvent = macroEvents.some((ev) => {
    const diff = new Date(ev.date_time).getTime() - Date.now()
    return ev.impact === 'HIGH' && diff > 0 && diff < 86400000
  })

  // Pre-event caution: damp score if high-impact macro announcement is pending
  if (hasHighImpactEvent) {
    score = score * 0.75
  }

  score = Math.max(-0.95, Math.min(0.95, Number(score.toFixed(2))))

  // Institutional Bias Tiers:
  // Requires > ±0.45 for 'STRONG', so routine news stays comfortably in NEUTRAL or modest BULLISH/BEARISH
  let bias: SentimentAnalysis['bias'] = 'NEUTRAL'
  if (score >= 0.45) bias = 'STRONG_BULLISH'
  else if (score >= 0.15) bias = 'BULLISH'
  else if (score <= -0.45) bias = 'STRONG_BEARISH'
  else if (score <= -0.15) bias = 'BEARISH'

  // Dynamic speaker attribution
  let speaker_entity = 'Global Macro Desk'
  if (topDriverArticle) {
    const lowerTitle = topDriverArticle.title.toLowerCase()
    if (lowerTitle.includes('powell') || lowerTitle.includes('fed') || lowerTitle.includes('fomc')) {
      speaker_entity = 'Jerome Powell / Federal Reserve'
    } else if (lowerTitle.includes('sec') || lowerTitle.includes('gensler')) {
      speaker_entity = 'US Securities & Exchange Commission'
    } else if (lowerTitle.includes('strive') || lowerTitle.includes('microstrategy') || lowerTitle.includes('blackrock')) {
      speaker_entity = 'Institutional Asset Allocators'
    } else if (topDriverArticle.source) {
      speaker_entity = `${topDriverArticle.source} Market Wire`
    }
  }

  // Dynamic dominant narrative
  let dominant_narrative = 'Macro risk posture remains neutral as digital asset markets digest routine session headlines.'
  if (bias === 'STRONG_BULLISH') {
    dominant_narrative = 'Major institutional liquidity catalysts and dovish macro drivers provide strong expansionary tailwinds for Bitcoin.'
  } else if (bias === 'BULLISH') {
    dominant_narrative = 'Constructive spot market demand and institutional accumulation offer steady baseline support for BTC momentum.'
  } else if (bias === 'BEARISH') {
    dominant_narrative = 'Near-term headline friction and cautious liquidity positioning temper risk asset momentum.'
  } else if (bias === 'STRONG_BEARISH') {
    dominant_narrative = 'Macro tightening headwinds or acute market-wide risk events prompt defensive capital preservation across digital assets.'
  }

  const confluence_impact = bias.includes('BULLISH')
    ? 'Factor 9 evaluates +10.0 pts bullish fundamental alignment with technical momentum.'
    : bias.includes('BEARISH')
    ? 'Factor 9 awards 0.0 pts to shield capital against macro volatility and headline risk.'
    : 'Factor 9 maintains neutral 0.0 pts posture pending session confirmation.'

  // Extract real, informative key factors from actual top articles
  const factors: string[] = articles.slice(0, 3).map((a) => `${a.source}: "${a.title}"`)

  return {
    sentiment_score: score,
    bias,
    speaker_entity,
    dominant_narrative,
    confluence_impact,
    high_impact_warning: hasHighImpactEvent,
    key_factors: factors.length ? factors : ['Macro economic indicators stable.', 'Spot market liquidity steady.'],
    evaluated_at: new Date().toISOString(),
  }
}

export async function GET() {
  const now = Date.now()

  // 1. Refresh Economic Calendar if cache older than 10 minutes
  if (now - lastMacroFetch > 600000 || cachedMacroEvents.length === 0) {
    try {
      const ffRes = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      })
      if (ffRes.ok) {
        const data = await ffRes.json()
        const parsedEvents: EconomicEvent[] = []
        if (Array.isArray(data)) {
          for (const item of data) {
            const country = (item.country || '').toUpperCase()
            const impact = (item.impact || '').toUpperCase()
            if (country === 'USD' && (impact === 'HIGH' || impact === 'MEDIUM')) {
              const eventTitle = cleanText(item.title)
              parsedEvents.push({
                title: eventTitle,
                country,
                impact: impact === 'HIGH' ? 'HIGH' : 'MEDIUM',
                date_time: item.date || '',
                forecast: item.forecast || undefined,
                previous: item.previous || undefined,
                actual: item.actual || undefined,
                image_url: getMacroEventImage(eventTitle),
              })
            }
          }
        }
        cachedMacroEvents = getUpcomingMacroEvents(parsedEvents)
        lastMacroFetch = now
      }
    } catch (err) {
      console.warn('ForexFactory calendar fetch error:', err)
    }

    if (cachedMacroEvents.length === 0) {
      cachedMacroEvents = getUpcomingMacroEvents([])
    }
  }

  // 2. Refresh Articles if cache older than 20 seconds from Top 4 Premier Feeds
  if (now - lastArticlesFetch > 20000 || cachedArticles.length === 0) {
    const fetchedArticles: NewsArticle[] = []

    await Promise.all([
      fetchRssFeed('Federal Reserve Speeches', 'https://www.federalreserve.gov/feeds/speeches.xml', fetchedArticles, 6),
      fetchRssFeed('Federal Reserve FOMC', 'https://www.federalreserve.gov/feeds/press_monetary.xml', fetchedArticles, 6),
      fetchRssFeed('CoinDesk', 'https://www.coindesk.com/arc/outboundfeeds/rss/', fetchedArticles, 8),
      fetchRssFeed('CoinTelegraph', 'https://cointelegraph.com/rss', fetchedArticles, 8),
      fetchRssFeed('Decrypt', 'https://decrypt.co/feed', fetchedArticles, 8),
      fetchRssFeed('The Block', 'https://www.theblock.co/rss.xml', fetchedArticles, 8),
    ])

    if (fetchedArticles.length > 0) {
      fetchedArticles.sort((a, b) => {
        const timeA = new Date(a.published_at).getTime() || 0
        const timeB = new Date(b.published_at).getTime() || 0
        return timeB - timeA
      })
      cachedArticles = fetchedArticles.slice(0, 25)
      lastArticlesFetch = now
    }
  }

  // 3. Query Backend Python Engine for Authentic Gemini LLM Sentiment
  if (now - lastSentimentFetch > 60000 || !cachedSentiment) {
    const backendEndpoints = [
      'https://acts-trading-brain.herokuapp.com/api/sentiment/live',
      'http://127.0.0.1:7860/api/sentiment/live',
    ]

    let fetchedFromBackend = false
    for (const ep of backendEndpoints) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3500)
        const res = await fetch(ep, { signal: controller.signal, cache: 'no-store' })
        clearTimeout(timeoutId)
        if (res.ok) {
          const json = await res.json()
          if (json.status === 'success' && json.sentiment) {
            cachedSentiment = {
              sentiment_score: json.sentiment.sentiment_score ?? 0.0,
              bias: json.sentiment.bias || 'NEUTRAL',
              speaker_entity: json.sentiment.speaker_entity || 'Global Macro Desk',
              dominant_narrative: json.sentiment.dominant_narrative || 'Normal market condition.',
              fed_statement_quote: json.sentiment.fed_statement_quote,
              confluence_impact: json.sentiment.confluence_impact || 'Factor 9 maintains neutral 0.0 pts posture.',
              high_impact_warning: Boolean(json.sentiment.high_impact_warning),
              key_factors: Array.isArray(json.sentiment.key_factors) ? json.sentiment.key_factors : [],
              evaluated_at: json.sentiment.evaluated_at || new Date().toISOString(),
            }
            lastSentimentFetch = now
            fetchedFromBackend = true
            break
          }
        }
      } catch {
        // Continue to fallback if backend endpoint timeout
      }
    }

    if (!fetchedFromBackend) {
      cachedSentiment = calculateCalibratedSentiment(cachedArticles, cachedMacroEvents)
      lastSentimentFetch = now
    }
  }

  return NextResponse.json(
    {
      articles: cachedArticles.slice(0, 25),
      macro_events: cachedMacroEvents.slice(0, 12),
      sentiment: cachedSentiment || calculateCalibratedSentiment(cachedArticles, cachedMacroEvents),
      fetched_at: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  )
}
