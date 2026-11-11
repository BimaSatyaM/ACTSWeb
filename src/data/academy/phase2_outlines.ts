import { Track } from '@/types/academy'

export const phase2Outlines: Track[] = [
  {
    id: 'advanced-order-mechanics',
    title: 'Advanced Order Mechanics & Microstructure',
    tagline: 'Institutional execution algorithms, hidden liquidity, and spoofing defense',
    description:
      'Explore algorithmic order routing, Iceberg orders, Time-Weighted Average Price (TWAP), Volume-Weighted Average Price (VWAP), exchange matching engine latency, and detecting predatory spoofing behavior.',
    isFree: false,
    estimatedHours: 4,
    iconName: 'Cpu',
    isComingSoon: true,
    badge: 'Phase 2 Coming Soon',
    modules: [
      {
        id: 'module-5-1',
        trackId: 'advanced-order-mechanics',
        title: 'Algorithmic Execution & Order Slicing',
        description: 'How institutional execution desks break multi-million dollar orders into subtle market slices.',
        order: 1,
        lessons: [
          {
            id: 'lesson-5-1-1',
            trackId: 'advanced-order-mechanics',
            moduleId: 'module-5-1',
            title: 'Iceberg Orders, Display Sizes & Hidden Liquidity',
            slug: 'iceberg-orders-and-hidden-liquidity',
            order: 1,
            isFree: false,
            readingTimeMinutes: 7,
            learningObjectives: [
              'Deconstruct the native exchange architecture of synthetic and native Iceberg limit orders.',
              'Detect institutional iceberg accumulation via delta volume and execution prints on Level 2 books.',
              'Analyze the impact of hidden liquidity on traditional chart support and resistance.'
            ],
            contentMarkdown: `### Preview: Iceberg Order Execution

Large market institutions rarely submit multi-hundred Bitcoin orders as plain limit orders; doing so would immediately signal intent and invite front-running by high-frequency algorithms.

Instead, institutional desks deploy **Iceberg Orders**:
- An iceberg order displays only a small fractional tip (the "display quantity", e.g., 2.0 BTC) on the public Level 2 order book.
- As aggressive market orders consume the 2.0 BTC display size, the exchange matching engine instantly and atomically reloads another 2.0 BTC from the hidden parent order (e.g., 100 BTC total).
- This creates persistent price absorption at a specific tick, forming an invisible liquidity wall.

*Full interactive simulation and footprint chart analysis coming in Phase 2.*`,
            primarySources: [
              {
                title: 'Market Microstructure Theory',
                url: 'https://www.wiley.com/en-us/Market+Microstructure+Theory-p-9781557864437',
                note: 'Maureen O’Hara (Blackwell Publishing, 1995).'
              }
            ]
          },
          {
            id: 'lesson-5-1-2',
            trackId: 'advanced-order-mechanics',
            moduleId: 'module-5-1',
            title: 'TWAP, VWAP & Anti-Spoofing Protocols',
            slug: 'twap-vwap-and-anti-spoofing',
            order: 2,
            isFree: false,
            readingTimeMinutes: 7,
            learningObjectives: [
              'Understand mathematical formulations of TWAP and VWAP benchmark algorithms.',
              'Identify manipulative spoofing and layering tactics on Level 3 order books.',
              'Implement execution defense protocols to prevent adverse selection by toxic flow.'
            ],
            contentMarkdown: `### Preview: Benchmark Execution & Spoofing Defense

This upcoming lesson covers the mathematical benchmarks used by institutional execution desks (TWAP and VWAP) to minimize market impact, and details how high-frequency spoofers submit and cancel large phantom orders to manipulate retail sentiment.

*Comprehensive case studies and regulatory enforcement documentation coming in Phase 2.*`,
            primarySources: [
              {
                title: 'Algorithmic Trading and DMA: An Introduction to Direct Access Trading Strategies',
                url: 'https://www.4myeloma.org/',
                note: 'Barry Johnson (4Myeloma Press, 2010).'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'trading-psychology',
    title: 'Trading Psychology & Behavioral Biases',
    tagline: 'Neurobiology of risk, cognitive bias mitigation, and emotional composure under uncertainty',
    description:
      'Examine Kahneman and Tversky’s Prospect Theory, dopamine feedback loops in rapid market environments, systematic protocols to neutralize FOMO and revenge trading, and building institutional discipline.',
    isFree: false,
    estimatedHours: 4,
    iconName: 'Brain',
    isComingSoon: true,
    badge: 'Phase 2 Coming Soon',
    modules: [
      {
        id: 'module-6-1',
        trackId: 'trading-psychology',
        title: 'Cognitive Biases & Prospect Theory in Financial Markets',
        description: 'How evolutionary human psychology naturally predisposes traders to mathematical capital loss.',
        order: 1,
        lessons: [
          {
            id: 'lesson-6-1-1',
            trackId: 'trading-psychology',
            moduleId: 'module-6-1',
            title: 'Prospect Theory: Loss Aversion & Asymmetric Pain',
            slug: 'prospect-theory-and-loss-aversion',
            order: 1,
            isFree: false,
            readingTimeMinutes: 8,
            learningObjectives: [
              'Analyze Daniel Kahneman and Amos Tversky’s Nobel Prize-winning Prospect Theory.',
              'Explain why the psychological pain of a $1,000 loss is twice as intense as the joy of a $1,000 gain.',
              'Overcome the disposition effect: cutting winners too early while holding losers too long.'
            ],
            contentMarkdown: `### Preview: Behavioral Finance & Loss Aversion

In 1979, psychologists Daniel Kahneman and Amos Tversky published **Prospect Theory**, mathematically demonstrating that human beings do not evaluate financial outcomes rationally.

Human beings experience **Loss Aversion**: the psychological pain of losing $1,000 is approximately 2 to 2.5 times more acute than the pleasure of winning $1,000. 

This innate evolutionary wiring leads to the disastrous **Disposition Effect**:
- Traders cut profitable trades prematurely to lock in dopamine and eliminate uncertainty.
- Traders hold losing trades as they drop through stops, hoping and praying for breakeven to avoid the psychological agony of acknowledging a realized loss.

*Full behavioral diagnostic tools and cognitive intervention frameworks coming in Phase 2.*`,
            primarySources: [
              {
                title: 'Prospect Theory: An Analysis of Decision under Risk',
                url: 'https://www.jstor.org/stable/1914185',
                note: 'Daniel Kahneman and Amos Tversky (Econometrica, 1979).'
              }
            ]
          },
          {
            id: 'lesson-6-1-2',
            trackId: 'trading-psychology',
            moduleId: 'module-6-1',
            title: 'Dopamine, Tilt & The Revenge Trading Circuit Breaker',
            slug: 'dopamine-tilt-and-circuit-breakers',
            order: 2,
            isFree: false,
            readingTimeMinutes: 7,
            learningObjectives: [
              'Understand neurochemical dopamine spikes triggered by financial risk and market volatility.',
              'Identify the physiological markers of "tilt" and emotional hijacking.',
              'Implement algorithmic daily loss locks and enforced cooling-off periods.'
            ],
            contentMarkdown: `### Preview: Neutralizing Emotional Tilt

When a trader incurs unexpected losses, the amygdala triggers a stress response, impairing the prefrontal cortex. This state—known as **tilt**—manifests in doubling position sizes to "make back" lost funds (revenge trading).

Phase 2 will outline strict operational circuit breakers: hardware key locks, mandatory 24-hour timeout rules after two consecutive stop-outs, and objective psychological auditing routines.`,
            primarySources: [
              {
                title: 'Thinking, Fast and Slow',
                url: 'https://us.macmillan.com/books/9780374533557/thinkingfastandslow',
                note: 'Daniel Kahneman (Farrar, Straus and Giroux, 2011).'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'crypto-derivatives',
    title: 'Crypto Derivatives & On-Chain Mechanics',
    tagline: 'Perpetual swap mechanics, funding rate dynamics, and blockchain whale telemetry',
    description:
      'Master the engineering behind perpetual futures contracts, 8-hour funding rate arbitrage, open interest interpretation, liquidation cascades, and interpreting on-chain whale UTXO telemetry.',
    isFree: false,
    estimatedHours: 5,
    iconName: 'Coins',
    isComingSoon: true,
    badge: 'Phase 2 Coming Soon',
    modules: [
      {
        id: 'module-7-1',
        trackId: 'crypto-derivatives',
        title: 'Perpetual Swaps & Funding Rate Physics',
        description: 'How non-expiring derivative contracts track underlying spot prices through continuous funding payments.',
        order: 1,
        lessons: [
          {
            id: 'lesson-7-1-1',
            trackId: 'crypto-derivatives',
            moduleId: 'module-7-1',
            title: 'Perpetual Futures Architecture & 8-Hour Funding Rates',
            slug: 'perpetual-futures-and-funding-rates',
            order: 1,
            isFree: false,
            readingTimeMinutes: 8,
            learningObjectives: [
              'Understand the invention of the Perpetual Swap by Arthur Hayes and BitMEX in 2016.',
              'Calculate the continuous funding rate formula balancing perpetual prices against the spot index.',
              'Interpret extreme funding rates as sentiment extremes and counter-trend warning signals.'
            ],
            contentMarkdown: `### Preview: Perpetual Futures & Funding Anchoring

Unlike traditional commodities futures that expire quarterly, crypto perpetual contracts never expire. To anchor the perpetual mark price to the underlying spot index, exchanges enforce an **8-Hour Funding Mechanism**:
- When the perpetual trades at a premium to spot, longs pay shorts.
- When the perpetual trades at a discount to spot, shorts pay longs.

Extreme funding spikes (>0.05% per 8 hours) indicate over-leveraged retail positioning, historically preceding sharp deleveraging cascades.

*Full mathematical models and funding rate arbitrage case studies coming in Phase 2.*`,
            primarySources: [
              {
                title: 'BitMEX Perpetual Contracts Guide',
                url: 'https://www.bitmex.com/app/perpetualContractsGuide',
                note: 'Original technical specification of the perpetual contract mechanism.'
              }
            ]
          },
          {
            id: 'lesson-7-1-2',
            trackId: 'crypto-derivatives',
            moduleId: 'module-7-1',
            title: 'Open Interest, Liquidation Cascades & On-Chain Flows',
            slug: 'open-interest-and-liquidation-cascades',
            order: 2,
            isFree: false,
            readingTimeMinutes: 8,
            learningObjectives: [
              'Track aggregate Open Interest (OI) to gauge fresh capital influx versus short covering.',
              'Analyze the physics of liquidation cascades and exchange insurance fund mechanics.',
              'Interpret on-chain exchange net inflows/outflows and miner wallet telemetry.'
            ],
            contentMarkdown: `### Preview: Liquidation Cascade Dynamics

When market leverage concentrates at specific price clusters, breaching those levels triggers automated liquidation market orders. These market orders consume resting liquidity, pushing prices into the next tier of liquidations in a self-reinforcing chain reaction.

Phase 2 teaches how to map liquidation heatmaps and audit on-chain whale telemetry to avoid entering directly into cascading volatility pockets.`,
            primarySources: [
              {
                title: 'The Economics of Cryptocurrencies: Price Formation and On-Chain Telemetry',
                url: 'https://papers.ssrn.com/',
                note: 'SSRN Working Paper Series in Quantitative Finance.'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'systematic-testing',
    title: 'Systematic Testing, Expectancy & Journaling',
    tagline: 'Scientific edge validation, Monte Carlo simulations, and rigorous performance accounting',
    description:
      'Learn the mathematical formula for Expectancy, how to construct an institutional trade journal, calculating Maximum Adverse Excursion (MAE), and running Monte Carlo block-bootstrapping to stress-test drawdowns.',
    isFree: false,
    estimatedHours: 4,
    iconName: 'BarChart3',
    isComingSoon: true,
    badge: 'Phase 2 Coming Soon',
    modules: [
      {
        id: 'module-8-1',
        trackId: 'systematic-testing',
        title: 'Mathematical Expectancy & Strategy Auditing',
        description: 'Quantifying whether a trading strategy possesses a genuine statistical edge.',
        order: 1,
        lessons: [
          {
            id: 'lesson-8-1-1',
            trackId: 'systematic-testing',
            moduleId: 'module-8-1',
            title: 'Mathematical Expectancy & The Edge Equation',
            slug: 'mathematical-expectancy-and-edge-equation',
            order: 1,
            isFree: false,
            readingTimeMinutes: 8,
            learningObjectives: [
              'Calculate Mathematical Expectancy per trade: $E = (P_{\\text{win}} \\times W) - (P_{\\text{loss}} \\times L)$.',
              'Prove why high win-rate strategies can have negative expectancy while low win-rate strategies compound wealth.',
              'Determine statistical sample size requirements to achieve statistical significance.'
            ],
            contentMarkdown: `### Preview: Mathematical Expectancy

A trading strategy is an investment product with an expected payoff per unit of risk:

$$E = (P_{\\text{win}} \\times \\text{Average Win in } R) - (P_{\\text{loss}} \\times \\text{Average Loss in } R)$$

If $E > 0$, the strategy has a positive statistical edge. If $E \\le 0$, no amount of money management or positive thinking can prevent capital depletion.

Phase 2 will provide interactive expectancy calculators, sample size calculators, and trade logging integrations.`,
            primarySources: [
              {
                title: 'Design, Testing, and Optimization of Trading Systems',
                url: 'https://www.wiley.com/en-us/Design%2C+Testing%2C+and+Optimization+of+Trading+Systems-p-9780471553045',
                note: 'Robert Pardo (John Wiley & Sons, 1992).'
              }
            ]
          },
          {
            id: 'lesson-8-1-2',
            trackId: 'systematic-testing',
            moduleId: 'module-8-1',
            title: 'Monte Carlo Block-Bootstrapping & Stress Testing',
            slug: 'monte-carlo-bootstrapping-and-stress-testing',
            order: 2,
            isFree: false,
            readingTimeMinutes: 8,
            learningObjectives: [
              'Differentiate naive I.I.D. shuffling from block-bootstrap resampling that preserves streak autocorrelation.',
              'Simulate 2,500 synthetic equity curves to determine Maximum Drawdown distribution (P50, P95, P99).',
              'Calculate Value at Risk (VaR 95%) and Conditional VaR (CVaR) across stress scenarios.'
            ],
            contentMarkdown: `### Preview: Monte Carlo Stress Testing

Standard backtests present a single historical equity path that may simply reflect luck. Quantitative systems deploy **Monte Carlo Block-Bootstrapping** to resample realized trade distributions across thousands of synthetic iterations, establishing the true statistical probability of hitting maximum drawdown limits or circuit breakers.

*Full Monte Carlo simulation engines and distribution charts coming in Phase 2.*`,
            primarySources: [
              {
                title: 'An Introduction to the Bootstrap',
                url: 'https://www.routledge.com/An-Introduction-to-the-Bootstrap/Efron-Tibshirani/p/book/9780412042317',
                note: 'Bradley Efron and Robert J. Tibshirani (Chapman & Hall, 1993).'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'acts-confluence-scoring',
    title: 'How ACTS Scores Confluence Conceptually',
    tagline: 'Multi-factor architecture, Bayesian weight shrinkage, and pre-trade confirmation without proprietary weights',
    description:
      'A conceptual walk-through of the ACTS 10-factor analytical architecture: multi-timeframe price action, regime-dependent chop filters, macroeconomic event guards, and the multi-agent pre-trade confirmation council.',
    isFree: false,
    estimatedHours: 3,
    iconName: 'Workflow',
    isComingSoon: true,
    badge: 'Phase 2 Coming Soon',
    modules: [
      {
        id: 'module-9-1',
        trackId: 'acts-confluence-scoring',
        title: 'The ACTS Conceptual Architecture',
        description: 'How the algorithmic engine aggregates disparate technical and macroeconomic signals into a unified confluence score.',
        order: 1,
        lessons: [
          {
            id: 'lesson-9-1-1',
            trackId: 'acts-confluence-scoring',
            moduleId: 'module-9-1',
            title: 'The 10-Factor Confluence Stack & Bayesian Weight Shrinkage',
            slug: 'ten-factor-confluence-stack-and-bayesian-shrinkage',
            order: 1,
            isFree: false,
            readingTimeMinutes: 8,
            learningObjectives: [
              'Understand how 10 discrete analytical factors (Price Action, Trend, Oscillators, Volatility, Macro) contribute to confluence.',
              'Explain how Bayesian Weight Shrinkage prevents curve-fitting and historical over-optimization.',
              'Analyze how the Chop Filter suppresses trading during low-liquidity horizontal consolidations.'
            ],
            contentMarkdown: `### Preview: The Multi-Factor Confluence Philosophy

Markets are complex non-stationary adaptive systems. A single indicator or pattern cannot succeed across all regimes.

The ACTS engine deploys a **10-Factor Confluence Architecture**:
- Each factor evaluates an independent dimension: price action structure, multi-timeframe trend alignment, momentum divergence, volatility expansion, and macro sensitivity.
- To prevent statistical curve-fitting (overfitting to past data), factor weights are regularized via **Bayesian Shrinkage**, shrinking empirical weights toward equal distribution.
- When market chop exceeds structural thresholds (Chop Index > 67.0), the engine stands down, protecting capital from whipsaw exhaustion.

*Detailed conceptual guides without proprietary weights coming in Phase 2.*`,
            primarySources: [
              {
                title: 'Bayesian Data Analysis',
                url: 'https://www.routledge.com/Bayesian-Data-Analysis/Gelman-Carlin-Stern-Dunson-Vehtari-Rubin/p/book/9781439840955',
                note: 'Andrew Gelman et al. (Chapman & Hall/CRC, 2013) — principles of prior distribution shrinkage.'
              }
            ]
          },
          {
            id: 'lesson-9-1-2',
            trackId: 'acts-confluence-scoring',
            moduleId: 'module-9-1',
            title: 'The Pre-Trade Confirmation Council: Adversarial Multi-Agent Vetoes',
            slug: 'pre-trade-confirmation-council-veto-system',
            order: 2,
            isFree: false,
            readingTimeMinutes: 7,
            learningObjectives: [
              'Analyze how specialized confirmation agents (Microstructure, Adversarial Critic, Macro Gatekeeper) review setups.',
              'Understand the invariant: external agents act strictly as veto and sizing filters (1.0x, 0.5x, 0.0x), never inflating raw technical scores.',
              'Apply the adversarial mindset to discretionary trade screening.'
            ],
            contentMarkdown: `### Preview: Pre-Trade Multi-Agent Confirmation

Even when technical confluence scores cross the baseline threshold, ACTS subjects the potential setup to an **Adversarial Pre-Trade Confirmation Council**:
1. **Microstructure Specialist**: Inspects order book depth, taker fee drag, and adverse slippage risk.
2. **Adversarial Critic**: Probes failure modes, asking: *"What specific scenario destroys this trade thesis?"*
3. **Macro Gatekeeper**: Verifies scheduled tier-1 news releases and sovereign rate catalysts.

The council produces three verdicts:
- **CONFIRMED (1.0x size)**: All agents approve.
- **CAUTION_HALF_SIZE (0.5x size)**: Elevated regime risk; position size halved.
- **VETO (0.0x size)**: Trade rejected; capital preserved.

*Full workflow analysis and operational journaling templates coming in Phase 2.*`,
            primarySources: [
              {
                title: 'Multi-Agent Systems: Algorithmic, Game-Theoretic, and Logical Foundations',
                url: 'https://www.cambridge.org/core/books/multiagent-systems/10738DA306F7EF117C0ACDFB8820E9E8',
                note: 'Yoav Shoham and Kevin Leyton-Brown (Cambridge University Press, 2008).'
              }
            ]
          }
        ]
      }
    ]
  }
]
