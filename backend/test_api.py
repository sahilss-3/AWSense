from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_all():
    print("Testing GET / ...")
    r = client.get("/")
    assert r.status_code == 200, r.text
    print("Root OK:", r.json()["project"])

    print("Testing GET /api/system/status ...")
    r = client.get("/api/system/status")
    assert r.status_code == 200, r.text
    print("System status OK:", r.json()["overall_reliability"])

    print("Testing GET /api/stations ...")
    r = client.get("/api/stations")
    assert r.status_code == 200, r.text
    print("Stations count:", len(r.json()))
    assert len(r.json()) == 8

    print("Testing GET /api/readings/AWS-PUN-01 ...")
    r = client.get("/api/readings/AWS-PUN-01")
    assert r.status_code == 200, r.text
    print("Readings count:", len(r.json()))

    print("Testing GET /api/anomalies ...")
    r = client.get("/api/anomalies")
    assert r.status_code == 200, r.text
    print("Anomalies count:", len(r.json()))

    print("Testing GET /api/alerts ...")
    r = client.get("/api/alerts")
    assert r.status_code == 200, r.text
    print("Alerts count:", len(r.json()))

    print("Testing GET /api/sensor-health ...")
    r = client.get("/api/sensor-health")
    assert r.status_code == 200, r.text
    print("Sensor health count:", len(r.json()))

    print("Testing GET /api/insights ...")
    r = client.get("/api/insights")
    assert r.status_code == 200, r.text
    print("Insights count:", len(r.json()))

    print("Testing GET /api/reports ...")
    r = client.get("/api/reports")
    assert r.status_code == 200, r.text
    print("Reports OK, data reliability:", r.json()["data_reliability"])

    print("Testing POST /api/simulation/trigger with sudden_spike ...")
    r = client.post("/api/simulation/trigger", json={"scenario_id": "sudden_spike", "station_id": "AWS-PUN-01"})
    assert r.status_code == 200, r.text
    sim = r.json()
    print("Simulation Spike Result:", sim["classification"], "Confidence:", sim["confidence"], "Observed:", sim["observed_value"], "Expected:", sim["expected_value"])

    print("Testing POST /api/simulation/trigger with genuine_heat_event ...")
    r = client.post("/api/simulation/trigger", json={"scenario_id": "genuine_heat_event", "station_id": "AWS-PUN-01"})
    assert r.status_code == 200, r.text
    sim_gen = r.json()
    print("Simulation Genuine Result:", sim_gen["classification"], "is_genuine_event:", sim_gen["is_genuine_event"])

    print("ALL API AND AI TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_all()
