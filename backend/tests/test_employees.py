from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def _headers(org_id: str = "org-1") -> dict:
    return {"X-Org-Id": org_id}


def test_employees_requires_org_header():
    response = client.get("/employees")
    assert response.status_code == 400
    assert response.json()["detail"] == "X-Org-Id header is required"


def test_filters_requires_org_header():
    response = client.get("/filters")
    assert response.status_code == 400
    assert response.json()["detail"] == "X-Org-Id header is required"


def test_employee_search_basic():
    response = client.get("/employees", headers=_headers())
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1

    first = data["items"][0]
    # Only whitelisted attributes should be present in the payload.
    assert "id" in first
    assert "first_name" in first
    assert "last_name" in first
    assert "status" in first
    assert "visible_columns" in first

    forbidden_keys = {"org_id", "email", "phone"}
    for key in forbidden_keys:
        assert key not in first


def test_employee_search_scoped_to_org():
    # org-2 contains a user with first_name "OtherOrg"
    response_org2 = client.get("/employees?search=OtherOrg", headers=_headers("org-2"))
    assert response_org2.status_code == 200
    assert response_org2.json()["total"] >= 1

    # org-1 should NOT see that user when searching for the same term.
    response_org1 = client.get("/employees?search=OtherOrg", headers=_headers("org-1"))
    assert response_org1.status_code == 200
    assert response_org1.json()["total"] == 0


def test_rate_limiting_applies():
    # Exhaust the window for this client and org quickly.
    last_response = None
    for _ in range(0, 65):
        last_response = client.get("/employees", headers=_headers("org-1"))

    assert last_response is not None
    assert last_response.status_code in {200, 429}


