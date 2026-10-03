from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_class_flow_end_to_end():
    room = client.post("/api/classes", json={"name": "Period 3 Econ"}).json()
    code, token = room["code"], room["teacher_token"]
    assert len(code) == 6
    assert client.get(f"/api/classes/{code.lower()}").json()["name"] == "Period 3 Econ"

    pitch_sets = []
    for student in ["Ava", "Ben"]:
        game = client.post(
            "/api/games", json={"mode": "class", "class_code": code, "student": student}
        ).json()
        assert game["class_name"] == "Period 3 Econ"
        pitch_sets.append([r["pitch"]["id"] for r in game["rounds"]])
        first = game["rounds"][0]["pitch"]["ask"]
        client.post(
            f"/api/games/{game['id']}/rounds/0/offer",
            json={"amount": first["amount"], "equity": first["equity"], "reason": "team"},
        )
        for i in range(1, 5):
            client.post(f"/api/games/{game['id']}/rounds/{i}/offer", json={"pass": True})
        client.post(f"/api/games/{game['id']}/reveal")
        client.post(f"/api/games/{game['id']}/reveal")  # re-opening must not double count
    assert pitch_sets[0] == pitch_sets[1]  # same companies for the whole class

    assert client.get(f"/api/classes/{code}/dashboard").status_code == 403
    dash = client.get(f"/api/classes/{code}/dashboard", headers={"X-Teacher-Token": token}).json()
    assert [s["student"] for s in dash["students"]].count("Ava") == 1
    assert len(dash["students"]) == 2 and len(dash["company_stats"]) == 5
    assert dash["prompts"]


def test_bad_class_code():
    res = client.post(
        "/api/games", json={"mode": "class", "class_code": "NOPE00", "student": "Zed"}
    )
    assert res.status_code == 404
