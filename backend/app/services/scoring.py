"""Reveal math: what every deal is worth "years later", and who won the day."""

from app.content.lessons import lessons_for
from app.models.game import PLAYER, DealResult, GameState, RevealRound, RevealView, Standing
from app.models.pitch import Pitch
from app.models.shark import SharkPersona
from app.services.deal_math import moic, stake_value

INDEX_FUND_ANNUAL_RETURN = 0.10  # long-run S&P 500 average, roughly


def deal_result(round_winner, pitch: Pitch) -> DealResult:
    value = stake_value(round_winner, pitch.outcome)
    return DealResult(
        investor=round_winner.investor,
        amount=round_winner.amount,
        equity=round_winner.equity,
        valuation=round_winner.valuation,
        stake_value=value,
        moic=moic(round_winner.amount, value),
    )


def build_reveal(
    game: GameState, pitches: dict[str, Pitch], sharks: dict[str, SharkPersona]
) -> RevealView:
    rounds: list[RevealRound] = []
    totals: dict[str, dict[str, int]] = {
        k: {"invested": 0, "value": 0, "deals": 0} for k in [PLAYER, *sharks]
    }

    for i, r in enumerate(game.rounds):
        pitch = pitches[r.pitch_id]
        deal = deal_result(r.winner, pitch) if r.winner else None
        if deal:
            t = totals[deal.investor]
            t["invested"] += deal.amount
            t["value"] += deal.stake_value
            t["deals"] += 1
        rounds.append(
            RevealRound(
                index=i,
                pitch=pitch.to_public(),
                outcome=pitch.outcome,
                real_deal=pitch.real_deal,
                deal=deal,
                lessons=lessons_for(pitch.lessons),
            )
        )

    start = game.bankroll_start
    standings = []
    for investor, t in totals.items():
        net = start - t["invested"] + t["value"]
        standings.append(
            Standing(
                investor=investor,
                name="You" if investor == PLAYER else sharks[investor].name,
                invested=t["invested"],
                portfolio_value=t["value"],
                net_worth=net,
                return_pct=round((net - start) / start * 100, 2),
                deals=t["deals"],
            )
        )
    standings.sort(key=lambda s: s.net_worth, reverse=True)

    me = totals[PLAYER]
    net_worth = game.cash + me["value"]
    years = sum(pitches[r.pitch_id].outcome.years_later for r in game.rounds) / len(game.rounds)
    benchmark = round(start * (1 + INDEX_FUND_ANNUAL_RETURN) ** years)

    my_deals = [(rr.pitch.company.name, rr.deal) for rr in rounds if rr.deal and rr.deal.investor == PLAYER]
    best = max(my_deals, key=lambda d: d[1].moic)[0] if my_deals else None
    worst = min(my_deals, key=lambda d: d[1].moic)[0] if len(my_deals) > 1 else None

    return RevealView(
        game_id=game.id,
        bankroll_start=start,
        cash_left=game.cash,
        invested=me["invested"],
        portfolio_value=me["value"],
        net_worth=net_worth,
        return_pct=round((net_worth - start) / start * 100, 2),
        benchmark_years=round(years, 1),
        benchmark_value=benchmark,
        best_deal=best,
        worst_deal=worst,
        rounds=rounds,
        standings=standings,
    )
