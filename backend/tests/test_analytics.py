from app.auth.utils import create_password_reset_token


def test_api_usage_logging(client, db):
    # Setup Partner and API Key
    client.post(
        "/auth/partner/register",
        json={
            "name": "Analytics Partner",
            "email": "ana@test.com",
            "password": "password123",
        },
    )
    p_login = client.post(
        "/auth/partner/login",
        data={"username": "ana@test.com", "password": "password123"},
    )
    p_token = p_login.json()["access_token"]

    p_key_res = client.post(
        "/auth/partner/keys",
        json={"name": "K1"},
        headers={"Authorization": f"Bearer {p_token}"},
    )
    p_api_key = p_key_res.json()["api_key"]

    # 1. Trigger some engine requests (which are caught by middleware)
    client.post(
        "/style/engine/look",
        headers={"X-Partner-Key": p_api_key},
        json={"wardrobe": [], "skin_type": "Warm"},
    )
    client.post(
        "/wardrobe/engine/analyze-clothing",
        headers={"X-Partner-Key": p_api_key},
        files={"file": ("t.jpg", b"1", "image/jpeg")},
    )

    # 2. Check analytics
    res = client.get(
        "/auth/partner/analytics", headers={"Authorization": f"Bearer {p_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_requests"] >= 2
    assert "average_latency_ms" in data
    assert "error_rate_percent" in data


def test_partner_password_recovery(client, db):
    email = "recover@test.com"
    client.post(
        "/auth/partner/register",
        json={"name": "Recover", "email": email, "password": "old_password123"},
    )

    # 1. Request forgot password
    res = client.post("/auth/partner/forgot-password", json={"email": email})
    assert res.status_code == 200

    # 2. Since we can't easily read the printed token from logs in tests,
    # we'll generate a valid reset token manually using the same logic to test the reset endpoint
    reset_token = create_password_reset_token(data={"sub": email, "role": "partner"})

    # 3. Reset password
    new_pw = "new_password123"
    reset_res = client.post(
        "/auth/partner/reset-password",
        json={"token": reset_token, "new_password": new_pw},
    )
    assert reset_res.status_code == 200

    # 4. Verify login with new password
    login_res = client.post(
        "/auth/partner/login", data={"username": email, "password": new_pw}
    )
    assert login_res.status_code == 200
