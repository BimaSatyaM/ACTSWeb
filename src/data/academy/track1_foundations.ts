import { Track } from '@/types/academy'

export const track1Foundations: Track = {
  id: 'foundations',
  title: 'Foundations & Risk Management',
  tagline: 'Capital preservation as the prerequisite to trading',
  description:
    'Master order book microstructure, matching engine execution, order types, invariant position sizing mathematics, and the asymmetric drawdown recovery trap before risking capital.',
  isFree: true,
  estimatedHours: 3,
  iconName: 'ShieldAlert',
  modules: [
    {
      id: 'module-1-1',
      trackId: 'foundations',
      title: 'Market Mechanics & Order Flow Structure',
      description: 'The physical and computational architecture of electronic matching engines and order execution.',
      order: 1,
      lessons: [
        {
          id: 'lesson-1-1-1',
          trackId: 'foundations',
          moduleId: 'module-1-1',
          title: 'Limit Order Books, Matching Engines & Fee Friction',
          slug: 'limit-order-books-matching-engines',
          order: 1,
          isFree: true,
          readingTimeMinutes: 7,
          learningObjectives: [
            'Analyze the continuous double-auction mechanism of modern electronic limit order books (LOB).',
            'Distinguish between passive maker orders providing liquidity and aggressive taker orders removing liquidity.',
            'Calculate true round-trip transaction costs including bid-ask spread and taker exchange commissions.',
            'Explain why market orders suffer adverse price slippage in volatile or thin liquidity regimes.'
          ],
          contentMarkdown: `### The Electronic Double-Auction Marketplace

Prices in financial markets do not move because of abstract lines on charts or arbitrary indicator crossovers. Market prices move because of continuous, high-frequency interactions between buyers and sellers within an electronic **Continuous Double Auction (CDA)** system known as the **Limit Order Book (LOB)**.

Every liquid exchange (such as Binance, CME, or Coinbase) maintains a centralized matching engine. The matching engine organizes market interest into two opposing queues:

1. **The Bid Queue (Demand)**: Resting buy limit orders arranged strictly in descending price order. The highest price a buyer is currently willing to pay is called the **Best Bid**.
2. **The Ask / Offer Queue (Supply)**: Resting sell limit orders arranged strictly in ascending price order. The lowest price a seller is currently willing to accept is called the **Best Ask**.

:::visual[orderbook-depth]

---

### The Bid-Ask Spread: The Inescapable Toll

The difference between the Best Ask and the Best Bid is the **Bid-Ask Spread**:

$$\\text{Spread} = \\text{Best Ask} - \\text{Best Bid}$$

When you submit an immediate buy order at the market price, you do not execute at the mid-price; you buy from the Best Ask ($65,010 in the diagram above). If you immediately close the position, you must sell to the Best Bid ($65,000). You have lost $10 per Bitcoin instantly before paying a single dollar in exchange trading fees.

In liquid conditions (e.g., normal BTCUSDT trading), spreads are tight (often $0.10 to $1.00 on a $65,000 asset, or under 0.002%). However, during major macroeconomic releases or flash drops, market makers cancel their resting limit orders in milliseconds. The order book thins out, and the spread widens dramatically.

---

### Taker vs. Maker: Liquidity Consumers vs. Liquidity Providers

Exchanges categorize participants based on whether their order adds or removes resting volume:

- **Maker (Liquidity Provider)**: Orders placed below the market (buy limits) or above the market (sell limits) that rest on the book. Because makers provide liquidity for other participants, exchanges reward them with reduced commission rates (typically 0.02% or even zero/rebates).
- **Taker (Liquidity Consumer)**: Orders that cross the spread to execute immediately against existing resting orders (market orders or marketable limit orders). Takers demand immediate execution certainty and pay higher fees (typically 0.05% on crypto derivatives).

#### Calculating Real Transaction Drag
Consider a trader executing 20 round-trip trades per month on a $25,000 account, trading 1.0 BTC notional position per trade at $65,000:

- **Taker Fee (Round-trip 0.10%)**: $65,000 \\times 0.0010 = \\$65.00$ per trade.
- **Monthly Fee Drag**: $20 \\times \\$65.00 = \\$1,300.00$ per month.
- **Annualized Capital Friction**: $\\$15,600.00$ per year—representing **62.4%** of the entire starting account equity consumed solely by taker fees!

Institutional traders minimize taker orders, preferring resting limit entries and disciplined bracket execution.

---

### Adverse Slippage: The Reality of Liquidity Depletion

A market order does not fix a specific price; it prioritizes immediate execution at whatever prices exist in the book.

If you submit a market buy order for 5.0 BTC when the Best Ask only has 0.75 BTC at $65,010:
1. 0.75 BTC fills at $65,010.
2. 1.80 BTC fills at $65,020.
3. 2.45 BTC fills at $65,030.

Your **volume-weighted average fill price (VWAP)** is $65,023.40. The $13.40 difference from the initial Best Ask is **adverse slippage**. During volatility spikes, slippage can exceed your intended stop-loss buffer, turning a planned 1.0% risk into an unintended 2.5% loss.`,
          quiz: [
            {
              id: 'q-1-1-1-1',
              question: 'When a trader submits an aggressive Market Buy order, which queue in the order book does the matching engine match against?',
              options: [
                'Resting Bids (Buy Limit orders)',
                'Resting Asks (Sell Limit orders)',
                'Resting Stop-Loss orders',
                'Unexecuted Market Orders'
              ],
              correctIndex: 1,
              explanation:
                'Market buy orders demand immediate liquidity and execute against the lowest resting sell limit orders (the Ask queue), starting at the Best Ask.'
            },
            {
              id: 'q-1-1-1-2',
              question: 'If the Best Bid is $60,000 and the Best Ask is $60,012, what is the immediate round-trip spread cost of buying and immediately selling 1 BTC?',
              options: ['$0', '$6', '$12', '$24'],
              correctIndex: 2,
              explanation:
                'Buying at the ask ($60,012) and selling immediately at the bid ($60,000) crosses the spread, incurring an immediate $12 loss before exchange fees.'
            },
            {
              id: 'q-1-1-1-3',
              question: 'Why do quantitative and institutional traders minimize the use of aggressive market orders?',
              options: [
                'Market orders are illegal under exchange terms',
                'Taker fees and adverse slippage create a substantial mathematical drag on long-term capital',
                'Market orders always fail to fill on derivatives exchanges',
                'Limit orders eliminate all possibility of capital loss'
              ],
              correctIndex: 1,
              explanation:
                'Taker fees (typically 0.05% vs 0.02% maker) combined with adverse slippage during liquidity voids compound into a massive hurdle rate on performance.'
            }
          ],
          primarySources: [
            {
              title: 'Trading and Exchanges: Market Microstructure for Practitioners',
              url: 'https://global.oup.com/academic/product/trading-and-exchanges-9780195144703',
              note: 'Prof. Larry Harris (Oxford University Press, 2003) — definitive textbook on order books, matching algorithms, and liquidity.'
            },
            {
              title: 'Empirical Market Microstructure: The Institutions, Economics, and Econometrics of Securities Trading',
              url: 'https://global.oup.com/academic/product/empirical-market-microstructure-9780195301649',
              note: 'Prof. Joel Hasbrouck (Oxford University Press, 2007) — continuous auction mechanics and price discovery.'
            }
          ]
        },
        {
          id: 'lesson-1-1-2',
          trackId: 'foundations',
          moduleId: 'module-1-1',
          title: 'Order Types, Execution Mechanics & The Stop-Limit Hazard',
          slug: 'order-types-and-stop-limit-hazard',
          order: 2,
          isFree: true,
          readingTimeMinutes: 6,
          learningObjectives: [
            'Differentiate between price control and execution certainty across order types.',
            'Explain the catastrophic non-execution risk of Stop-Limit orders during fast market drops.',
            'Structure One-Cancels-the-Other (OCO) brackets to decouple trade management from human emotion.'
          ],
          contentMarkdown: `### The Universal Trade-Off: Price vs. Execution Certainty

In electronic trading, every order type forces an unavoidable mathematical trade-off: **you can control the price you pay, or you can control the certainty of execution, but you can never secure both simultaneously.**

:::visual[order-types-matrix]

---

### The Anatomy of Stop Orders

A stop order is inactive until the market trades at or through a designated **Stop Trigger Price**. Once triggered, its behavior depends on whether it converts into a market order or a limit order:

#### 1. Stop-Market (The Protective Lifeline)
When price touches the trigger, the matching engine instantly converts the order into an unconditional market order.
- **Advantage**: Execution is assured. Your position will be closed.
- **Disadvantage**: In an illiquid crash, you may incur slippage below your trigger.
- **Institutional Verdict**: For capital preservation and defense, Stop-Market is the required choice for risk management.

#### 2. Stop-Limit (The Fatal Flaw in Capital Defense)
A Stop-Limit requires two distinct parameters:
- **Stop Trigger Price**: The price that activates the order.
- **Limit Price**: The worst price you are willing to accept.

**The Catastrophic Failure Mode**:
Suppose you buy Bitcoin at $64,000. You set a Stop-Limit with a Stop Trigger at $62,000 and a Limit Price at $61,900.

Now, a severe macroeconomic catalyst or cascading liquidation shock occurs. The price flash-crashes from $62,050 to $61,500 in one second:
1. The market trades through $62,000, triggering your order.
2. The engine submits a Sell Limit order at $61,900.
3. But the market is already trading at $61,500 and heading down!
4. **Result**: Your limit order rests unfilled on the book at $61,900 while the market plunges to $55,000. You remain fully exposed, nursing an uncontrolled 14% drawdown instead of your intended 3% stop!

> **Rule**: Never use Stop-Limit orders for stop-loss defense. Use Stop-Market orders to ensure absolute exit certainty when structural invalidation is breached.

---

### One-Cancels-the-Other (OCO) Bracket Orders

Disciplined traders do not enter a position and then manually watch the screen to close it. They use **One-Cancels-the-Other (OCO)** brackets.

An OCO bracket binds a Take-Profit limit order and a Stop-Market order together:
- If the market rises and hits your Take-Profit, the matching engine fills the TP and immediately cancels the Stop-Loss.
- If the market drops and hits your Stop-Loss, the engine fills the SL and immediately cancels the Take-Profit.

This architecture protects against dual executions and removes emotional hesitation during market stress.`,
          quiz: [
            {
              id: 'q-1-1-2-1',
              question: 'Why is a Stop-Limit order dangerous when used as a protective stop-loss?',
              options: [
                'Exchange fees are doubled on Stop-Limit orders',
                'If the market gaps or crashes rapidly past the limit price, the order remains resting and unfilled while losses mount',
                'Stop-Limit orders are automatically cancelled after 60 seconds',
                'The matching engine always prioritizes retail Stop-Limit orders over institutional orders'
              ],
              correctIndex: 1,
              explanation:
                'In rapid market drops or price gaps, the market price can bypass the limit price, leaving the order unfilled and the trader exposed to unlimited loss.'
            },
            {
              id: 'q-1-1-2-2',
              question: 'What happens when one leg of a One-Cancels-the-Other (OCO) bracket order is executed?',
              options: [
                'The opposite leg is automatically doubled in size',
                'The opposite leg is automatically cancelled by the matching engine',
                'The trader must manually confirm cancellation via the exchange interface',
                'The position is rolled over into the next perpetual contract'
              ],
              correctIndex: 1,
              explanation:
                'An OCO order automatically and atomically cancels the complementary order as soon as either the profit target or stop loss is triggered.'
            }
          ],
          primarySources: [
            {
              title: 'U.S. SEC Investor Bulletin: Understanding Order Types',
              url: 'https://www.sec.gov/oiea/investor-alerts-and-bulletins/ib_ordertypes',
              note: 'U.S. Securities and Exchange Commission (OIEA) — formal regulatory guidance on execution risks of market vs limit vs stop orders.'
            },
            {
              title: 'CME Group: Order Types in Futures & Options Trading',
              url: 'https://www.cmegroup.com/education/courses/introduction-to-futures/order-types.html',
              note: 'Chicago Mercantile Exchange — institutional order execution and matching specifications.'
            }
          ]
        }
      ]
    },
    {
      id: 'module-1-2',
      trackId: 'foundations',
      title: 'Risk Management & Mathematical Survival',
      description: 'Invariant position sizing, asymmetric drawdown mechanics, and pre-trade capital preservation protocols.',
      order: 2,
      lessons: [
        {
          id: 'lesson-1-2-1',
          trackId: 'foundations',
          moduleId: 'module-1-2',
          title: 'The Invariant Position Sizing Formula',
          slug: 'invariant-position-sizing-formula',
          order: 1,
          isFree: true,
          readingTimeMinutes: 8,
          learningObjectives: [
            'Calculate fixed fractional risk where capital at risk never exceeds 1.0% to 2.0% of account equity.',
            'Differentiate between notional position size and total capital at risk.',
            'Apply the universal position sizing equation across any asset class or leverage multiplier.',
            'Explain why leverage is an output of stop-loss placement rather than an arbitrary input.'
          ],
          contentMarkdown: `### Fixed Fractional Risk: The Mathematical Firewall

The single defining difference between professional risk managers and amateur market gamblers is how they determine trade size:

- **Amateurs** decide how much money they want to make, choose an arbitrary leverage multiplier (e.g., 20x or 50x), and buy as many contracts as the exchange margin allows.
- **Professionals** first determine where their trade thesis is mathematically and structurally disproven on the chart, calculate the exact dollar risk between entry and invalidation, and derive their position size from a strict fraction of portfolio equity (typically **0.5% to 1.0%**, never exceeding 2.0%).

---

### The Universal Invariant Position Sizing Formula

Regardless of whether you are trading spot Bitcoin, perpetual futures, equities, or foreign exchange, the universal formula for position sizing is:

$$\\text{Position Size (Units)} = \\frac{\\text{Account Equity} \\times \\text{Risk Fraction}}{|\\text{Entry Price} - \\text{Stop-Loss Price}|}$$

Where:
- **Account Equity**: Total net account balance in cash/collateral (e.g., $10,000).
- **Risk Fraction**: Maximum percentage of equity risked if the stop is triggered (e.g., $1.0\\% = 0.01$).
- **$|\\text{Entry} - \\text{SL}|$**: The absolute dollar distance per unit between your entry and your technical invalidation level.

#### Key Derived Quantities:
$$\\text{Dollar Capital at Risk} = \\text{Account Equity} \\times \\text{Risk Fraction}$$
$$\\text{Total Notional Value} = \\text{Position Size (Units)} \\times \\text{Entry Price}$$
$$\\text{Effective Leverage} = \\frac{\\text{Total Notional Value}}{\\text{Account Equity}}$$

:::visual[position-sizer]

---

### Worked Numerical Example: Long BTCUSDT

Let us step through a real trading setup:

- **Account Balance**: $\\$10,000$
- **Risk per Trade**: $1.0\\%$ (Dollar Risk = $\\$100$)
- **Technical Entry Price**: $\\$65,000$
- **Structural Invalidation (Stop-Loss)**: $\\$63,500$ (Below the recent 4-hour swing low)

#### Step 1: Calculate Stop Distance
$$\\Delta P = \\$65,000 - \\$63,500 = \\$1,500 \\text{ per BTC } (2.308\\%)$$

#### Step 2: Calculate Exact Unit Size
$$\\text{Units} = \\frac{\\$100}{\\$1,500} = 0.0667 \\text{ BTC}$$

#### Step 3: Calculate Total Notional Value
$$\\text{Notional Value} = 0.0667 \\times \\$65,000 = \\$4,333.33$$

#### Step 4: Determine Required Leverage
$$\\text{Effective Leverage} = \\frac{\\$4,333.33}{\\$10,000} = 0.433\\times$$

Notice the profound takeaway: **You need zero borrowed leverage.** In fact, your position utilizes less than half your cash equity! If the price hits your stop-loss at $63,500, your loss is exactly:

$$0.0667 \\times (\\$65,000 - \\$63,500) = \\$100.00 \\text{ (exactly 1.00\\% of equity)}$$

Your remaining balance is $\\$9,900.00$, leaving you completely liquid and emotionally composed to take the next trade.`,
          quiz: [
            {
              id: 'q-1-2-1-1',
              question: 'A trader has an account balance of $25,000 and risks 1.0% per trade. They enter a trade at $100 with a stop-loss at $95. What is the correct position size?',
              options: ['25 units', '50 units', '250 units', '500 units'],
              correctIndex: 1,
              explanation:
                '1.0% of $25,000 is $250 total dollar risk. The distance to stop is $100 - $95 = $5 per unit. Position size = $250 / $5 = 50 units.'
            },
            {
              id: 'q-1-2-1-2',
              question: 'In professional risk management, how should trading leverage be treated?',
              options: [
                'As a fixed setting chosen before looking at the chart (e.g., always 20x)',
                'As an output derived after calculating position size from stop-loss distance, rather than an arbitrary input',
                'As a method to turn small trading accounts into large ones quickly',
                'As a substitute for a technical stop-loss'
              ],
              correctIndex: 1,
              explanation:
                'Leverage is purely a mathematical quotient (Notional Value / Account Balance). It is dictated by the distance to your technical stop-loss, never picked arbitrarily.'
            }
          ],
          primarySources: [
            {
              title: 'The Mathematics of Money Management: Risk Analysis Techniques for Traders',
              url: 'https://www.wiley.com/en-us/The+Mathematics+of+Money+Management%3A+Risk+Analysis+Techniques+for+Traders-p-9780471547389',
              note: 'Ralph Vince (John Wiley & Sons, 1992) — foundational quantitative text on position sizing, fractional risk, and capital depletion.'
            },
            {
              title: 'Trade Your Way to Financial Freedom',
              url: 'https://www.mheducation.com/highered/product/trade-way-financial-freedom-tharp/9780071478717.html',
              note: 'Dr. Van K. Tharp (McGraw-Hill, 1999) — comprehensive exposition of fixed fractional position sizing and R-multiples.'
            }
          ]
        },
        {
          id: 'lesson-1-2-2',
          trackId: 'foundations',
          moduleId: 'module-1-2',
          title: 'R-Multiples & The Asymmetric Drawdown Recovery Trap',
          slug: 'r-multiples-and-drawdown-recovery-trap',
          order: 2,
          isFree: true,
          readingTimeMinutes: 8,
          learningObjectives: [
            'Express all trading outcomes in standardized R-multiples ($1R = \\text{Planned Capital at Risk}$).',
            'Calculate true weighted realized returns using the ACTS institutional 3-target scaling bracket.',
            'Analyze the exponential non-linear math of the portfolio drawdown recovery trap.',
            'Explain why preventing severe drawdowns is mathematically superior to seeking high win rates.'
          ],
          contentMarkdown: `### Normalizing Performance with R-Multiples

Comparing raw dollar returns or percentage price movements across different trades creates confusion because every trade setup has a different stop distance and position size. 

To eliminate this confusion, quantitative trading systems measure all performance in **R-Multiples**:

$$1R = \\text{Initial Planned Dollar Risk}$$

- If you risk $\\$200$ on a trade and exit with a $\\$400$ profit, the trade returned **$+2.0R$**.
- If you risk $\\$500$ on a trade and are stopped out at your planned invalidation, the trade returned **$-1.0R$**.
- If your stop is breached by adverse slippage and you lose $\\$250$ on a $\\$200$ plan, the trade returned **$-1.25R$**.

By standardizing every trade into units of risk, you can analyze your strategy's true mathematical expectancy independently of account size.

---

### ACTS True Weighted Exit Bracket Math

Amateur trading courses often claim: *"Our target 1 is +1R, target 2 is +2R, and target 3 is +3.5R, so a winning trade makes +6.5R!"*

This is **mathematically false**. You cannot claim the unweighted sum of targets because your full position does not reach the final target! As you scale out of contracts to lock in profit, your remaining exposed size decreases.

The ACTS institutional framework enforces **True Weighted Bracket Math**:

:::visual[bracket-r-math]

#### Mathematical Derivation:
$$\\text{Realized } R = (0.40 \\times 1.0R) + (0.35 \\times 2.0R) + (0.25 \\times 3.5R) = 0.40 + 0.70 + 0.875 = +1.975R$$

Furthermore, upon hitting **TP1 (+1.0R)**, the stop-loss on the remaining 60% of the position is automatically moved to **Breakeven (0.0R)**. If the market reverses from between TP1 and TP2:
$$\\text{Realized } R = (0.40 \\times 1.0R) + (0.60 \\times 0.0R) = +0.40R$$

This disciplined scaling structure ensures that profits are banked while eliminating catastrophic round-trip reversals.

---

### The Asymmetric Drawdown Recovery Trap

Most retail traders believe that losing 50% of an account requires a 50% gain to recover. This elementary mathematical error leads directly to portfolio ruin.

Because losses compound downward against a shrinking capital base, the gain required to recover to peak equity is **exponentially asymmetric**:

$$\\text{Gain Required to Breakeven} = \\frac{\\text{Drawdown Fraction}}{1 - \\text{Drawdown Fraction}}$$

| Portfolio Peak Drawdown | Capital Remaining | Gain Required to Breakeven | Real-World Difficulty |
|:---:|:---:|:---:|:---|
| **-10%** | 90% | **+11.1%** | Manageable through normal systematic edge |
| **-20%** | 80% | **+25.0%** | Requires solid multi-month consistency |
| **-30%** | 70% | **+42.9%** | High difficulty; emotional strain sets in |
| **-40%** | 60% | **+66.7%** | Severe impairment; recovery often takes years |
| **-50%** | 50% | **+100.0%** | Must double your capital just to get back to zero |
| **-60%** | 40% | **+150.0%** | Near impossible without reckless gambling |
| **-75%** | 25% | **+300.0%** | Complete structural impairment |
| **-90%** | 10% | **+900.0%** | Terminal portfolio destruction |

At a -50% drawdown, you must produce a +100% gain—doubling remaining money—just to recover your starting principal. At a -90% drawdown, you need a 10x (+900%) return. 

**Conclusion**: Protecting your capital against deep drawdowns through strict fixed fractional sizing ($\le 1.0\\%$) is mathematically infinitely more important than chasing high-risk gains.`,
          quiz: [
            {
              id: 'q-1-2-2-1',
              question: 'In the ACTS weighted bracket model (40% at +1.0R, 35% at +2.0R, 25% at +3.5R), what is the exact realized R-multiple if all three targets are hit?',
              options: ['+6.500R', '+1.975R', '+2.500R', '+3.500R'],
              correctIndex: 1,
              explanation:
                '(0.40 * 1.0) + (0.35 * 2.0) + (0.25 * 3.5) = 0.40 + 0.70 + 0.875 = +1.975R. Claiming +6.5R is mathematically invalid because size is scaled out along the way.'
            },
            {
              id: 'q-1-2-2-2',
              question: 'If a trading account suffers a 50% drawdown from its peak, what percentage gain is required on the remaining capital to reach the previous peak?',
              options: ['+50%', '+75%', '+100%', '+200%'],
              correctIndex: 2,
              explanation:
                'If an account drops from $10,000 to $5,000 (-50%), it must generate a $5,000 gain on its remaining $5,000 balance: $5,000 / $5,000 = +100%.'
            }
          ],
          primarySources: [
            {
              title: 'Portfolio Selection: Efficient Diversification of Investments',
              url: 'https://www.wiley.com/en-us/Portfolio+Selection%3A+Efficient+Diversification+of+Investments-p-9780471574866',
              note: 'Harry Markowitz (John Wiley & Sons, 1959) — Nobel Prize paper establishing variance, drawdown, and expected portfolio utility.'
            },
            {
              title: 'A Mathematical Analysis of the Drawdown Risk of Investment Strategies',
              url: 'https://www.jstor.org/stable/2329241',
              note: 'Journal of Applied Probability — mathematical proofs of asymmetric drawdown recovery and gambler ruin probabilities.'
            }
          ]
        },
        {
          id: 'lesson-1-2-3',
          trackId: 'foundations',
          moduleId: 'module-1-2',
          title: 'The 4-Point Pre-Trade Invariant Checklist',
          slug: 'four-point-pre-trade-checklist',
          order: 3,
          isFree: true,
          readingTimeMinutes: 5,
          learningObjectives: [
            'Implement a mandatory 4-point verification gate before submitting any trade to the matching engine.',
            'Differentiate between objective structural invalidation and arbitrary financial stops.',
            'Audit concurrent portfolio risk to avoid multi-asset correlation clustering.'
          ],
          contentMarkdown: `### The Pre-Flight Protocol of Systematic Trading

Commercial airline pilots never take off based on optimism or intuition; they execute a non-negotiable physical checklist before the aircraft leaves the gate.

Systematic trading demands the exact same operational rigor. Submitting an order to an exchange without verifying structural invalidation, risk percentage, economic event calendars, and portfolio correlation is operational negligence.

---

### The ACTS 4-Point Pre-Trade Invariant Checklist

Before clicking buy or sell, every trade must pass all four criteria:

:::visual[pre-trade-checklist]

---

### Detailed Breakdown of the 4 Pillars

#### Pillar 1: Structural Invalidation
A stop-loss exists for exactly one reason: **to exit the trade when the market proves your premise wrong.**
- **Wrong**: "I will set my stop at $500 below entry because that is $100." The market does not know or care about your account balance.
- **Right**: "I am going long because the market established a higher swing low at $63,480. If price closes below $63,480, market structure has shifted bearish and my thesis is disproven. My stop is at $63,450."

#### Pillar 2: Sizing Compliance
Verify with the Position Sizing Calculator:
$$\\text{Loss at Stop} \\le \\text{Account Equity} \\times 0.01$$
If the stop is wide, position size must decrease. If the stop is tight, position size can increase. The dollar risk remains identical.

#### Pillar 3: High-Impact Macro Filter
Entering a directional trade 15 minutes before an FOMC Rate Decision or U.S. Consumer Price Index (CPI) release is gambling. During tier-1 releases:
- Spreads widen 5x–20x.
- Liquidity evaporates from the order book.
- Whipsaws sweep stops in both directions within 30 seconds.
- **Rule**: Never enter new swing positions within 60 minutes of high-impact releases.

#### Pillar 4: Correlation Clustering
Buying BTCUSDT, ETHUSDT, and SOLUSDT simultaneously is not three independent trades. In digital assets, the cross-correlation coefficient typically exceeds $0.85$. Holding three long positions at 1.0% risk each is effectively a single 3.0% leveraged bet on the crypto beta market. If Bitcoin dumps, all three will stop out together, violating your daily loss limit.`,
          quiz: [
            {
              id: 'q-1-2-3-1',
              question: 'Where should a protective stop-loss be placed on a long trade?',
              options: [
                'At an exact round number like $60,000',
                'At whatever price represents an exact $50 loss on your account',
                'At a price level where market structure objectively invalidates the trade hypothesis (e.g., below the prior swing low)',
                '1.0% below entry price regardless of chart structure'
              ],
              correctIndex: 2,
              explanation:
                'Stops must be placed at technical invalidation levels where the trade premise is disproven. Position size is then adjusted to ensure the dollar risk does not exceed 1.0%.'
            },
            {
              id: 'q-1-2-3-2',
              question: 'Why does holding concurrent long positions in BTC, ETH, and SOL violate portfolio risk principles if each is sized at 1.0% risk?',
              options: [
                'Exchanges forbid holding multiple crypto contracts simultaneously',
                'High cross-asset correlation means the positions act as a single concentrated 3.0% risk bet on market direction',
                'Ethereum and Solana have lower liquidity than Bitcoin',
                'Transaction fees triple when trading more than one pair'
              ],
              correctIndex: 1,
              explanation:
                'Because crypto assets exhibit high statistical correlation (>0.85), concurrent long positions concentrate risk rather than diversifying it, exposing the portfolio to amplified simultaneous drawdowns.'
            }
          ],
          primarySources: [
            {
              title: 'The Checklist Manifesto: How to Get Things Right',
              url: 'https://metropolitanbooks.com/books/the-checklist-manifesto/',
              note: 'Atul Gawande (Metropolitan Books, 2009) — study of systematic pre-flight error reduction in high-stakes environments.'
            },
            {
              title: 'Expected Returns: An Investor’s Guide to Harvesting Market Rewards',
              url: 'https://www.wiley.com/en-us/Expected+Returns%3A+An+Investor%27s+Guide+to+Harvesting+Market+Rewards-p-9781119990727',
              note: 'Antti Ilmanen (John Wiley & Sons, 2011) — cross-asset correlation dynamics and risk clustering.'
            }
          ]
        }
      ]
    }
  ]
}
