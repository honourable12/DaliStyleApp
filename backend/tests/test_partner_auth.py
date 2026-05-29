def test_partner_registration(client):
    response = client.post(
        "/auth/partner/register",
        json={
            "name": "Test Partner",
            "email": "partner@test.com",
            "password": "password123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Partner"
    assert data["email"] == "partner@test.com"
    assert "id" in data


def test_partner_login(client):
    # Register first
    client.post(
        "/auth/partner/register",
        json={
            "name": "Login Partner",
            "email": "login@test.com",
            "password": "password123",
        },
    )

    # Login
    response = client.post(
        "/auth/partner/login",
        data={"username": "login@test.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_api_key_lifecycle(client):
    # Register and login
    client.post(
        "/auth/partner/register",
        json={
            "name": "Key Partner",
            "email": "key@test.com",
            "password": "password123",
        },
    )
    login_res = client.post(
        "/auth/partner/login",
        data={"username": "key@test.com", "password": "password123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Key
    create_res = client.post(
        "/auth/partner/keys",
        json={"name": "Test Production Key", "type": "production"},
        headers=headers,
    )
    assert create_res.status_code == 200
    key_data = create_res.json()
    assert key_data["name"] == "Test Production Key"
    assert "api_key" in key_data
    assert key_data["api_key"].startswith("ds_live_")
    key_id = key_data["id"]

    # 2. List Keys
    list_res = client.get("/auth/partner/keys", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1
    assert any(k["id"] == key_id for k in list_res.json())

    # 3. Toggle Key (Disable)
    toggle_res = client.patch(
        f"/auth/partner/keys/{key_id}?is_active=false", headers=headers
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_active"] is False

    # 4. Delete Key
    delete_res = client.delete(f"/auth/partner/keys/{key_id}", headers=headers)
    assert delete_res.status_code == 200

    # Verify deletion
    list_after = client.get("/auth/partner/keys", headers=headers)
    assert not any(k["id"] == key_id for k in list_after.json())
