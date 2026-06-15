import pytest
from fastapi.testclient import TestClient
import numpy as np
import cv2
import io
import base64
from unittest.mock import patch, MagicMock

# Import the app and core functions
from main import app
from clothing import calculate_cleanliness_score, find_better_image_query

client = TestClient(app)

def create_dummy_image(color=(255, 255, 255), size=(100, 100)):
    """Creates a dummy image in bytes."""
    img = np.full((size[1], size[0], 3), color, dtype=np.uint8)
    _, buffer = cv2.imencode(".jpg", img)
    return buffer.tobytes()

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_cleanliness_score():
    # Test a perfectly clean (white) image
    white_img = np.full((100, 100, 3), 255, dtype=np.uint8)
    score_clean = calculate_cleanliness_score(white_img)
    assert score_clean > 0.8

    # Test a "messy" image (random noise)
    messy_img = np.random.randint(0, 256, (100, 100, 3), dtype=np.uint8)
    score_messy = calculate_cleanliness_score(messy_img)
    assert score_messy < score_clean

def test_find_better_image_query():
    query = find_better_image_query("Shirt", "Blue", "Striped")
    assert "Blue" in query
    assert "Striped" in query
    assert "Shirt" in query
    assert "high quality" in query

@patch("main.analyze_clothing_fast")
def test_analyze_clothing_fast_endpoint(mock_analyze):
    mock_analyze.return_value = {
        "is_clothing": True,
        "is_clean_background": True,
        "primary_color": "#ffffff",
        "primary_name": "White",
        "rough_category": "T-Shirt"
    }
    
    img_bytes = create_dummy_image()
    response = client.post(
        "/analyze-clothing-fast",
        files={"file": ("test.jpg", img_bytes, "image/jpeg")}
    )
    
    assert response.status_code == 200
    assert response.json()["is_clothing"] is True
    assert response.json()["primary_name"] == "White"

@patch("main.analyze_clothing_heavy")
def test_analyze_clothing_heavy_endpoint(mock_analyze):
    mock_analyze.return_value = [{
        "category": "Jacket",
        "category_confidence": 0.95,
        "pattern": "solid",
        "processed_image_b64": "dummy_base64"
    }]
    
    img_bytes = create_dummy_image()
    response = client.post(
        "/analyze-clothing-heavy",
        files={"file": ("test.jpg", img_bytes, "image/jpeg")}
    )
    
    assert response.status_code == 200
    assert response.json()["count"] == 1
    assert response.json()["detections"][0]["category"] == "Jacket"

@patch("main.find_best_clean_replacement")
@patch("main.analyze_clothing_fast")
@patch("main.analyze_clothing_heavy")
def test_find_clean_replacement_endpoint(mock_heavy, mock_fast, mock_replacement):
    # Mock fast analysis to say it's NOT clean (triggering replacement search)
    mock_fast.return_value = {"is_clean_background": False, "is_clothing": True}
    
    # Mock heavy analysis to identify the item
    mock_heavy.return_value = [{
        "category": "Dress",
        "primary_name": "Red",
        "pattern": "solid"
    }]
    
    # Mock find_best_clean_replacement
    mock_replacement.return_value = {
        "image_b64": "clean_base64",
        "url": "http://example.com/clean.jpg",
        "score": 0.9
    }
    
    img_bytes = create_dummy_image(color=(100, 100, 100)) # Messy original
    response = client.post(
        "/find-clean-replacement",
        files={"file": ("messy.jpg", img_bytes, "image/jpeg")}
    )
    
    assert response.status_code == 200
    assert response.json()["status"] == "replaced"
    assert "replacement" in response.json()
    assert "image_b64" in response.json()["replacement"]

@patch("main.analyze_skin_tone")
def test_analyze_skin_endpoint(mock_skin):
    mock_skin.return_value = {
        "skin_type": "MST 05",
        "hex": "#8d5524",
        "confidence": 0.88
    }
    
    img_bytes = create_dummy_image()
    response = client.post(
        "/analyze-skin",
        files={"file": ("face.jpg", img_bytes, "image/jpeg")}
    )
    
    assert response.status_code == 200
    assert response.json()["skin_type"] == "MST 05"
