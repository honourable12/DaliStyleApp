import uuid
from app.wardrobe.models import User, ClothingItem, Outfit, FeedPost, Comment

def test_get_empty_feed(client):
    # Setup
    client.post("/api/auth/register", json={"email": "empty@test.com", "password": "password123"})
    login_res = client.post("/api/auth/login", data={"username": "empty@test.com", "password": "password123"})
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    response = client.get("/api/social/feed", headers=headers)
    assert response.status_code == 200
    assert response.json() == []

def test_share_outfit_to_feed(client, db):
    # 1. Auth
    client.post("/api/auth/register", json={"email": "share@test.com", "password": "password123"})
    login_res = client.post("/api/auth/login", data={"username": "share@test.com", "password": "password123"})
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}
    
    from app.wardrobe.models import User
    user = db.query(User).filter(User.email == "share@test.com").first()

    # 2. Create items
    item1 = ClothingItem(name="Test Top", category="top", color_primary="#000000", image_url="test1.jpg", owner_id=user.id)
    item2 = ClothingItem(name="Test Bottom", category="bottom", color_primary="#FFFFFF", image_url="test2.jpg", owner_id=user.id)
    db.add_all([item1, item2])
    db.commit()

    # 3. Create Outfit
    outfit_id = uuid.uuid4()
    outfit = Outfit(id=outfit_id, user_id=user.id, occasion="Test Occasion", clothing_ids=[item1.id, item2.id], llm_reason="Reason")
    db.add(outfit)
    db.commit()

    # 4. Share to Feed
    share_data = {
        "outfit_id": str(outfit_id),
        "caption": "Check my new look!"
    }
    response = client.post("/api/social/share", json=share_data, headers=headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Shared to movement feed!"

    # 5. Verify in Feed
    feed_response = client.get("/api/social/feed", headers=headers)
    assert feed_response.status_code == 200
    feed = feed_response.json()
    assert len(feed) == 1
    assert feed[0]["caption"] == "Check my new look!"
    assert feed[0]["user"]["email"] == "share@test.com"

def test_like_post(client, db):
    # 1. Auth
    client.post("/api/auth/register", json={"email": "like@test.com", "password": "password123"})
    login_res = client.post("/api/auth/login", data={"username": "like@test.com", "password": "password123"})
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}
    user = db.query(User).filter(User.email == "like@test.com").first()

    # 2. Setup Post
    post = FeedPost(user_id=user.id, caption="Like me", post_type="outfit")
    db.add(post)
    db.commit()

    # 3. Like
    like_res = client.post(f"/api/social/like/{post.id}", headers=headers)
    assert like_res.status_code == 200
    assert like_res.json()["liked"] is True

    # 4. Verify Feed reflects like
    feed_res = client.get("/api/social/feed", headers=headers)
    assert feed_res.json()[0]["likes_count"] == 1

def test_comment_on_post(client, db):
    # 1. Auth
    client.post("/api/auth/register", json={"email": "comment@test.com", "password": "password123"})
    login_res = client.post("/api/auth/login", data={"username": "comment@test.com", "password": "password123"})
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}
    user = db.query(User).filter(User.email == "comment@test.com").first()

    # 2. Setup Post
    post = FeedPost(user_id=user.id, caption="Comment on me", post_type="outfit")
    db.add(post)
    db.commit()

    # 3. Add Comment
    comment_data = {"content": "So chic!"}
    res = client.post(f"/api/social/posts/{post.id}/comments", json=comment_data, headers=headers)
    assert res.status_code == 200
    assert res.json()["content"] == "So chic!"

    # 4. Verify in Feed
    feed_res = client.get("/api/social/feed", headers=headers)
    assert len(feed_res.json()[0]["comments"]) == 1

def test_delete_comment(client, db):
    # 1. Auth
    client.post("/api/auth/register", json={"email": "del@test.com", "password": "password123"})
    login_res = client.post("/api/auth/login", data={"username": "del@test.com", "password": "password123"})
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}
    user = db.query(User).filter(User.email == "del@test.com").first()

    # 2. Setup Post & Comment
    post = FeedPost(user_id=user.id, caption="Post", post_type="outfit")
    db.add(post)
    db.commit()
    
    comment = Comment(user_id=user.id, post_id=post.id, content="Delete me")
    db.add(comment)
    db.commit()

    # 3. Delete
    res = client.delete(f"/api/social/comments/{comment.id}", headers=headers)
    assert res.status_code == 200
    
    # 4. Verify gone
    feed_res = client.get("/api/social/feed", headers=headers)
    assert len(feed_res.json()[0]["comments"]) == 0
