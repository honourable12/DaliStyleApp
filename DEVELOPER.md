# Stylora Developer Guide: Headless Integration

Welcome to the Stylora Styling Engine. This guide will help you integrate our AI-powered stylist into your own fashion store application.

## 1. Quick Start with the JS SDK

We provide a lightweight, zero-dependency JavaScript SDK to handle communication with our engine.

### Installation
You can host the `daily-style-sdk.js` yourself or include it directly:
```html
<script src="https://api.dailystyle.app/static/daily-style-sdk.js"></script>
```

### Basic Usage
```javascript
const sdk = new DailyStyleSDK("your_ds_live_api_key");

const myWardrobe = [
  { id: "p1", name: "White Linen Shirt", category: "shirt", color_primary: "#FFFFFF", image_url: "..." },
  { id: "p2", name: "Navy Chinos", category: "trousers", color_primary: "#000080", image_url: "..." }
];

async function getDailyRecommendation() {
  try {
    const look = await sdk.getDailyLook({
      wardrobe: myWardrobe,
      skinType: "Neutral",
      vibe: "Professional",
      persona: "Minimalist"
    });
    
    console.log("Stylist Note:", look.stylist_note);
    console.log("Top Item:", look.top.name);
    console.log("Bottom Item:", look.bottom.name);
  } catch (err) {
    console.error("Styling Error:", err.message);
  }
}

// 2. AI Analysis Features
async function analyzeNewItem(file) {
  const result = await sdk.analyzeClothing(file);
  console.log("AI Detected Category:", result.category);
  console.log("AI Detected Color:", result.primary_color);
}

async function analyzeUserSkin(file) {
  const result = await sdk.analyzeSkin(file);
  console.log("Monk Scale Label:", result.monk_label);
}
```

---

## 2. API Reference (REST)

### Styling Recommendation
**Endpoint:** `POST /style/engine/look`
... (existing styling docs) ...

### Clothing Analysis
**Endpoint:** `POST /wardrobe/engine/analyze-clothing`
**Header:** `X-Partner-Key: your_api_key`
**Body:** `multipart/form-data` with `file`

**Response:**
```json
{
  "category": "shirt",
  "pattern": "solid",
  "primary_color": "#FFFFFF",
  "is_clothing": true,
  "processed_image_b64": "...", 
  "detections": [
    {
      "category": "shirt",
      "pattern": "solid",
      "primary_color": "#FFFFFF",
      "processed_image_b64": "...",
      "category_confidence": 0.98,
      "pattern_confidence": 0.95
    }
  ]
}
```

### Find Matching Clothing
**Endpoint:** `POST /wardrobe/engine/find-clothing`
**Header:** `X-Partner-Key: your_api_key`
**Body:** `multipart/form-data` with `file`

**Response:**
```json
{
  "detections": [
    {
      "analysis": {
        "category": "shirt",
        "pattern": "solid",
        "primary_color": "#FFFFFF"
      },
      "found_images": ["url1", "url2", "url3"]
    }
  ],
  "count": 1,
  "message": "Identified 1 items and found corresponding high-quality images."
}
```

### Skin Tone Analysis
**Endpoint:** `POST /wardrobe/engine/analyze-skin`
**Header:** `X-Partner-Key: your_api_key`
**Body:** `multipart/form-data` with `file`

**Response:**
```json
{
  "monk_label": "MST-5",
  "skin_type": "Warm Autumn",
  "hex": "#d7bd96"
}
```

---

## 3. Best Practices for Partners

### Image URLs
Ensure the `image_url` you provide in the wardrobe list is a **publicly accessible URL**. Our engine needs to be able to fetch these images if you are using our white-labeled UI components or if the AI service needs to re-analyze textures.

### Geolocation
Providing `lat` and `lon` is highly recommended. It allows the engine to fetch real-time weather data for the user's current location, making the styling advice significantly more relevant.

### Custom Weights
If you want to prioritize specific inventory (e.g., your own brand's items or a new collection), contact us to update your **Partner Settings**. We can apply a global "Boost" to any items matching your criteria within your unique API namespace.

---

## 4. Database Migrations (Alembic)

We use **Alembic** for managing database schema changes. This ensures that all environments (development, staging, production) stay in sync.

### Running Migrations
To apply the latest schema changes to your database, run the following command from the `backend` directory:
```bash
alembic upgrade head
```

### Creating New Migrations
If you modify any SQLAlchemy models in `app/wardrobe/models.py`, you must generate a new migration:
```bash
alembic revision --autogenerate -m "Description of your changes"
```
Always review the generated migration file in `alembic/versions/` before applying it.

---

## Support
For technical issues or custom integration requests, please contact `api-support@dailystyle.app`.
