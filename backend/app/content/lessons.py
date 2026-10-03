"""Short finance lessons shown on the reveal cards, keyed by tag."""

LESSONS: dict[str, dict[str, str]] = {
    "valuation": {
        "title": "Price matters",
        "body": "Overpay on day one and even a winner can disappoint.",
    },
    "dilution": {
        "title": "Dilution",
        "body": "Your slice shrank as the company raised more money, but the pie grew much more.",
    },
    "survivorship_bias": {
        "title": "Survivorship bias",
        "body": "We remember the hits. Most startups quietly fail.",
    },
    "rejected_winner": {
        "title": "The one that got away",
        "body": "Every expert said no, and it won anyway. That's why investors spread their bets.",
    },
    "execution_risk": {
        "title": "Ideas aren't enough",
        "body": "A great pitch doesn't mean a great business. Costs and operations decide who survives.",
    },
    "product_claims": {
        "title": "Check the claims",
        "body": "Investors trusted the pitch instead of testing whether the product really worked.",
    },
    "exit": {
        "title": "Exits pay",
        "body": "You only cash out when the company is bought or goes public.",
    },
    "unit_economics": {
        "title": "Revenue isn't profit",
        "body": "If each sale costs more than it earns, growing faster just loses money faster.",
    },
    "mission_brand": {
        "title": "Brands win",
        "body": "A clear story turns a plain product into something people choose.",
    },
    "licensing": {
        "title": "Reach matters",
        "body": "The right partner can get a product into thousands of stores overnight.",
    },
    "franchising": {
        "title": "Franchising",
        "body": "Other people pay to open locations, and the brand earns fees from each one.",
    },
    "deal_closing": {
        "title": "A handshake isn't a deal",
        "body": "Many TV deals fell apart once investors checked the details.",
    },
    "patience": {
        "title": "Patience",
        "body": "Some companies grow slowly for years before taking off.",
    },
}


def lessons_for(tags: list[str]) -> list[dict[str, str]]:
    return [LESSONS[t] for t in tags if t in LESSONS]
