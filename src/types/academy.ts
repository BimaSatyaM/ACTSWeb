/**
 * ACTS Academy Types & Interface Contracts
 * Matching PROJECT.md § Interface Contracts
 */

export type TrackId =
  | 'foundations'
  | 'technical-analysis'
  | 'macroeconomics'
  | 'legends'
  | 'advanced-order-mechanics'
  | 'trading-psychology'
  | 'crypto-derivatives'
  | 'systematic-testing'
  | 'acts-confluence-scoring'
export type TradeDirection = 'LONG' | 'SHORT'

// --- Candle & Market Data ---

export interface CandleData {
  time: number | string // UNIX timestamp in seconds or ISO string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export type CandleDataSource = 'BINANCE_FUTURES' | 'BINANCE_SPOT' | 'BUNDLED_FALLBACK'

export interface CandleApiResponse {
  success: boolean
  symbol: string
  interval: string
  dataSource: CandleDataSource
  isFallback: boolean
  candles: CandleData[]
  timestamp?: string
}

// --- Technical Indicators ---

export interface IndicatorPoint {
  time: number | string
  value: number
}

export interface BollingerBandsPoint {
  time: number | string
  upper: number
  middle: number
  lower: number
}

export interface MACDPoint {
  time: number | string
  macd: number
  signal: number
  histogram: number
}

// --- Bracket Math & Trade Replay ---

export interface TradeBracketInput {
  entryPrice: number
  stopLossPrice: number
  takeProfit1Price: number
  takeProfit2Price: number
  takeProfit3Price: number
  direction: TradeDirection
}

export interface TradeBracketResult {
  initialRisk: number // |entry - SL|
  rMultiple: number // realized weighted R-multiple
  outcome: 'STOP_LOSS' | 'TP1_HIT' | 'TP2_HIT' | 'TP3_HIT' | 'BREAKEVEN'
  tp1Weight: number // 0.40
  tp2Weight: number // 0.35
  tp3Weight: number // 0.25
  breakdown: string
}

export interface BracketSetup {
  direction: TradeDirection
  entry: number
  sl: number
  risk: number
  tp1: number // +1.0R (40% exit)
  tp2: number // +2.0R (35% exit)
  tp3: number // +3.5R (25% exit)
  weightTp1: number // 0.40
  weightTp2: number // 0.35
  weightTp3: number // 0.25
}

export interface ReplayTradeState {
  isClosed: boolean
  currentSl: number
  tp1Hit: boolean
  tp2Hit: boolean
  tp3Hit: boolean
  exitReason: 'ACTIVE' | 'SL' | 'TP1_BREAKEVEN' | 'TP2_TRAILING_TP1' | 'TP2_TRAILING_MID' | 'TP3'
  realizedR: number
  exitCandleIndex: number
}

export interface PositionSizingResult {
  positionSize: number
  riskAmount: number
  isValid: boolean
  warning?: string
}

// --- Curriculum & Coursework Schema ---

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface ChartExerciseConfig {
  id: string
  symbol: string
  timeframe: string
  candleSliceStart: number
  setupBarIndex: number
  defaultIndicators: string[]
  suggestedDirection: TradeDirection
  suggestedEntry: number
  suggestedSL: number
  suggestedTP1: number
  suggestedTP2: number
  suggestedTP3: number
  explanation: string
}

export interface MacroEventLink {
  eventId: string
  title: string
  agency: string
  releaseDate: string
  actual?: string
  forecast?: string
  previous?: string
  historicalBtcImpact: string
}

export interface PrimarySource {
  title: string
  url: string
  note?: string
}

export interface Lesson {
  id: string
  trackId: TrackId
  moduleId: string
  title: string
  slug: string
  readingTimeMinutes: number
  order: number
  learningObjectives: string[]
  contentMarkdown: string
  quiz?: QuizQuestion[]
  chartExercise?: ChartExerciseConfig
  macroEvent?: MacroEventLink
  primarySources: PrimarySource[]
  isFree: boolean
}

export interface Module {
  id: string
  trackId: TrackId
  title: string
  description: string
  order: number
  lessons: Lesson[]
}

export interface Track {
  id: TrackId
  title: string
  tagline: string
  description: string
  isFree: boolean
  estimatedHours: number
  iconName: string
  modules: Module[]
  isComingSoon?: boolean
  badge?: string
}

export interface UserAcademyProgress {
  completedLessonIds: string[]
  quizScores: Record<string, { score: number; total: number; passed: boolean }>
  completedExerciseIds: string[]
  lastVisitedLessonId?: string
  lastUpdated: string
}
