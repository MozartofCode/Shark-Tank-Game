from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
HIDDEN = ("outcome", "founder_prefs", "real_deal", "walkaway")


def test_health():
    body = client.get("/api/health").json()
    assert body["status"] == "ok" and body["pitches"] >= 5


def test_game_view_never_leaks_hidden_data():
    res = client.post("/api/games")
    assert res.status_code == 200
    raw = res.text
    for key in HIDDEN:
        assert key not in raw, key


def test_media_never_serves_pitch_json():
    assert client.get("/media/doorbot/pitch.json").status_code == 404
    assert client.get("/media/doorbot/..%2F..%2Fbackend%2Fpyproject.toml").status_code == 404


def test_question_streams_and_counts_down():
    game = client.post("/api/games").json()
    with client.stream(
        "POST", f"/api/games/{game['id']}/rounds/0/questions", json={"question": "What are your sales?"}
    ) as res:
        body = "".join(res.iter_text())
    assert "event: done" in body
    after = client.get(f"/api/games/{game['id']}").json()
    assert after["rounds"][0]["questions_left"] == 2


def test_offer_flow_and_reveal():
    game = client.post("/api/games").json()
    gid = game["id"]
    bad = client.post(f"/api/games/{gid}/rounds/0/offer", json={"amount": 1, "equity": 0.1})
    assert bad.status_code == 400
    for i in range(game["total_rounds"]):
        res = client.post(f"/api/games/{gid}/rounds/{i}/offer", json={"pass": True})
        assert res.status_code == 200
    reveal = client.post(f"/api/games/{gid}/reveal").json()
    assert reveal["net_worth"] == 1_000_000 and reveal["profit"] == 0
    assert len(reveal["rounds"]) == game["total_rounds"]
    assert all(r["outcome"]["sources"] for r in reveal["rounds"])
