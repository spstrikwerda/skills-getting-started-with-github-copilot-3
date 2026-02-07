from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

import src.app as app_module

client = TestClient(app_module.app)


@pytest.fixture(autouse=True)
def reset_activities():
    original = deepcopy(app_module.activities)
    yield
    app_module.activities.clear()
    app_module.activities.update(original)


def test_get_activities_returns_data():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_adds_participant():
    email = "new.student@mergington.edu"
    response = client.post(
        "/activities/Chess%20Club/signup",
        params={"email": email},
    )
    assert response.status_code == 200
    assert email in app_module.activities["Chess Club"]["participants"]


def test_signup_duplicate_participant():
    email = app_module.activities["Chess Club"]["participants"][0]
    response = client.post(
        "/activities/Chess%20Club/signup",
        params={"email": email},
    )
    assert response.status_code == 400


def test_unregister_participant():
    email = app_module.activities["Chess Club"]["participants"][0]
    response = client.delete(
        "/activities/Chess%20Club/signup",
        params={"email": email},
    )
    assert response.status_code == 200
    assert email not in app_module.activities["Chess Club"]["participants"]


def test_unregister_missing_participant():
    response = client.delete(
        "/activities/Chess%20Club/signup",
        params={"email": "missing@mergington.edu"},
    )
    assert response.status_code == 404


def test_signup_unknown_activity():
    response = client.post(
        "/activities/Unknown%20Club/signup",
        params={"email": "student@mergington.edu"},
    )
    assert response.status_code == 404
