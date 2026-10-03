"""Short finance lessons shown on the reveal cards, keyed by tag."""

LESSONS: dict[str, dict[str, str]] = {
    "valuation": {
        "title": "Valuation",
        "body": "Amount ÷ equity = the company's implied value. $100K for 10% means you "
        "think the whole company is worth $1M. Overpay on day one and even a winner "
        "can disappoint.",
    },
    "dilution": {
        "title": "Dilution",
        "body": "When a startup raises more money later, it issues new shares. Your "
        "percentage shrinks, but a smaller slice of a much bigger pie can still be "
        "worth far more.",
    },
    "survivorship_bias": {
        "title": "Survivorship bias",
        "body": "We remember the Scrub Daddys and forget the hundreds of pitches that "
        "quietly closed. Most early-stage bets lose money; a few big winners pay for "
        "everything else.",
    },
    "rejected_winner": {
        "title": "The ones that got away",
        "body": "Sometimes every expert says no and the company wins anyway. Investors "
        "miss great deals all the time. That's why they spread their bets.",
    },
    "execution_risk": {
        "title": "Execution risk",
        "body": "A great idea and a viral TV moment aren't a business. Operations, unit "
        "economics and cash flow decide whether a company survives the spotlight.",
    },
    "product_claims": {
        "title": "Due diligence",
        "body": "Investors trusted the pitch instead of verifying the product. Asking "
        "hard questions about whether something truly works is part of the job.",
    },
    "exit": {
        "title": "Exits",
        "body": "You only make money from private-company equity when there's an exit: "
        "an acquisition, IPO or buyback. A quick sale at a modest price can still be "
        "a great return.",
    },
    "unit_economics": {
        "title": "Unit economics",
        "body": "Revenue isn't profit. A subscription that costs more to ship than "
        "customers pay gets worse, not better, as it grows.",
    },
    "mission_brand": {
        "title": "Brand & mission",
        "body": "A clear story (like 'buy one, give one') turns a commodity into a brand "
        "people choose and talk about. That's pricing power.",
    },
    "licensing": {
        "title": "Licensing & retail reach",
        "body": "Getting into big retailers or TV shopping can multiply sales overnight. "
        "The right partner can be worth more than the money they invest.",
    },
    "franchising": {
        "title": "Franchising",
        "body": "Franchising lets a brand grow with other people's capital: franchisees "
        "pay to open locations, the brand collects fees and royalties.",
    },
    "patience": {
        "title": "Patience",
        "body": "Some companies grow slowly for decades before taking off. Long-term "
        "compounding rewards investors who hold on.",
    },
}


def lessons_for(tags: list[str]) -> list[dict[str, str]]:
    return [LESSONS[t] for t in tags if t in LESSONS]
