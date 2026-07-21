/**
 * Stylora Headless SDK
 * A lightweight wrapper for the Stylora Styling Engine.
 */
class StyloraSDK {
  /**
   * @param {string} apiKey - Your Stylora API key
   * @param {string} baseUrl - The URL of the Stylora API
   */
  constructor(apiKey, baseUrl = "https://api.dailystyle.app") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * Get a styling recommendation for a specific wardrobe and user profile.
   * @param {Object} options 
   * @param {Array} options.wardrobe - List of clothing items
   * @param {string} options.skinType - User skin type (e.g. "Warm Autumn")
   * @param {string} [options.skinHex="#d7bd96"] - User skin hex code
   * @param {string} [options.monkLabel="MST-5"] - Monk scale label
   * @param {string} [options.vibe="Casual"] - "Casual", "Professional", or "Elegant"
   * @param {string} [options.persona="Minimalist"] - "Minimalist", "Bold", or "Old Money"
   * @param {number} [options.lat] - Geolocation latitude
   * @param {number} [options.lon] - Geolocation longitude
   */
  async getDailyLook(options) {
    const response = await fetch(`${this.baseUrl}/style/engine/look`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Partner-Key": this.apiKey,
      },
      body: JSON.stringify({
        wardrobe: options.wardrobe,
        skin_type: options.skinType,
        skin_hex: options.skinHex || "#d7bd96",
        monk_label: options.monkLabel || "MST-5",
        style_persona: options.persona || "Minimalist",
        vibe: options.vibe || "Casual",
        lat: options.lat,
        lon: options.lon
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch daily look");
    }

    return await response.json();
  }

  /**
   * Analyze a clothing image for category and color.
   * @param {File|Blob} file - The image file to analyze
   */
  async analyzeClothing(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${this.baseUrl}/wardrobe/engine/analyze-clothing`, {
      method: "POST",
      headers: {
        "X-Partner-Key": this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Clothing analysis failed");
    }

    return await response.json();
  }

  /**
   * Analyze a selfie for skin tone (Monk Scale).
   * @param {File|Blob} file - The selfie image file
   */
  async analyzeSkin(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${this.baseUrl}/wardrobe/engine/analyze-skin`, {
      method: "POST",
      headers: {
        "X-Partner-Key": this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Skin analysis failed");
    }

    return await response.json();
  }
}

// Export for various environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = DailyStyleSDK;
} else {
  window.DailyStyleSDK = DailyStyleSDK;
}
