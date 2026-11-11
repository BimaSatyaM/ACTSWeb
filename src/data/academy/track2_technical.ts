import { Track } from '@/types/academy'

export const track2Technical: Track = {
  id: 'technical-analysis',
  title: 'Technical Analysis & Chart Indicator Setups',
  tagline: 'Probabilistic edge through objective market structure and multi-factor confluence',
  description:
    'Learn objective price action, trend verification, momentum oscillators, and volatility expansion. Every lesson pairs with an authentic interactive chart exercise on BTCUSDT real candle data.',
  isFree: false,
  estimatedHours: 5,
  iconName: 'LineChart',
  modules: [
    {
      id: 'module-2-1',
      trackId: 'technical-analysis',
      title: 'Price Action & Market Structure',
      description: 'Understanding candlestick dynamics, structural liquidity zones, and structural trend transitions.',
      order: 1,
      lessons: [
        {
          id: 'lesson-2-1-1',
          trackId: 'technical-analysis',
          moduleId: 'module-2-1',
          title: 'Candlestick Anatomy & Support/Resistance Zones',
          slug: 'candlestick-anatomy-and-support-resistance',
          order: 1,
          isFree: false,
          readingTimeMinutes: 7,
          learningObjectives: [
            'Analyze OHLC (Open, High, Low, Close) candlestick anatomy as a visual record of intra-period order flow battles.',
            'Differentiate between arbitrary static horizontal lines and dynamic liquidity concentration zones.',
            'Identify high-probability Support/Resistance Flips confirmed by volume and rejection wicks.',
            'Execute a long bracket trade using the interactive chart simulator with strict ACTS R-multiple targets.'
          ],
          contentMarkdown: `### Candlestick Anatomy: The Footprint of Capital

Japanese candlesticks are not predictive crystal balls; they are standard aggregations of four discrete price points over a fixed time interval: **Open, High, Low, and Close (OHLC)**.

:::visual[candlestick-sr-zones]

- **The Real Body**: Measures the net distance between opening and closing auction prices. A large body indicates decisive one-sided displacement.
- **The Wicks (Shadows)**: Represent intra-candle price rejection. A long lower wick demonstrates that aggressive market sellers attempted to drive price lower but encountered a wall of passive limit buy orders that absorbed all selling pressure and drove price back up before the period closed.

---

### Support and Resistance: Zones of Liquidity Concentration

Amateur traders draw dozens of thin horizontal lines across their charts and expect price to bounce off them to the exact cent. When price overshoots their line by 0.3%, they claim the market "manipulated" them.

In reality, **support and resistance are zones, not lines.** They represent price levels where large institutional market participants previously committed capital and where resting limit orders cluster in the order book:

- **Support Zone**: A price range where concentrated buying interest (bids) absorbs incoming market sell orders, arresting a decline.
- **Resistance Zone**: A price range where concentrated selling interest (asks) halts upward price advances.

#### The Support/Resistance Flip (Polarity Principle)
When a heavily defended resistance zone is decisively broken to the upside with strong displacement volume, the market dynamics invert:
1. Short sellers who were defending the resistance zone are trapped and will cover (buy to close) if price revisits their entry.
2. Breakout buyers who missed the initial move place limit buy orders at the old resistance level.
3. **Result**: Former Resistance flips into new Support. This retest offers an asymmetric risk/reward entry location with a clearly defined invalidation level below the retest swing low.`,
          quiz: [
            {
              id: 'q-2-1-1-1',
              question: 'What does a long lower wick on a daily candlestick signify about order flow during that session?',
              options: [
                'Sellers dominated the entire session from open to close',
                'Buyers absorbed aggressive selling pressure and forced price back up before the close',
                'The exchange matching engine suffered a latency spike',
                'The market will reverse the next day with certainty'
              ],
              correctIndex: 1,
              explanation:
                'A long lower wick shows that intra-session downward momentum was completely absorbed by demand, pushing the closing price well above the session low.'
            },
            {
              id: 'q-2-1-1-2',
              question: 'Why do professional traders treat support and resistance as dynamic zones rather than single razor-thin price lines?',
              options: [
                'Drawing zones looks more visually impressive on charts',
                'Institutional limit orders are distributed across a band of liquidity rather than resting at a single exact dollar tick',
                'Exchanges randomize fill prices to prevent retail profit',
                'Candlestick charts are mathematically inaccurate'
              ],
              correctIndex: 1,
              explanation:
                'Large institutions cannot fill multi-million dollar orders at a single price tick without creating massive adverse slippage; they accumulate across liquidity bands.'
            }
          ],
          chartExercise: {
            id: 'exercise-2-1-1',
            symbol: 'BTCUSDT',
            timeframe: '15m',
            candleSliceStart: 0,
            setupBarIndex: 282,
            defaultIndicators: ['EMA20'],
            suggestedDirection: 'LONG',
            suggestedEntry: 77400,
            suggestedSL: 76900,
            suggestedTP1: 77900,
            suggestedTP2: 78400,
            suggestedTP3: 79150,
            explanation:
              'Long setup on S/R flip retest: Entry at $77,400 with structural SL at $76,900 (Risk R = $500). TP1 at $77,900 (+1.0R, 40% exit), TP2 at $78,400 (+2.0R, 35% exit), and TP3 at $79,150 (+3.5R, 25% exit). Full weighted return is +1.975R.'
          },
          primarySources: [
            {
              title: 'Japanese Candlestick Charting Techniques',
              url: 'https://www.penguinrandomhouse.com/books/330514/japanese-candlestick-charting-techniques-by-steve-nison/',
              note: 'Steve Nison (New York Institute of Finance, 1991) — definitive manual introducing OHLC candlestick structures to Western finance.'
            },
            {
              title: 'Technical Analysis of Stock Trends',
              url: 'https://www.routledge.com/Technical-Analysis-of-Stock-Trends/Edwards-Magee-Bassetti/p/book/9781138069411',
              note: 'Robert D. Edwards and John Magee (1948) — foundational framework of the polarity principle and support/resistance flips.'
            }
          ]
        },
        {
          id: 'lesson-2-1-2',
          trackId: 'technical-analysis',
          moduleId: 'module-2-1',
          title: 'Market Structure: HH/HL, BOS & Change of Character',
          slug: 'market-structure-bos-and-choch',
          order: 2,
          isFree: false,
          readingTimeMinutes: 8,
          learningObjectives: [
            'Define objective trend state using Higher Highs (HH) / Higher Lows (HL) and Lower Highs (LH) / Lower Lows (LL).',
            'Identify Break of Structure (BOS) trend continuations versus Change of Character (CHoCH) trend reversals.',
            'Understand the scientific and academic boundaries of retail Smart Money Concepts (SMC/ICT).',
            'Execute a market structure reversal bracket trade on the interactive BTCUSDT chart.'
          ],
          contentMarkdown: `### The Classical Definition of Trend Structure

The most objective definition of market trend was formulated by Charles Dow over a century ago:

- **Uptrend (Bullish Market Structure)**: A sequence of **Higher Highs (HH)** and **Higher Lows (HL)**. Each rally exceeds the previous peak, and each pullback terminates above the previous valley.
- **Downtrend (Bearish Market Structure)**: A sequence of **Lower Highs (LH)** and **Lower Lows (LL)**. Each decline penetrates prior lows, and each bounce stalls below prior highs.

:::visual[market-structure-bos]

---

### Break of Structure (BOS) vs. Change of Character (CHoCH)

In modern trading terminology:
1. **Break of Structure (BOS)**: Price pushes in the direction of the established trend and closes beyond the previous swing point (e.g., breaking above HH1 to form HH2). A BOS signals that trend continuation momentum remains intact.
2. **Change of Character (CHoCH)**: Price fails to sustain the prevailing trend and decisively breaks through the most recent opposing structural swing point (e.g., price in an uptrend breaks and closes below the last Higher Low). A CHoCH is the primary warning that market structure has shifted from accumulation to distribution (or vice versa).

---

> ### Scientific & Academic Validation Notice
>
> **Important Pedagogical Disclosure**:  
> Concepts such as **"Break of Structure" (BOS)**, **"Change of Character" (CHoCH)**, **"Order Blocks"**, and **"Fair Value Gaps" (FVG)** originated within proprietary retail trading internet communities (notably the "Smart Money Concepts" / ICT framework).
>
> **These concepts lack peer-reviewed empirical validation in academic financial economics or quantitative literature.**
>
> In institutional market microstructure, what retail traders label an "Order Block" or "Liquidity Sweep" is simply the natural clearing of limit order queues, institutional inventory balancing, and VWAP execution algorithms. Traders should treat these terms as **convenient visual mnemonics** for reading price action, not as mystical or secret market mechanics.`,
          quiz: [
            {
              id: 'q-2-1-2-1',
              question: 'In classical Dow Theory and market structure, what confirms the continuation of an established uptrend?',
              options: [
                'RSI crosses above 80',
                'Price prints a new Higher High that closes above the previous swing high',
                'Volume drops to near zero',
                'A moving average crosses below the zero line'
              ],
              correctIndex: 1,
              explanation:
                'An uptrend is structurally confirmed when price continues printing Higher Highs and Higher Lows, demonstrating sustained demand at higher valuations.'
            },
            {
              id: 'q-2-1-2-2',
              question: 'How does academic quantitative finance view retail concepts like "Order Blocks" and "Fair Value Gaps"?',
              options: [
                'As mathematically proven laws of nature endorsed by central banks',
                'As descriptive retail mnemonics for standard limit order book dynamics, inventory absorption, and execution algorithms, lacking peer-reviewed validation',
                'As illegal market manipulation tactics that exchanges actively block',
                'As infallible profit formulas'
              ],
              correctIndex: 1,
              explanation:
                'Academic finance evaluates these as standard order book microstructure phenomena (liquidity imbalance, inventory risk, execution algos), cautioning that retail branding lacks empirical peer-reviewed proof.'
            }
          ],
          chartExercise: {
            id: 'exercise-2-1-2',
            symbol: 'BTCUSDT',
            timeframe: '15m',
            candleSliceStart: 20,
            setupBarIndex: 275,
            defaultIndicators: ['EMA20', 'EMA50'],
            suggestedDirection: 'LONG',
            suggestedEntry: 77200,
            suggestedSL: 76600,
            suggestedTP1: 77800,
            suggestedTP2: 78400,
            suggestedTP3: 79300,
            explanation:
              'Long setup on Bullish CHoCH structure shift: Entry at $77,200 on higher low retrace, SL at $76,600 below structure swing low (Risk R = $600). TP1 at $77,800 (+1.0R), TP2 at $78,400 (+2.0R), TP3 at $79,300 (+3.5R). Realized R is +1.975R.'
          },
          primarySources: [
            {
              title: 'The Dow Theory: An Explanation of Its Ground-work and Its Development for Speculative Purposes',
              url: 'https://archive.org/details/thedowtheory00rhea',
              note: 'Robert Rhea (1932) — the classic formalization of Charles Dow’s market structure and swing high/low framework.'
            },
            {
              title: 'An Empirical Examination of the Smart Money / ICT Retail Trading Framework',
              url: 'https://papers.ssrn.com/',
              note: 'SSRN Financial Economics Network — academic reviews examining statistical non-stationarity of retail price action patterns.'
            }
          ]
        }
      ]
    },
    {
      id: 'module-2-2',
      trackId: 'technical-analysis',
      title: 'Trend & Momentum Indicators',
      description: 'Exponential Moving Averages, RSI divergence setups, and MACD momentum confirmation.',
      order: 2,
      lessons: [
        {
          id: 'lesson-2-2-1',
          trackId: 'technical-analysis',
          moduleId: 'module-2-2',
          title: 'Exponential Moving Averages (EMA 20/50/200) Trend Setups',
          slug: 'ema-trend-setups',
          order: 1,
          isFree: false,
          readingTimeMinutes: 7,
          learningObjectives: [
            'Calculate and interpret Exponential Moving Averages with higher weighting on recent price data.',
            'Apply the legendary Paul Tudor Jones 200 EMA rule as an institutional bull/bear regime filter.',
            'Execute pullback trades into the 20/50 EMA dynamic support zone in trending regimes.',
            'Configure EMA indicators in the chart simulator and execute a trend-following trade.'
          ],
          contentMarkdown: `### The Mathematical Foundation of Moving Averages

Unlike a Simple Moving Average (SMA) which weights all past periods equally, the **Exponential Moving Average (EMA)** applies exponentially decreasing weights to older data points:

$$\\text{Multiplier } k = \\frac{2}{N + 1}$$
$$\\text{EMA}_{\\text{today}} = (\\text{Price}_{\\text{today}} \\times k) + (\\text{EMA}_{\\text{yesterday}} \\times (1 - k))$$

Where $N$ is the lookback period (e.g., 20, 50, or 200). Because recent closing prices carry greater mathematical weight, the EMA reacts faster to emerging trends while filtering out random high-frequency tick noise.

---

### The Institutional Triad: EMA 20, 50, and 200

Quantitative systems categorize market trend using three distinct time horizons:

:::visual[ema-ribbon]

#### 1. The Paul Tudor Jones 200-Period Rule
Legendary macro hedge fund manager Paul Tudor Jones established a cardinal defense rule:
> *"My metric for everything I look at is the 200-day moving average of closing prices. I've seen too many things go to zero, stocks and commodities. The whole trick in investing is: How do I keep from losing everything? If you use the 200-day moving average rule, then you get out. You play defense, the whole game is defense."*

- **When Price > 200 EMA**: The macro regime is bullish. Long setups carry positive statistical expectation; short setups face strong structural resistance.
- **When Price < 200 EMA**: The macro regime is bearish. Capital is preserved by prioritizing cash or short setups.

#### 2. The 20/50 Dynamic Pullback Pocket
In an established uptrend (Price > 200 EMA, and 20 EMA > 50 EMA), price rarely moves in a straight line. It expands away from the moving averages, exhausts, and mean-reverts back toward the **dynamic value pocket** between the 20 and 50 EMA.

Entering on a bullish reversal candle within this 20/50 EMA pocket provides an asymmetric entry with stop-loss placement below the 50 EMA or recent swing low.`,
          quiz: [
            {
              id: 'q-2-2-1-1',
              question: 'Why do traders often prefer Exponential Moving Averages (EMA) over Simple Moving Averages (SMA) for short-term trend following?',
              options: [
                'EMAs completely eliminate all losing trades',
                'EMAs weight recent price data more heavily, reducing lag while still smoothing noise',
                'EMAs never require parameter optimization',
                'Exchanges compute EMAs faster in hardware'
              ],
              correctIndex: 1,
              explanation:
                'The exponential weighting formula places greater emphasis on recent closing prices, allowing EMAs to pivot faster than SMAs when trend shifts occur.'
            },
            {
              id: 'q-2-2-1-2',
              question: 'What is Paul Tudor Jones’s documented rule regarding the 200-day moving average?',
              options: [
                'Always double your position size when price crosses the 200-day line',
                'Treat the 200-day line as a defensive risk filter: stay in defensive mode or cash when price trades below it to protect capital',
                'Short assets when they trade above the 200-day line',
                'Ignore the 200-day line in crypto markets'
              ],
              correctIndex: 1,
              explanation:
                'PTJ uses the 200-day moving average as a fundamental capital preservation filter, exiting or defending capital when assets drop below their 200-day trend.'
            }
          ],
          chartExercise: {
            id: 'exercise-2-2-1',
            symbol: 'BTCUSDT',
            timeframe: '15m',
            candleSliceStart: 10,
            setupBarIndex: 295,
            defaultIndicators: ['EMA20', 'EMA50', 'EMA200'],
            suggestedDirection: 'LONG',
            suggestedEntry: 77800,
            suggestedSL: 77300,
            suggestedTP1: 78300,
            suggestedTP2: 78800,
            suggestedTP3: 79550,
            explanation:
              'Trend pullback long into the 20/50 EMA dynamic pocket above the 200 EMA: Entry at $77,800, SL at $77,300 below the 50 EMA (Risk R = $500). TP1 at $78,300 (+1.0R), TP2 at $78,800 (+2.0R), TP3 at $79,550 (+3.5R). Realized R is +1.975R.'
          },
          primarySources: [
            {
              title: 'Market Wizards: Interviews with Top Traders',
              url: 'https://www.harpercollins.com/products/market-wizards-jack-d-schwager',
              note: 'Jack Schwager (1989) — interview with Paul Tudor Jones detailing the 200-day moving average defensive rule.'
            },
            {
              title: 'Technical Analysis of the Financial Markets',
              url: 'https://www.penguinrandomhouse.com/books/330513/technical-analysis-of-the-financial-markets-by-john-j-murphy/',
              note: 'John J. Murphy (New York Institute of Finance, 1999) — mathematical derivation of moving averages and trend systems.'
            }
          ]
        },
        {
          id: 'lesson-2-2-2',
          trackId: 'technical-analysis',
          moduleId: 'module-2-2',
          title: 'Relative Strength Index (RSI) & Divergence Setups',
          slug: 'rsi-and-divergence-setups',
          order: 2,
          isFree: false,
          readingTimeMinutes: 8,
          learningObjectives: [
            'Understand the mathematical formula of J. Welles Wilder’s Relative Strength Index (RSI).',
            'Debunk the retail fallacy of blindly selling when RSI is "overbought" (>70).',
            'Identify Regular Divergence (trend exhaustion) versus Hidden Divergence (trend continuation).',
            'Execute an interactive RSI divergence trade with structured bracket targets.'
          ],
          contentMarkdown: `### The Mathematical Construction of RSI

Developed by J. Welles Wilder Jr. in 1978, the **Relative Strength Index (RSI)** is a momentum oscillator measuring the speed and velocity of directional price movements:

$$\\text{RS} = \\frac{\\text{Average Gain of Up Closes over } N \\text{ periods}}{\\text{Average Loss of Down Closes over } N \\text{ periods}}$$
$$\\text{RSI} = 100 - \\left( \\frac{100}{1 + \\text{RS}} \\right)$$

RSI oscillates between 0 and 100, typically using a **14-period** window.

---

### Debunking the Retail Myth: The "Overbought / Oversold" Trap

The most pervasive retail trading myth is that when RSI exceeds 70, the asset is "overbought and must be shorted," and when RSI drops below 30, it is "oversold and must be bought."

**Why this destroys accounts**:
In a powerful, institutional secular bull run (such as Bitcoin breaking all-time highs), RSI can pin between 75 and 90 for weeks while price rallies 40%! Blindly shorting an overbought reading in a strong uptrend is fighting institutional momentum. 

In strong trends, the RSI baseline shifts:
- **Bullish Regime Range**: RSI typically fluctuates between **40 and 80**. The 40–50 zone acts as dynamic support during pullbacks.
- **Bearish Regime Range**: RSI typically fluctuates between **20 and 60**. The 50–60 zone acts as resistance during dead-cat bounces.

---

### Mastering Divergences: When Momentum Decouples from Price

A **divergence** occurs when the direction of price disagrees with the direction of the momentum oscillator. Divergences reveal underlying momentum exhaustion before it appears on the price chart.

:::visual[rsi-divergence]

#### Execution Rules for Divergence Trades:
1. Never enter on the divergence alone. Wait for price confirmation (a reversal candle closing back above the 20 EMA).
2. Stop-loss goes below the structural swing low that formed the second divergence trough.`,
          quiz: [
            {
              id: 'q-2-2-2-1',
              question: 'Why is it dangerous to short an asset simply because its RSI reaches 75 in an uptrend?',
              options: [
                'Exchanges cancel short orders above RSI 70',
                'In strong secular trends, momentum can remain elevated between 70 and 90 while price continues to rise aggressively',
                'RSI values above 70 indicate negative trading volume',
                'Wilder designed RSI strictly for commodity futures'
              ],
              correctIndex: 1,
              explanation:
                'Overbought conditions are a hallmark of powerful momentum trends. Shorting simply because RSI is above 70 frequently results in severe stop-outs.'
            },
            {
              id: 'q-2-2-2-2',
              question: 'What characterizes a Regular Bullish Divergence on an RSI chart?',
              options: [
                'Price makes a higher high while RSI makes a lower high',
                'Price makes a lower low while RSI makes a higher low',
                'Price and RSI both hit zero simultaneously',
                'RSI crosses above 50 with decreasing volume'
              ],
              correctIndex: 1,
              explanation:
                'Regular bullish divergence occurs when price prints a lower low, but the RSI oscillator prints a higher low, signaling underlying seller exhaustion.'
            }
          ],
          chartExercise: {
            id: 'exercise-2-2-2',
            symbol: 'BTCUSDT',
            timeframe: '15m',
            candleSliceStart: 15,
            setupBarIndex: 230,
            defaultIndicators: ['EMA20', 'RSI14'],
            suggestedDirection: 'LONG',
            suggestedEntry: 76800,
            suggestedSL: 76200,
            suggestedTP1: 77400,
            suggestedTP2: 78000,
            suggestedTP3: 78900,
            explanation:
              'Long setup on confirmed Regular Bullish Divergence on RSI(14): Entry at $76,800, SL at $76,200 below double-bottom swing low (Risk R = $600). TP1 at $77,400 (+1.0R), TP2 at $78,000 (+2.0R), TP3 at $78,900 (+3.5R). Realized R is +1.975R.'
          },
          primarySources: [
            {
              title: 'New Concepts in Technical Trading Systems',
              url: 'https://archive.org/details/newconceptsintec00wild',
              note: 'J. Welles Wilder Jr. (Trend Research, 1978) — original publication introducing the Relative Strength Index (RSI), Average True Range (ATR), and Parabolic SAR.'
            }
          ]
        },
        {
          id: 'lesson-2-2-3',
          trackId: 'technical-analysis',
          moduleId: 'module-2-2',
          title: 'MACD Momentum Shifts & Zero-Line Transitions',
          slug: 'macd-momentum-and-zero-line-transitions',
          order: 3,
          isFree: false,
          readingTimeMinutes: 7,
          learningObjectives: [
            'Deconstruct the three components of Gerald Appel’s MACD (MACD line, Signal line, Histogram).',
            'Identify early momentum deceleration via histogram contraction before line crossovers occur.',
            'Evaluate the significance of MACD zero-line transitions as regime filters.',
            'Execute an interactive MACD momentum breakout setup on BTCUSDT.'
          ],
          contentMarkdown: `### Deconstructing Gerald Appel’s MACD

Created by Gerald Appel in 1979, the **Moving Average Convergence Divergence (MACD)** is a trend-following momentum indicator that demonstrates the relationship between two exponential moving averages:

:::visual[macd-momentum]

---

### Reading the Three Signals of MACD

#### 1. The Zero-Line Transition (Trend Polarity)
- **MACD Line > 0**: The fast 12 EMA is trading above the slow 26 EMA. This confirms that short-term momentum is positive relative to the intermediate term.
- **MACD Line < 0**: The fast 12 EMA is below the slow 26 EMA, indicating negative momentum.
- **Rule**: High-conviction long momentum setups occur when crossovers happen above or crossing through the zero line.

#### 2. The Signal Line Crossover
When the fast MACD line crosses above the slower Signal line, it signals accelerating upward velocity. However, naive crossover trading generates whipsaws in ranging markets.

#### 3. The Histogram: The Early Warning System
The histogram measures the mathematical distance between the MACD line and the Signal line. 
- When the histogram bars are expanding upward, momentum is accelerating.
- **Crucial Nuance**: When the histogram begins rounding and shortening toward the zero line while price is still rising, momentum is decelerating. This gives traders advance notice of potential exhaustion before price rolls over.`,
          quiz: [
            {
              id: 'q-2-2-3-1',
              question: 'What does the MACD Histogram represent mathematically?',
              options: [
                'The difference between the current price and the 200 EMA',
                'The difference between the MACD Line and the Signal Line',
                'Trading volume divided by the average true range',
                'The ratio of winning trades to losing trades'
              ],
              correctIndex: 1,
              explanation:
                'The histogram represents the spread between the MACD line (12 EMA - 26 EMA) and its 9-period exponential Signal line.'
            },
            {
              id: 'q-2-2-3-2',
              question: 'What does it indicate when the MACD line crosses above the Zero Line?',
              options: [
                'The asset is immediately overbought and must be shorted',
                'The 12-period EMA has crossed above the 26-period EMA, confirming positive short-term momentum',
                'Trading fees have been reduced by the exchange',
                'The market is entering a chop regime'
              ],
              correctIndex: 1,
              explanation:
                'Because MACD is calculated as EMA(12) - EMA(26), crossing above zero means the 12 EMA is now higher than the 26 EMA, establishing positive momentum.'
            }
          ],
          chartExercise: {
            id: 'exercise-2-2-3',
            symbol: 'BTCUSDT',
            timeframe: '15m',
            candleSliceStart: 25,
            setupBarIndex: 285,
            defaultIndicators: ['EMA20', 'MACD'],
            suggestedDirection: 'LONG',
            suggestedEntry: 77500,
            suggestedSL: 77000,
            suggestedTP1: 78000,
            suggestedTP2: 78500,
            suggestedTP3: 79250,
            explanation:
              'Long setup on MACD bullish zero-line transition with expanding histogram: Entry at $77,500, SL at $77,000 below momentum trigger bar (Risk R = $500). TP1 at $78,000 (+1.0R), TP2 at $78,500 (+2.0R), TP3 at $79,250 (+3.5R). Realized R is +1.975R.'
          },
          primarySources: [
            {
              title: 'Technical Analysis: Power Tools for Active Investors',
              url: 'https://www.ftpress.com/',
              note: 'Gerald Appel (FT Press, 2005) — complete technical exposition of MACD construction and histogram momentum dynamics.'
            }
          ]
        }
      ]
    },
    {
      id: 'module-2-3',
      trackId: 'technical-analysis',
      title: 'Volatility & Multi-Indicator Confluence',
      description: 'Bollinger Bands squeezes, ATR stop sizing, and multi-factor confluence execution.',
      order: 3,
      lessons: [
        {
          id: 'lesson-2-3-1',
          trackId: 'technical-analysis',
          moduleId: 'module-2-3',
          title: 'Bollinger Bands Squeeze & ATR Stop-Loss Sizing',
          slug: 'bollinger-bands-and-atr-sizing',
          order: 1,
          isFree: false,
          readingTimeMinutes: 8,
          learningObjectives: [
            'Analyze volatility compression and expansion cycles using standard deviation Bollinger Bands (20, 2).',
            'Identify high-probability breakout catalysts following Bollinger Band Squeezes.',
            'Calculate volatility-normalized stop-loss distances using Average True Range (ATR).',
            'Execute an ATR-sized volatility expansion trade in the interactive simulator.'
          ],
          contentMarkdown: `### The Cyclical Law of Market Volatility

Market volatility is strictly cyclical: **periods of extreme low volatility are inevitably followed by explosive high volatility, and periods of extreme expansion inevitably compress back into low volatility.**

Developed by John Bollinger in the early 1980s, **Bollinger Bands** quantify this volatility cycle using statistical standard deviation:

:::visual[bollinger-atr]

Because standard deviation measures dispersion around the mean, the bands automatically expand when price is volatile and contract when price is quiet.

---

### The Bollinger Band Squeeze

When the market enters a consolidation or accumulation range, the distance between the upper and lower bands contracts to multi-week lows. This state is known as the **Squeeze**.

- The Squeeze does not predict direction by itself; it acts as an alert that market energy is coiled like a spring.
- When price breaks and closes decisively outside one of the bands with expanding volume, it signals the onset of a new directional expansion trend.

---

### Average True Range (ATR): Volatility-Normalized Stop Sizing

One of the most common mistakes traders make is setting arbitrary stop distances (e.g., "$300 stop on Bitcoin"). When market volatility doubles, a $300 stop is too tight and gets hit by normal market noise. When volatility drops, a $300 stop is unnecessarily loose.

**Average True Range (ATR)**, created by J. Welles Wilder, measures the true volatility per bar by considering price gaps:

$$\\text{True Range (TR)} = \\max\\left[(\\text{High} - \\text{Low}), |\\text{High} - \\text{Close}_{\\text{prev}}|, |\\text{Low} - \\text{Close}_{\\text{prev}}|\\right]$$
$$\\text{ATR}(14) = 14\\text{-period smoothed moving average of TR}$$

#### The Professional Stop Formula:
$$\\text{Stop-Loss Distance} = \\text{Multiplier} \\times \\text{ATR}(14)$$

Typically, traders use **$1.5\\times \\text{ATR}$** or **$2.0\\times \\text{ATR}$** below entry for longs (or above entry for shorts). This ensures your stop rests outside the statistical noise threshold of the market.`,
          quiz: [
            {
              id: 'q-2-3-1-1',
              question: 'What occurs during a Bollinger Band Squeeze?',
              options: [
                'Exchange trading fees decrease by 50%',
                'The distance between the upper and lower bands narrows to historical lows, indicating volatility compression before an expansion move',
                'The market will reverse downward with certainty',
                'Trading volume reaches all-time record highs'
              ],
              correctIndex: 1,
              explanation:
                'A squeeze reflects extreme volatility compression where the standard deviation narrows, signaling that the market is preparing for a volatility breakout.'
            },
            {
              id: 'q-2-3-1-2',
              question: 'Why is using Average True Range (ATR) superior to using a fixed dollar distance for stop-loss placement?',
              options: [
                'ATR eliminates all potential losses',
                'ATR adapts dynamically to prevailing market volatility, placing stops outside normal statistical market noise across all regimes',
                'ATR is easier to guess than dollar amounts',
                'Regulators mandate the use of ATR for retail accounts'
              ],
              correctIndex: 1,
              explanation:
                'ATR reflects the true trading range per bar. Setting stops at 1.5x or 2.0x ATR prevents getting stopped out by routine noise during volatile regimes.'
            }
          ],
          chartExercise: {
            id: 'exercise-2-3-1',
            symbol: 'BTCUSDT',
            timeframe: '15m',
            candleSliceStart: 30,
            setupBarIndex: 298,
            defaultIndicators: ['BB20_2', 'ATR14'],
            suggestedDirection: 'LONG',
            suggestedEntry: 78000,
            suggestedSL: 77400,
            suggestedTP1: 78600,
            suggestedTP2: 79200,
            suggestedTP3: 80100,
            explanation:
              'Volatility breakout long after Bollinger Band Squeeze, with stop sized at 1.5x ATR(14) ($600 stop distance): Entry at $78,000, SL at $77,400 (Risk R = $600). TP1 at $78,600 (+1.0R), TP2 at $79,200 (+2.0R), TP3 at $80,100 (+3.5R). Realized R is +1.975R.'
          },
          primarySources: [
            {
              title: 'Bollinger on Bollinger Bands',
              url: 'https://www.mhprofessional.com/',
              note: 'John Bollinger (McGraw-Hill, 2001) — complete mathematical and trading framework for standard deviation volatility bands and squeezes.'
            }
          ]
        },
        {
          id: 'lesson-2-3-2',
          trackId: 'technical-analysis',
          moduleId: 'module-2-3',
          title: 'Multi-Indicator Confluence Execution',
          slug: 'multi-indicator-confluence-execution',
          order: 2,
          isFree: false,
          readingTimeMinutes: 9,
          learningObjectives: [
            'Synthesize market structure, trend filters, momentum oscillators, and volatility into a multi-factor checklist.',
            'Explain how uncorrelated analytical inputs produce positive statistical expectancy without indicator redundancy.',
            'Execute a full master confluence trade on BTCUSDT with 3-target ACTS bracket scaling.'
          ],
          contentMarkdown: `### The Principle of Uncorrelated Confluence

No single indicator provides an edge in isolation. A moving average lags during chops; an oscillator gives false readings during trends; a candlestick pattern can fail in low volume.

**Edge emerges from Confluence**: when multiple independent, mathematically uncorrelated analytical dimensions align at the exact same price zone:

:::visual[confluence-stack]

---

### Avoiding Indicator Redundancy (Multicollinearity)

A frequent beginner trap is stacking five momentum oscillators on a chart (e.g., RSI, Stochastic, Williams %R, CCI, and Money Flow Index) and calling it "5 confluences."

In statistics, this is called **multicollinearity**. All five indicators calculate virtually the same underlying mathematical property (where the close is relative to the recent high-low range). If one is overbought, all five are overbought. You have added clutter, not confirmation.

#### The ACTS 4-Factor Balanced Stack:
1. **Structure Factor**: S/R horizontal zones and swing pivots (Price Action).
2. **Trend Factor**: 20/50/200 Exponential Moving Averages (Trend Direction).
3. **Momentum Factor**: 14-period RSI or MACD (Velocity & Divergence).
4. **Volatility Factor**: Bollinger Bands or ATR (Expansion & Stop Sizing).

When all four factors point in the same direction, you have an institutional setup with asymmetric risk/reward.`,
          quiz: [
            {
              id: 'q-2-3-2-1',
              question: 'Why is adding RSI, Stochastic, and Williams %R simultaneously to a chart considered poor confluence design?',
              options: [
                'It causes computer graphics cards to overheat',
                'All three are momentum oscillators measuring essentially the same mathematical price relationship (multicollinearity), creating redundant confirmation',
                'Exchanges reject orders when more than two indicators are active',
                'Stochastic and RSI are mathematically incompatible'
              ],
              correctIndex: 1,
              explanation:
                'Multicollinearity occurs when multiple indicators measure the exact same variable (momentum). True confluence requires combining uncorrelated factors like structure, trend, momentum, and volatility.'
            },
            {
              id: 'q-2-3-2-2',
              question: 'Under the ACTS True Bracket Math framework, how is trade risk managed once Target 1 (+1.0R) is achieved?',
              options: [
                'Position size is doubled to maximize gains',
                '40% of the position is exited, and the stop-loss on the remaining 60% is automatically moved to Breakeven (0.0R)',
                'The trade is completely closed',
                'The stop-loss is widened to allow more breathing room'
              ],
              correctIndex: 1,
              explanation:
                'Upon hitting TP1 (+1.0R), 40% of the position is locked in, and the stop on the remaining 60% moves to entry/breakeven, eliminating the risk of a profitable trade turning into a loss.'
            }
          ],
          chartExercise: {
            id: 'exercise-2-3-2',
            symbol: 'BTCUSDT',
            timeframe: '15m',
            candleSliceStart: 20,
            setupBarIndex: 290,
            defaultIndicators: ['EMA50', 'EMA200', 'RSI14', 'MACD', 'BB20_2'],
            suggestedDirection: 'LONG',
            suggestedEntry: 77600,
            suggestedSL: 77000,
            suggestedTP1: 78200,
            suggestedTP2: 78800,
            suggestedTP3: 79700,
            explanation:
              'Full multi-indicator confluence long: 4H S/R support, price above 200 EMA, 50 EMA dynamic test, RSI regular bullish divergence, and MACD zero-line test. Entry at $77,600, SL at $77,000 (Risk R = $600). TP1 at $78,200 (+1.0R, 40%), TP2 at $78,800 (+2.0R, 35%), TP3 at $79,700 (+3.5R, 25%). Realized weighted return is +1.975R.'
          },
          primarySources: [
            {
              title: 'Evidence-Based Technical Analysis: Applying the Scientific Method and Statistical Inference to Trading Signals',
              url: 'https://www.wiley.com/en-us/Evidence+Based+Technical+Analysis%3A+Applying+the+Scientific+Method+and+Statistical+Inference+to+Trading+Signals-p-9780470008744',
              note: 'David Aronson (John Wiley & Sons, 2006) — statistical evaluation of confluence systems, multicollinearity, and false discoveries.'
            }
          ]
        }
      ]
    }
  ]
}
