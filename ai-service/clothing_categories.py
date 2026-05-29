CONFIDENCE_THRESHOLD = 0.65

CLOTHING_CATEGORIES = [
    "t-shirt", "shirt", "sweater", "hoodie", "jacket", "coat",
    "trousers", "jeans", "shorts", "skirt", "dress",
    "sneakers", "boots", "formal shoes", "sandals",
    "belt", "hat", "cap", "scarf", "handbag", "sunglasses"
]

CLOTHING_PATTERNS = [
    "solid", "striped", "checkered", "floral", "polka dot", "graphic print", "camouflage", "leopard print"
]

CATEGORY_GROUPS = {
    "t-shirt": "top", "shirt": "top", "sweater": "top", "hoodie": "top",
    "jacket": "outerwear", "coat": "outerwear",
    "trousers": "bottom", "jeans": "bottom", "shorts": "bottom",
    "skirt": "bottom", "dress": "full-body",
    "sneakers": "shoes", "boots": "shoes", "formal shoes": "shoes", "sandals": "shoes",
    "belt": "accessory", "hat": "accessory", "cap": "accessory", 
    "scarf": "accessory", "handbag": "accessory", "sunglasses": "accessory"
}

CLOTHING_YOLO_CLASSES = [0, 24, 26, 27, 28]

COLOR_NAMES = [
    ("Black", (0, 0, 0)),
    ("White", (255, 255, 255)),
    ("Gray", (128, 128, 128)),
    ("Red", (255, 0, 0)),
    ("Maroon", (128, 0, 0)),
    ("Yellow", (255, 255, 0)),
    ("Olive", (128, 128, 0)),
    ("Lime", (0, 255, 0)),
    ("Green", (0, 128, 0)),
    ("Aqua", (0, 255, 255)),
    ("Teal", (0, 128, 128)),
    ("Blue", (0, 0, 255)),
    ("Navy", (0, 0, 128)),
    ("Fuchsia", (255, 0, 255)),
    ("Purple", (128, 0, 128)),
    ("Orange", (255, 165, 0)),
    ("Brown", (165, 42, 42)),
    ("Tan", (210, 180, 140)),
    ("Pink", (255, 192, 203)),
    ("Gold", (255, 215, 0)),
    ("Beige", (245, 245, 220)),
    ("Ivory", (255, 255, 240)),
    ("Khaki", (240, 230, 140)),
    ("Lavender", (230, 230, 250)),
]
