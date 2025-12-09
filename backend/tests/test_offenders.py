def test_create_offender(client):
    response = client.post(
        "/offenders/",
        json={
            "first_name": "John",
            "last_name": "Doe",
            "badge_id": "12345",
            "dob": "1985-05-15",
            "gender": "Male",
            "risk_level": "High",
            "address_line_1": "123 Main St",
            "city": "Phoenix",
            "state": "AZ",
            "zip_code": "85001",
            "start_date": "2023-01-01"
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["last_name"] == "Doe"
    assert "offender_id" in data

def test_get_offenders_pagination(client, test_offender):
    # test_offender fixture creates 1 offender
    response = client.get("/offenders/?page=1&limit=10")
    assert response.status_code == 200
    data = response.json()
    
    # Assert new schema structure
    assert "data" in data
    assert "total" in data
    assert data["total"] >= 1
    assert len(data["data"]) >= 1
    assert data["data"][0]["badgeId"] == "TST-001"
