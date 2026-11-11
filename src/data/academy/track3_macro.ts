import { Track } from '@/types/academy'

export const track3Macro: Track = {
  id: 'macroeconomics',
  title: 'Macroeconomics & News Trading',
  tagline: 'Understanding sovereign liquidity, central banking, and macroeconomic catalysts',
  description:
    'Connect macroeconomic data releases (CPI, NFP, FOMC) and global liquidity flows directly to crypto asset volatility. Wired to authentic economic calendar events and official dot-gov data sources.',
  isFree: false,
  estimatedHours: 4,
  iconName: 'Globe',
  modules: [
    {
      id: 'module-3-1',
      trackId: 'macroeconomics',
      title: 'Inflation & Labor Markets',
      description: 'The primary drivers of central bank interest rate policy and fiat currency valuation.',
      order: 1,
      lessons: [
        {
          id: 'lesson-3-1-1',
          trackId: 'macroeconomics',
          moduleId: 'module-3-1',
          title: 'Inflation & Price Indexes: CPI & PPI Headline vs Core',
          slug: 'inflation-cpi-ppi-headline-vs-core',
          order: 1,
          isFree: false,
          readingTimeMinutes: 9,
          learningObjectives: [
            'Differentiate between Headline CPI, Core CPI, and Producer Price Index (PPI).',
            'Explain why the Federal Reserve focuses on Core inflation measures that strip volatile food and energy components.',
            'Analyze the transmission mechanism linking unexpected inflation prints to Treasury yields, DXY, and Bitcoin volatility.',
            'Inspect live scheduled macroeconomic releases directly from the platform economic calendar.'
          ],
          macroEvent: {
            eventId: 'cpi-release-2026-09-11',
            title: 'Core CPI Inflation Rate (m/m)',
            agency: 'U.S. Bureau of Labor Statistics (BLS)',
            releaseDate: '2026-09-11T08:30:00-04:00',
            forecast: '0.2%',
            previous: '0.2%',
            historicalBtcImpact:
              'High volatility event: Hotter-than-expected CPI typically triggers an immediate 1.5% to 3.5% downward knee-jerk in BTC as rate-cut expectations are priced out; cooler prints trigger risk-on expansions.'
          },
          contentMarkdown: `### The Primary Engine of Central Bank Policy

In modern fiat monetary architecture, central bank policy is anchored to price stability. The two primary gauges of consumer and wholesale price pressures in the United States are:

1. **Consumer Price Index (CPI)**: Published monthly by the **U.S. Bureau of Labor Statistics (BLS)**, measuring the average change over time in prices paid by urban consumers for a standardized market basket of consumer goods and services.
2. **Producer Price Index (PPI)**: Also published by the BLS, measuring the average change in selling prices received by domestic producers for their output. PPI reflects input costs and serves as a leading indicator for future CPI.

---

### Headline vs. Core Inflation: The Vital Distinction

The financial press frequently reports **Headline CPI**, which includes all items. However, central bank monetary policy committees prioritize **Core CPI**:

$$\\text{Core CPI} = \\text{Headline CPI} - \\text{Food Component} - \\text{Energy Component}$$

#### Why Strip Food and Energy?
Food and energy commodities are traded on global spot and derivatives markets subject to geopolitical embargoes, localized weather disruptions, and OPEC production quotas. These supply-side shocks are highly volatile and largely immune to domestic monetary policy:
- Raising the Federal Funds rate does not drill more crude oil or increase seasonal grain yields.
- Therefore, to assess persistent underlying structural demand pressures (wages, housing rents, healthcare, services), the Federal Reserve focuses on Core metrics.

---

### The Macro Transmission Mechanism to Bitcoin

Bitcoin is traded globally 24 hours a day with zero sovereign circuit breakers, making it the most sensitive high-beta liquidity barometer in world financial markets.

The transmission chain from a CPI release operates as follows:

:::visual[macro-cpi-transmission]

Conversely, when Core CPI prints below consensus, markets price in aggressive central bank rate cuts, sovereign yields drop, the dollar weakens, and capital flows into digital assets.`,
          quiz: [
            {
              id: 'q-3-1-1-1',
              question: 'Why does the Federal Reserve focus on Core CPI rather than Headline CPI when formulating interest rate policy?',
              options: [
                'Core CPI is published twice as frequently as Headline CPI',
                'Food and energy prices are highly volatile and driven by global supply shocks that interest rate changes cannot directly control',
                'Headline CPI excludes housing and medical care',
                'The Federal Reserve is legally prohibited from tracking oil prices'
              ],
              correctIndex: 1,
              explanation:
                'Food and energy components are subject to geopolitical and weather supply shocks. Core CPI strips these out to isolate persistent underlying demand-side inflation.'
            },
            {
              id: 'q-3-1-1-2',
              question: 'If Core CPI prints significantly hotter than consensus estimates, what is the typical immediate transmission to U.S. Treasury yields and Bitcoin?',
              options: [
                'Treasury yields collapse, causing Bitcoin to immediately break all-time highs',
                'Treasury yields surge as rate-cut expectations are priced out, driving the dollar up and creating downside volatility in Bitcoin',
                'The Federal Reserve immediately halts all electronic banking transfers',
                'Bitcoin decouples completely from the U.S. dollar'
              ],
              correctIndex: 1,
              explanation:
                'Higher-than-expected inflation forces expectations of tighter monetary policy, driving sovereign yields higher and creating a liquidity drag across risk assets including Bitcoin.'
            }
          ],
          primarySources: [
            {
              title: 'U.S. Bureau of Labor Statistics: Consumer Price Index Program',
              url: 'https://www.bls.gov/cpi/',
              note: 'Official methodology, current release tables, and historical basket weights from the U.S. Department of Labor.'
            },
            {
              title: 'FRED: Consumer Price Index for All Urban Consumers (CPIAUCSL)',
              url: 'https://fred.stlouisfed.org/series/CPIAUCSL',
              note: 'Federal Reserve Bank of St. Louis — official macroeconomic time series.'
            },
            {
              title: 'U.S. Bureau of Economic Analysis: Personal Consumption Expenditures (PCE)',
              url: 'https://www.bea.gov/data/personal-consumption-expenditures-price-index',
              note: 'Official primary source for the Fed’s preferred inflation metric.'
            }
          ]
        },
        {
          id: 'lesson-3-1-2',
          trackId: 'macroeconomics',
          moduleId: 'module-3-1',
          title: 'Labor Markets & Employment Velocity: NFP, Claims & The Dual Mandate',
          slug: 'labor-markets-nfp-and-jobless-claims',
          order: 2,
          isFree: false,
          readingTimeMinutes: 8,
          learningObjectives: [
            'Analyze the Federal Reserve’s Dual Mandate under the Federal Reserve Reform Act of 1977.',
            'Deconstruct the monthly Nonfarm Payrolls (NFP) report, wage growth, and labor force participation.',
            'Interpret weekly Initial Jobless Claims as a high-frequency economic health indicator.',
            'Explain the "Good News is Bad News" market dynamic during inflationary regimes.'
          ],
          macroEvent: {
            eventId: 'claims-release-2026-09-10',
            title: 'Unemployment Claims',
            agency: 'U.S. Department of Labor (DOL)',
            releaseDate: '2026-09-10T08:30:00-04:00',
            forecast: '205K',
            previous: '206K',
            historicalBtcImpact:
              'Moderate volatility event: Initial claims above 230K signal labor softening, supporting rate cut expectations; prints under 200K signal tight labor and tighter monetary policy.'
          },
          contentMarkdown: `### The Fed's Dual Mandate: The Policy Balancing Act

By statutory law (the Federal Reserve Reform Act of 1977), the Federal Reserve operates under a **Dual Mandate**:
1. **Maximum Sustainable Employment**
2. **Stable Prices (defined as 2.0% annual inflation)**

When inflation is high, the Federal Reserve raises interest rates to cool aggregate economic demand. However, aggressive tightening increases borrowing costs for corporations, leading to hiring freezes and layoffs. If unemployment surges, the Fed is forced to halt tightening or begin cutting rates to fulfill the employment half of its mandate.

---

### Nonfarm Payrolls (NFP) and The Employment Situation

Released on the first Friday of every month by the BLS, the **Employment Situation** report consists of two independent surveys:

1. **The Establishment Survey (CES)**: Yields **Nonfarm Payrolls (NFP)**, measuring the net change in payroll jobs across non-agricultural businesses and government agencies. It also reports **Average Hourly Earnings** (measuring wage growth, a critical driver of sticky services inflation).
2. **The Household Survey (CPS)**: Yields the headline **Unemployment Rate (U-3)** and the **Labor Force Participation Rate**.

---

### High-Frequency Telemetry: Weekly Jobless Claims

While NFP is a monthly retrospective indicator, **Initial Jobless Claims** (published every Thursday at 08:30 EDT by the Department of Labor) provides real-time, weekly data on newly filed unemployment insurance claims across all 50 states:
- **Baseline Healthy Range**: Historically 200,000 to 225,000 claims per week indicates a robust labor market.
- **Deterioration Signal**: A sustained rise above 250,000 to 300,000 signals broadening corporate layoffs and impending macroeconomic recession.

---

### The "Good News is Bad News" Paradigm

During monetary tightening cycles, financial markets often exhibit an unintuitive reaction known as **"Good News is Bad News"**:
- When NFP prints much stronger than expected (e.g., +300k jobs vs +175k forecast) and wages surge, the economy looks fundamentally healthy.
- **However**, financial markets drop! Why? Because a booming labor market gives the Federal Reserve license to keep interest rates elevated for longer without fearing immediate recession.
- Conversely, a modest cooling in labor data allows the Fed to pivot toward monetary easing, releasing liquidity into digital assets.`,
          quiz: [
            {
              id: 'q-3-1-2-1',
              question: 'What are the two statutory components of the Federal Reserve’s Dual Mandate?',
              options: [
                'Maximum stock market prices and zero government debt',
                'Maximum sustainable employment and stable prices (2% inflation target)',
                'Fixed currency exchange rates and gold reserves',
                'Regulating cryptocurrency exchanges and maintaining trade surpluses'
              ],
              correctIndex: 1,
              explanation:
                'Under the 1977 Reform Act, the Federal Reserve is mandated to pursue maximum sustainable employment and price stability.'
            },
            {
              id: 'q-3-1-2-2',
              question: 'Why does an exceptionally strong employment report sometimes trigger a sell-off in Bitcoin during inflation cycles ("Good News is Bad News")?',
              options: [
                'Employed workers sell Bitcoin to pay payroll taxes',
                'Strong labor conditions give central banks room to maintain higher interest rates for longer, draining liquidity from speculative assets',
                'The Department of Labor confiscates digital tokens',
                'Exchanges lower withdrawal limits on Fridays'
              ],
              correctIndex: 1,
              explanation:
                'Robust employment removes pressure on the central bank to ease monetary policy, prolonging restrictive monetary conditions and suppressing speculative liquidity.'
            }
          ],
          primarySources: [
            {
              title: 'U.S. Bureau of Labor Statistics: Current Employment Statistics (CES)',
              url: 'https://www.bls.gov/ces/',
              note: 'Official primary data source for Nonfarm Payrolls and Average Hourly Earnings.'
            },
            {
              title: 'U.S. Department of Labor: Unemployment Insurance Weekly Claims Report',
              url: 'https://www.dol.gov/ui/data.pdf',
              note: 'Official weekly release of initial and continuing unemployment insurance filings.'
            },
            {
              title: 'FRED: Total Nonfarm Payrolls (PAYEMS)',
              url: 'https://fred.stlouisfed.org/series/PAYEMS',
              note: 'Federal Reserve Bank of St. Louis nonfarm payroll time series.'
            }
          ]
        }
      ]
    },
    {
      id: 'module-3-2',
      trackId: 'macroeconomics',
      title: 'Central Banking & Sovereign Rates',
      description: 'FOMC rate decisions, balance sheet mechanics, and sovereign yield curve dynamics.',
      order: 2,
      lessons: [
        {
          id: 'lesson-3-2-1',
          trackId: 'macroeconomics',
          moduleId: 'module-3-2',
          title: 'FOMC Rate Decisions, The Dot Plot & Balance Sheet Policy (QE/QT)',
          slug: 'fomc-rate-decisions-and-balance-sheet-policy',
          order: 1,
          isFree: false,
          readingTimeMinutes: 9,
          learningObjectives: [
            'Analyze the structure and schedule of the Federal Open Market Committee (FOMC).',
            'Decode the Summary of Economic Projections (SEP) "Dot Plot" to track terminal rate forecasts.',
            'Differentiate between interest rate changes and balance sheet Quantitative Tightening (QT) / Easing (QE).',
            'Connect directly to the scheduled FOMC Rate Decision in the ACTS platform calendar.'
          ],
          macroEvent: {
            eventId: 'fomc-decision-2026-09-16',
            title: 'FOMC Federal Funds Rate Decision & Policy Statement',
            agency: 'Federal Reserve Board of Governors',
            releaseDate: '2026-09-16T14:00:00-04:00',
            forecast: '25bps Cut',
            previous: '5.25% - 5.50%',
            historicalBtcImpact:
              'Massive volatility event: The 14:00 EDT rate statement and 14:30 press conference routinely generate 3% to 6% intra-hour price swings in BTC; spreads widen dramatically across all major derivative exchanges.'
          },
          contentMarkdown: `### The Federal Open Market Committee (FOMC)

The **Federal Open Market Committee (FOMC)** is the 12-member monetary policy arm of the Federal Reserve System. Meeting eight times per year, the FOMC sets the target range for the **Federal Funds Rate**—the interest rate at which commercial depository institutions lend reserve balances to other depository institutions overnight.

Because the U.S. Dollar serves as the global reserve currency, the Federal Funds rate sets the foundational baseline cost of capital for all sovereign bonds, corporate credit, real estate mortgages, and digital assets worldwide.

---

### The Mechanics of Central Bank Tools

The Federal Reserve exercises monetary authority through two complementary mechanisms:

:::visual[macro-fomc-tools]

---

### The Dot Plot (Summary of Economic Projections)

Four times per year (March, June, September, and December), the FOMC releases the **Summary of Economic Projections (SEP)**, featuring the famous **Dot Plot**.

Each anonymous dot on the chart represents one FOMC participant's judgment of the appropriate midpoint of the target range for the federal funds rate at the end of each calendar year and in the longer run:
- If the median dot for the following year shifts upward (e.g., from 4.25% to 4.75%), it signals that policymakers anticipate higher structural inflation, requiring higher terminal rates.
- Markets immediately reprice rate expectations, leading to rapid adjustments across foreign exchange and digital assets.

---

### Execution Discipline During FOMC Days

The FOMC announcement sequence unfolds in two volatile phases:
1. **14:00 EDT**: The official policy statement and rate decision are published. Algorithms trade headline text in microseconds, triggering aggressive stop runs.
2. **14:30 EDT**: The Fed Chair begins the live Press Conference. Markets often completely reverse direction multiple times as the Chair qualifies whether the policy stance is hawkish or dovish.

**Rule**: Professional traders never gamble into the 14:00 release. Wait for the press conference to conclude, allow the daily candle to close, and execute based on established post-event structure.`,
          quiz: [
            {
              id: 'q-3-1-2-2',
              question: 'What is the purpose of the Federal Reserve’s "Dot Plot" published in the Summary of Economic Projections?',
              options: [
                'It displays where the Fed Chair personally invests their private capital',
                'It graphs each individual FOMC participant’s projection for the appropriate federal funds rate level over future calendar years',
                'It tracks the geographic location of commercial bank branches',
                'It measures daily trading volume on the New York Stock Exchange'
              ],
              correctIndex: 1,
              explanation:
                'The Dot Plot maps each FOMC member’s anonymous expectation of future interest rates, allowing the market to gauge consensus on the future path of monetary policy.'
            },
            {
              id: 'q-3-2-1-2',
              question: 'How does Quantitative Tightening (QT) differ from raising the Federal Funds interest rate?',
              options: [
                'QT involves physically printing paper bank notes',
                'QT reduces the total quantity of central bank liquidity reserves by allowing bonds on the Fed balance sheet to mature without reinvestment, whereas interest rate hikes raise the price/cost of money',
                'QT is strictly controlled by the U.S. Congress, not the Fed',
                'QT only affects foreign sovereign debt'
              ],
              correctIndex: 1,
              explanation:
                'Rate hikes change the price of borrowing, while QT contracts the actual volume of central bank liquidity and base money reserves circulating in the banking system.'
            }
          ],
          primarySources: [
            {
              title: 'Federal Reserve Board: FOMC Meeting Calendars and Information',
              url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
              note: 'Official primary statements, minutes, and Summary of Economic Projections (Dot Plots).'
            },
            {
              title: 'FRED: Federal Funds Effective Rate (FEDFUNDS)',
              url: 'https://fred.stlouisfed.org/series/FEDFUNDS',
              note: 'Federal Reserve Bank of St. Louis benchmark interest rate series.'
            },
            {
              title: 'FRED: Total Assets of the Federal Reserve (WALCL)',
              url: 'https://fred.stlouisfed.org/series/WALCL',
              note: 'Weekly Federal Reserve balance sheet size tracking QE and QT.'
            }
          ]
        },
        {
          id: 'lesson-3-2-2',
          trackId: 'macroeconomics',
          moduleId: 'module-3-2',
          title: 'Treasury Yield Curve Inversion & Real Yields',
          slug: 'treasury-yield-curve-and-real-yields',
          order: 2,
          isFree: false,
          readingTimeMinutes: 8,
          learningObjectives: [
            'Interpret the U.S. Treasury Par Yield Curve from 3-month bills to 30-year bonds.',
            'Explain why a 2Y-10Y yield curve inversion has historically served as a reliable leading indicator of economic recession.',
            'Calculate Real Yields ($10Y \\text{ Nominal} - \\text{Inflation Breakeven}$) and evaluate their direct impact on non-yielding stores of value like Bitcoin.',
            'Access primary sovereign rate data from the U.S. Department of the Treasury.'
          ],
          contentMarkdown: `### The Sovereign Yield Curve: The Benchmark of Global Capital

The **U.S. Treasury Yield Curve** plots the interest rates paid on U.S. government sovereign debt obligations across differing maturities, ranging from 1-month Treasury Bills to 30-year Treasury Bonds.

Under normal economic conditions, the yield curve slopes upward: investors demand a higher annualized yield (term premium) to lock up their money for 10 or 30 years due to the risk of future inflation and economic uncertainty.

---

### The Yield Curve Inversion: The Recession Indicator

An **inverted yield curve** occurs when short-term yields (such as the 2-Year Treasury Note) trade higher than long-term yields (such as the 10-Year Treasury Bond):

$$\\text{Yield Spread} = \\text{10Y Yield} - \\text{2Y Yield} < 0$$

:::visual[macro-yield-curve]

#### Why Inversion Predicts Economic Downturns:
1. Short-term yields reflect the immediate, restrictive stance of the central bank.
2. Long-term yields reflect the bond market's expectations of future economic growth and inflation.
3. When the 10-year yield falls below the 2-year yield, the global bond market is shouting that the central bank’s current policy is so restrictive that it will break economic demand, forcing aggressive future rate cuts and precipitating a recession.
4. Historically, every U.S. recession over the past 60 years was preceded by an inversion of the 2Y-10Y spread.

---

### Real Yields: The Opportunity Cost of Bitcoin

Nominal interest rates tell only half the story. Global macro funds allocate capital based on **Real Yields**—the nominal yield earned after deducting expected inflation:

$$\\text{Real Yield} = \\text{Nominal Treasury Yield} - \\text{Breakeven Inflation Rate}$$

Real yields are directly observed in **Treasury Inflation-Protected Securities (TIPS)**:
- **Negative or Falling Real Yields**: Holding sovereign bonds locks in a loss of purchasing power in real terms. Capital flees fiat debt and floods into scarce, non-yielding stores of value (Gold and Bitcoin).
- **Positive and Rising Real Yields**: Investors can earn solid 2.0% or 2.5% real purchasing power in U.S. Treasuries. The opportunity cost of holding speculative or volatile assets rises, exerting gravitational downward drag on crypto valuations.`,
          quiz: [
            {
              id: 'q-3-2-2-1',
              question: 'What occurs when the 2-Year Treasury yield is higher than the 10-Year Treasury yield?',
              options: [
                'The yield curve is inverted, signaling that the bond market expects monetary policy to trigger economic slowdown and future rate cuts',
                'The U.S. government is legally bankrupt',
                'The stock market will rise 20% with certainty',
                'Commercial banks cease offering credit cards'
              ],
              correctIndex: 0,
              explanation:
                'A 2Y-10Y yield inversion reflects restrictive short-term policy and expectations of future economic deceleration, serving as a historically proven recession warning.'
            },
            {
              id: 'q-3-2-2-2',
              question: 'How do rising positive Real Yields (observed via 10-Year TIPS) typically impact non-yielding assets like Bitcoin and Gold?',
              options: [
                'They spark an immediate rally in Bitcoin',
                'They increase the opportunity cost of holding non-yielding assets, often exerting downward valuation pressure as sovereign benchmark returns become more attractive',
                'They eliminate all price volatility in commodities',
                'They force central banks to buy cryptocurrency'
              ],
              correctIndex: 1,
              explanation:
                'When real purchasing-power returns on sovereign government debt turn positive and high, capital is drawn toward sovereign paper, increasing the opportunity cost of non-yielding assets.'
            }
          ],
          primarySources: [
            {
              title: 'U.S. Department of the Treasury: Daily Treasury Par Yield Curve Rates',
              url: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/',
              note: 'Official daily sovereign interest rate yield curve tables from the U.S. Treasury.'
            },
            {
              title: 'FRED: 10-Year Treasury Constant Maturity Minus 2-Year Treasury (T10Y2Y)',
              url: 'https://fred.stlouisfed.org/series/T10Y2Y',
              note: 'Federal Reserve Bank of St. Louis official yield curve inversion spread series.'
            },
            {
              title: 'FRED: 10-Year Real Yield / TIPS (DFII10)',
              url: 'https://fred.stlouisfed.org/series/DFII10',
              note: 'Official time series for 10-Year Treasury Inflation-Indexed Securities.'
            }
          ]
        }
      ]
    },
    {
      id: 'module-3-3',
      trackId: 'macroeconomics',
      title: 'Global Liquidity & Macro Execution',
      description: 'The U.S. Dollar Index (DXY), global M2 expansion, and executing around macroeconomic news releases.',
      order: 3,
      lessons: [
        {
          id: 'lesson-3-3-1',
          trackId: 'macroeconomics',
          moduleId: 'module-3-3',
          title: 'The U.S. Dollar Index (DXY) & Global M2 Liquidity Impact on BTC',
          slug: 'dxy-and-global-m2-liquidity',
          order: 1,
          isFree: false,
          readingTimeMinutes: 9,
          learningObjectives: [
            'Analyze the currency composition and weighting of the Intercontinental Exchange (ICE) U.S. Dollar Index (DXY).',
            'Explain the strong historical inverse correlation between DXY bull cycles and Bitcoin price performance.',
            'Map the expansion of Global M2 money supply across major central banks as a leading indicator for digital assets.',
            'Cite primary exchange futures specifications and central bank money stock datasets.'
          ],
          contentMarkdown: `### The Imperial Currency Gauge: The U.S. Dollar Index (DXY)

The **U.S. Dollar Index (DXY)** measures the value of the United States dollar relative to a geometric trade-weighted basket of six major foreign currencies:

:::visual[macro-dxy-basket]

Because the Euro carries a 57.6% weighting, the DXY is substantially an inverse reflection of the EUR/USD exchange rate.

---

### The Inverse Relationship: Dollar Strength vs. Bitcoin

Bitcoin is priced globally in U.S. Dollars (BTC/USD or BTC/USDT). Therefore, the exchange rate is an explicit ratio:

$$\\text{Price of BTC} = \\frac{\\text{Value of Bitcoin}}{\\text{Value of U.S. Dollar}}$$

- **When DXY Rallies Aggressively (Dollar Shortage)**: Non-U.S. corporations and sovereign nations face higher costs to service dollar-denominated debt. Offshore dollar liquidity contracts. Investors liquidate risk assets to hoard cash. In this regime, Bitcoin faces severe macro headwinds.
- **When DXY Breaks Down (Dollar Devaluation)**: Plentiful dollar supply and aggressive debasement push capital into hard assets. Every major secular Bitcoin bull run (2013, 2017, 2020–2021) coincided with multi-quarter downtrends in the DXY.

---

### Global M2 Money Supply: The Master Liquidity Tide

Macro quantitative researchers have demonstrated that Bitcoin does not behave like a tech stock; it behaves as a pure **monetary liquidity sponge**.

$$\\text{Global M2} = \\text{M2 Federal Reserve} + \\text{M2 ECB} + \\text{M2 Bank of Japan} + \\text{M2 PBOC} + \\dots$$

When major central banks expand their balance sheets and commercial bank credit expands, Global M2 expands. Because Bitcoin has an immutable, mathematically capped supply of 21 million coins, any expansion in the global supply of fiat currency units naturally causes the price of Bitcoin in those fiat units to appreciate over multi-year cycles.`,
          quiz: [
            {
              id: 'q-3-3-1-1',
              question: 'Which foreign currency holds the largest mathematical weighting in the U.S. Dollar Index (DXY)?',
              options: ['Japanese Yen (JPY)', 'British Pound (GBP)', 'Euro (EUR) at 57.6%', 'Chinese Yuan (CNY)'],
              correctIndex: 2,
              explanation:
                'The Euro comprises 57.6% of the DXY basket, making the index predominantly an inverse reflection of European monetary conditions.'
            },
            {
              id: 'q-3-3-1-2',
              question: 'What is the primary macro rationale explaining why Bitcoin historically exhibits strong bull runs when Global M2 money supply expands?',
              options: [
                'Bitcoin mining computers consume M2 currency notes',
                'Bitcoin has a strictly capped supply of 21 million units; as the global quantity of fiat currency units multiplies, more fiat units bid for the fixed supply of coins',
                'Central banks are legally required to buy Bitcoin whenever M2 increases',
                'Exchanges reduce taker fees during M2 expansions'
              ],
              correctIndex: 1,
              explanation:
                'With a mathematically fixed hard cap of 21 million coins, expanding global fiat liquidity increases the nominal purchasing power chasing scarce monetary units.'
            }
          ],
          primarySources: [
            {
              title: 'Intercontinental Exchange (ICE): U.S. Dollar Index Futures Contract Specifications',
              url: 'https://www.theice.com/products/194/US-Dollar-Index-Futures',
              note: 'Official index methodology, contract specs, and trade-weighted currency allocations.'
            },
            {
              title: 'FRED: M2 Money Stock (M2SL)',
              url: 'https://fred.stlouisfed.org/series/M2SL',
              note: 'Federal Reserve Bank of St. Louis official U.S. M2 monetary aggregate data.'
            }
          ]
        },
        {
          id: 'lesson-3-3-2',
          trackId: 'macroeconomics',
          moduleId: 'module-3-3',
          title: 'Reading Macro Releases: Actual vs Forecast vs Previous',
          slug: 'reading-macro-releases-actual-vs-forecast',
          order: 2,
          isFree: false,
          readingTimeMinutes: 8,
          learningObjectives: [
            'Deconstruct the three numbers of an economic release: Actual, Forecast (Consensus), and Previous.',
            'Explain why financial markets reprice relative to consensus expectations rather than absolute levels.',
            'Analyze order book thinning and spread expansion during the first 60 seconds of a news catalyst.',
            'Execute disciplined trade planning protocols around high-impact economic releases.'
          ],
          contentMarkdown: `### The Consensus Dynamic: Expectations Dictate Price

Novice traders often express bewilderment when an economic release appears "bad" yet the market rallies. They ask: *"Why did the market go up when GDP came in low?"*

The fundamental rule of modern financial markets is:

$$\\text{Market Price Movement} \\propto \\text{Actual Value} - \\text{Forecast (Consensus Expectation)}$$

Markets are forward-looking discounting engines. By the time an economic figure is officially published:
- The **Previous** number is already fully digested and priced in.
- The **Forecast (Consensus)** is an average estimate compiled from Wall Street economists and institutional desks. The market has already positioned itself for this consensus figure in advance.
- Therefore, the only thing that moves prices when the release drops is the **Delta ($\Delta$) between the Actual print and the Forecast**.

:::visual[macro-surprise-delta]

---

### Order Book Mechanics During High-Impact Releases

During the 30 to 60 seconds surrounding a major release (such as CPI at 08:30 EDT or FOMC at 14:00 EDT):
1. **Market Makers Stand Down**: Institutional algorithmic market makers cancel their resting limit orders across the order book to avoid being front-run by news sentiment parsing algos.
2. **Spread Widening**: The bid-ask spread on BTCUSDT can widen from $0.50 to $50.00 or more in milliseconds.
3. **Liquidation Sweeps**: The lack of resting liquidity allows small market orders to sweep multiple price levels, triggering stop losses on both sides of the market before any sustainable trend develops.

---

### The Three Cardinal Execution Rules for News Trading

1. **Never Place Market Orders During the Release**: Submitting an aggressive market order in the first 60 seconds results in execution at the worst possible adverse slippage.
2. **Let the Initial Knee-Jerk Fade**: The first 1-minute candle is driven by high-frequency latency arbitrage algorithms and stop sweeps.
3. **Trade the Closing 15-Minute / 1-Hour Structure**: Wait for initial volatility to settle and spreads to normalize. Trade the breakout or retest of established technical structure once institutional order book depth refills.`,
          quiz: [
            {
              id: 'q-3-3-2-1',
              question: 'Why do financial markets react to the difference between the Actual release and the Consensus Forecast, rather than the absolute number alone?',
              options: [
                'The Forecast number is legally binding on exchange pricing',
                'Markets are forward-looking discounting mechanisms that already priced in the expected consensus before the release occurred',
                'Government agencies penalize traders who ignore forecasts',
                'Consensus forecasts are calculated by artificial intelligence'
              ],
              correctIndex: 1,
              explanation:
                'Because market participants position their capital ahead of time based on consensus estimates, only the unexpected delta between actual data and expectations drives repricing.'
            },
            {
              id: 'q-3-3-2-2',
              question: 'What occurs to the exchange order book during the first 30 seconds of an unexpected high-impact CPI release?',
              options: [
                'All trading commissions are refunded by the exchange',
                'Market makers withdraw resting limit orders, causing the bid-ask spread to widen substantially and increasing slippage risk',
                'The order book depth increases by 10x',
                'Stop-loss orders are automatically cancelled by regulators'
              ],
              correctIndex: 1,
              explanation:
                'To avoid adverse selection by news-reading algorithms, liquidity providers pull resting limit orders, leaving a thin book with wide spreads and high slippage.'
            }
          ],
          primarySources: [
            {
              title: 'Macroeconomic News and Asset Prices: An Intraday Analysis',
              url: 'https://www.jstor.org/stable/2697855',
              note: 'Journal of Finance — empirical study of order book dynamics and spread widening around macroeconomic announcements.'
            },
            {
              title: 'CME Group: How to Trade Economic Releases',
              url: 'https://www.cmegroup.com/education/articles-and-reports.html',
              note: 'Institutional guide on liquidity contraction and price discovery around U.S. macroeconomic releases.'
            }
          ]
        }
      ]
    }
  ]
}
