/** Finance glossary: plain-language definitions with an example from the game. */

export interface GlossaryTerm {
  id: string
  term: string
  short: string
  example?: string
}

export interface GlossaryGroup {
  title: string
  terms: GlossaryTerm[]
}

export const GLOSSARY: GlossaryGroup[] = [
  {
    title: 'The basics',
    terms: [
      {
        id: 'startup',
        term: 'Startup',
        short: 'A young company trying to grow fast. Most are small, risky and not yet profitable.',
      },
      {
        id: 'founder',
        term: 'Founder',
        short: 'The person who started the company and usually runs it.',
      },
      {
        id: 'investor',
        term: 'Investor',
        short: 'Someone who gives a company money in exchange for a piece of it, hoping it grows.',
        example: 'You and the four sharks are the investors.',
      },
      {
        id: 'investment',
        term: 'Investment',
        short: 'Money you put in now, hoping it’s worth more later.',
        example: 'Offering $100K to Scrub Daddy is an investment.',
      },
      {
        id: 'equity',
        term: 'Equity',
        short: 'Ownership of a company, measured in percent. Also called shares or a stake.',
        example: '10% equity means you own one tenth of the company.',
      },
      {
        id: 'valuation',
        term: 'Valuation',
        short: 'What the whole company is worth. Money offered ÷ percent bought.',
        example: '$100K for 10% means a $1M valuation.',
      },
      {
        id: 'revenue',
        term: 'Revenue',
        short: 'All the money a company brings in from sales, before paying any costs.',
      },
      {
        id: 'profit',
        term: 'Profit',
        short: 'What’s left after costs. For an investor: what your stake is worth minus what you paid.',
        example: 'Pay $50K, stake worth $200K later → $150K profit.',
      },
      {
        id: 'margin',
        term: 'Profit margin',
        short: 'How much of each sale is profit, in percent.',
        example: 'Sell a $10 sponge that costs $4 to make → 60% margin.',
      },
    ],
  },
  {
    title: 'Making a deal',
    terms: [
      {
        id: 'ask',
        term: 'The ask',
        short: 'What the founder wants: an amount of money for a percent of the company.',
        example: '“$100K for 10%.”',
      },
      {
        id: 'offer',
        term: 'Offer',
        short: 'What an investor proposes instead. It can be more money, less money or a bigger percent.',
      },
      {
        id: 'counteroffer',
        term: 'Counteroffer',
        short: 'A reply to an offer with different terms, like the same money for a smaller percent.',
      },
      {
        id: 'due-diligence',
        term: 'Due diligence',
        short: 'Checking that everything a founder said is true before the money is sent.',
        example: 'Many TV handshakes fall apart during due diligence.',
      },
      {
        id: 'royalty',
        term: 'Royalty',
        short: 'A deal where the investor gets a cut of every sale instead of (or as well as) equity.',
      },
      {
        id: 'smart-money',
        term: 'Smart money',
        short: 'An investor who brings skills and connections, not just cash. Founders may accept less money for it.',
        example: 'A shark who can get you into big stores.',
      },
    ],
  },
  {
    title: 'What happens next',
    terms: [
      {
        id: 'risk',
        term: 'Risk',
        short: 'The chance you lose some or all of your money. Startups are very risky.',
      },
      {
        id: 'multiple',
        term: 'Multiple (×)',
        short: 'How many times your money grew.',
        example: '$10K that becomes $50K is a 5× multiple.',
      },
      {
        id: 'return',
        term: 'Return',
        short: 'How much you gained or lost, usually in percent.',
        example: '$100 → $150 is a +50% return.',
      },
      {
        id: 'dilution',
        term: 'Dilution',
        short: 'When a company sells new shares to raise money, everyone’s percent shrinks.',
        example: 'Your 10% might become 6%, but of a much bigger company.',
      },
      {
        id: 'exit',
        term: 'Exit',
        short: 'When investors finally cash out, usually because the company is bought or goes public.',
      },
      {
        id: 'acquisition',
        term: 'Acquisition',
        short: 'When a bigger company buys a smaller one.',
        example: 'Amazon bought Ring (Doorbot) for about $1 billion.',
      },
      {
        id: 'ipo',
        term: 'IPO',
        short: 'Initial public offering: when a company first sells shares on the stock market.',
      },
      {
        id: 'bankruptcy',
        term: 'Going out of business',
        short: 'The company shuts down. Investors usually lose everything they put in.',
      },
      {
        id: 'index-fund',
        term: 'Index fund',
        short: 'One investment that owns a little of hundreds of big companies. Slow, steady, lower risk.',
        example: 'Historically about 10% a year on average, with ups and downs.',
      },
      {
        id: 'diversify',
        term: 'Diversify',
        short: 'Spreading money across many investments so one failure doesn’t sink you.',
      },
      {
        id: 'survivorship-bias',
        term: 'Survivorship bias',
        short: 'Only noticing the winners. We hear about Scrub Daddy, not the many companies that quietly failed.',
      },
    ],
  },
]

export const TERMS: Record<string, GlossaryTerm> = Object.fromEntries(
  GLOSSARY.flatMap((g) => g.terms).map((t) => [t.id, t]),
)
