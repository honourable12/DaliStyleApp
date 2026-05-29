import io
from PIL import Image


def get_valid_image_bytes():
    img = Image.new("RGB", (10, 10), color="red")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


VALID_IMAGE = get_valid_image_bytes()


def test_user_upload_item(client):
    # Register and login user
    client.post(
        "/auth/register", json={"email": "user@test.com", "password": "password123"}
    )
    login_res = client.post(
        "/auth/login", data={"username": "user@test.com", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload item
    # Correct format: (filename, content, content_type)
    file = ("test.jpg", VALID_IMAGE, "image/jpeg")

    response = client.post(
        "/wardrobe/upload",
        headers=headers,
        data={"name": "Test Shirt", "category": "Tops"},
        files={"file": file},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Shirt"
    assert "id" in data


def test_list_items_filtering(client):
    # Setup Partner and User
    client.post(
        "/auth/partner/register",
        json={"name": "P1", "email": "p1@test.com", "password": "password123"},
    )
    p_login = client.post(
        "/auth/partner/login",
        data={"username": "p1@test.com", "password": "password123"},
    )
    p_token = p_login.json()["access_token"]

    # Create Partner API Key
    p_key_res = client.post(
        "/auth/partner/keys",
        json={"name": "K1"},
        headers={"Authorization": f"Bearer {p_token}"},
    )
    p_api_key = p_key_res.json()["api_key"]

    # Setup User
    client.post(
        "/auth/register", json={"email": "u1@test.com", "password": "password123"}
    )
    u_login = client.post(
        "/auth/login", data={"username": "u1@test.com", "password": "password123"}
    )
    u_token = u_login.json()["access_token"]
    u_headers = {"Authorization": f"Bearer {u_token}"}

    # 1. Upload item WITHOUT partner
    client.post(
        "/wardrobe/upload",
        headers=u_headers,
        data={"name": "No Partner"},
        files={"file": ("1.jpg", VALID_IMAGE, "image/jpeg")},
    )

    # 2. Upload item WITH partner
    client.post(
        "/wardrobe/upload",
        headers={**u_headers, "X-Partner-Key": p_api_key},
        data={"name": "With Partner"},
        files={"file": ("2.jpg", VALID_IMAGE, "image/jpeg")},
    )

    # 3. List all items (no partner header) -> should see 2 items
    list_all = client.get("/wardrobe/items", headers=u_headers)
    assert len(list_all.json()) == 2

    # 4. List items with partner filter -> should see only 1 item
    list_filtered = client.get(
        "/wardrobe/items", headers={**u_headers, "X-Partner-Key": p_api_key}
    )
    assert len(list_filtered.json()) == 1
    assert list_filtered.json()[0]["name"] == "With Partner"


def test_bulk_upload(client):
    client.post(
        "/auth/register", json={"email": "bulk@test.com", "password": "password123"}
    )
    u_login = client.post(
        "/auth/login", data={"username": "bulk@test.com", "password": "password123"}
    )
    u_headers = {"Authorization": f"Bearer {u_login.json()['access_token']}"}

    files = [
        ("files", ("img1.jpg", VALID_IMAGE, "image/jpeg")),
        ("files", ("img2.jpg", VALID_IMAGE, "image/jpeg")),
    ]

    response = client.post("/wardrobe/upload-bulk", headers=u_headers, files=files)
    assert response.status_code == 200
    assert len(response.json()) == 2
    assert response.json()[0]["name"] == "img1"
