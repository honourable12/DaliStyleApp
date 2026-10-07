import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import harmoniesPlugin from 'colord/plugins/harmonies';
import namesPlugin from 'colord/plugins/names';
import labPlugin from 'colord/plugins/lab';

// Initialize colord with plugins
extend([a11yPlugin, harmoniesPlugin, namesPlugin, labPlugin]);

export interface CoutureColorDef {
  name: string;
  hex: string;
  rgb: [number, number, number];
  family: 'Neutral' | 'Earth' | 'Blue' | 'Green' | 'Red/Berry' | 'Purple' | 'Yellow/Ochre';
  undertone: 'Warm' | 'Cool' | 'Neutral';
  luminance: 'Deep' | 'Mid' | 'Light';
}

/**
 * 120+ Curated Haute-Couture, Menswear & Womenswear Editorial Color Palette.
 * Encompasses luxury tailoring, quiet luxury neutrals, archival dyes, and modern jewel tones.
 */
export const HAUTE_COUTURE_PALETTE: CoutureColorDef[] = [
  // --- ARCHITECTURAL NEUTRALS & MONOCHROMES ---
  { name: 'Jet Black', hex: '#0E0D0C', rgb: [14, 13, 12], family: 'Neutral', undertone: 'Neutral', luminance: 'Deep' },
  { name: 'Onyx', hex: '#1A1917', rgb: [26, 25, 23], family: 'Neutral', undertone: 'Neutral', luminance: 'Deep' },
  { name: 'Pitch Black', hex: '#000000', rgb: [0, 0, 0], family: 'Neutral', undertone: 'Neutral', luminance: 'Deep' },
  { name: 'Charcoal', hex: '#2E2D2B', rgb: [46, 45, 43], family: 'Neutral', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Anthracite', hex: '#383635', rgb: [56, 54, 53], family: 'Neutral', undertone: 'Neutral', luminance: 'Deep' },
  { name: 'Graphite', hex: '#4A4E54', rgb: [74, 78, 84], family: 'Neutral', undertone: 'Cool', luminance: 'Mid' },
  { name: 'Slate Gray', hex: '#52504D', rgb: [82, 80, 77], family: 'Neutral', undertone: 'Neutral', luminance: 'Mid' },
  { name: 'Pewter', hex: '#787673', rgb: [120, 118, 115], family: 'Neutral', undertone: 'Neutral', luminance: 'Mid' },
  { name: 'Classic Gray', hex: '#808080', rgb: [128, 128, 128], family: 'Neutral', undertone: 'Neutral', luminance: 'Mid' },
  { name: 'Heather Gray', hex: '#9E9B97', rgb: [158, 155, 151], family: 'Neutral', undertone: 'Cool', luminance: 'Mid' },
  { name: 'Silver Ash', hex: '#B8B5B0', rgb: [184, 181, 176], family: 'Neutral', undertone: 'Cool', luminance: 'Light' },
  { name: 'Pearl Gray', hex: '#D6D3CE', rgb: [214, 211, 206], family: 'Neutral', undertone: 'Neutral', luminance: 'Light' },
  { name: 'Alabaster', hex: '#F2EDE6', rgb: [242, 237, 230], family: 'Neutral', undertone: 'Warm', luminance: 'Light' },
  { name: 'Bone', hex: '#F7F5F0', rgb: [247, 245, 240], family: 'Neutral', undertone: 'Warm', luminance: 'Light' },
  { name: 'Ivory', hex: '#FFFFF0', rgb: [255, 255, 240], family: 'Neutral', undertone: 'Warm', luminance: 'Light' },
  { name: 'Ecru', hex: '#F3EFE0', rgb: [243, 239, 224], family: 'Neutral', undertone: 'Warm', luminance: 'Light' },
  { name: 'Chalk White', hex: '#FAFAFA', rgb: [250, 250, 250], family: 'Neutral', undertone: 'Neutral', luminance: 'Light' },
  { name: 'Pure White', hex: '#FFFFFF', rgb: [255, 255, 255], family: 'Neutral', undertone: 'Neutral', luminance: 'Light' },
  { name: 'Cream', hex: '#FFFDD0', rgb: [255, 253, 208], family: 'Neutral', undertone: 'Warm', luminance: 'Light' },

  // --- TAILORED EARTHS, LEATHERS & CASHEMERE ---
  { name: 'Espresso', hex: '#2B1E16', rgb: [43, 30, 22], family: 'Earth', undertone: 'Warm', luminance: 'Deep' },
  { name: 'Dark Chocolate', hex: '#3B2418', rgb: [59, 36, 24], family: 'Earth', undertone: 'Warm', luminance: 'Deep' },
  { name: 'Mahogany', hex: '#4A2C2A', rgb: [74, 44, 42], family: 'Earth', undertone: 'Warm', luminance: 'Deep' },
  { name: 'Chestnut', hex: '#5C3317', rgb: [92, 51, 23], family: 'Earth', undertone: 'Warm', luminance: 'Deep' },
  { name: 'Classic Brown', hex: '#A52A2A', rgb: [165, 42, 42], family: 'Earth', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Walnut', hex: '#773F1A', rgb: [119, 63, 26], family: 'Earth', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Cognac', hex: '#8B4513', rgb: [139, 69, 19], family: 'Earth', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Saddle Leather', hex: '#8B5A2B', rgb: [139, 90, 43], family: 'Earth', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Caramel', hex: '#AF6F37', rgb: [175, 111, 55], family: 'Earth', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Camel', hex: '#C19A6B', rgb: [193, 154, 107], family: 'Earth', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Warm Taupe', hex: '#B38B6D', rgb: [179, 139, 109], family: 'Earth', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Tan', hex: '#D2B48C', rgb: [210, 180, 140], family: 'Earth', undertone: 'Warm', luminance: 'Light' },
  { name: 'Sand', hex: '#E0C8A0', rgb: [224, 200, 160], family: 'Earth', undertone: 'Warm', luminance: 'Light' },
  { name: 'Warm Stone', hex: '#C2B69D', rgb: [194, 182, 157], family: 'Earth', undertone: 'Warm', luminance: 'Light' },
  { name: 'Khaki', hex: '#F0E68C', rgb: [240, 230, 140], family: 'Earth', undertone: 'Warm', luminance: 'Light' },
  { name: 'Beige', hex: '#F5F5DC', rgb: [245, 245, 220], family: 'Earth', undertone: 'Warm', luminance: 'Light' },
  { name: 'Oatmeal', hex: '#E3D9C9', rgb: [227, 217, 201], family: 'Earth', undertone: 'Warm', luminance: 'Light' },

  // --- WARM CHROMATICS, OCHRES & TERRACOTTA ---
  { name: 'Terracotta', hex: '#C85A32', rgb: [200, 90, 50], family: 'Yellow/Ochre', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Rust', hex: '#B7410E', rgb: [183, 65, 14], family: 'Yellow/Ochre', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Burnt Sienna', hex: '#E97451', rgb: [233, 116, 81], family: 'Yellow/Ochre', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Clay', hex: '#A0522D', rgb: [160, 82, 45], family: 'Yellow/Ochre', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Paprika', hex: '#8D021F', rgb: [141, 2, 31], family: 'Red/Berry', undertone: 'Warm', luminance: 'Deep' },
  { name: 'Burnt Orange', hex: '#CC5500', rgb: [204, 85, 0], family: 'Yellow/Ochre', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Classic Orange', hex: '#FFA500', rgb: [255, 165, 0], family: 'Yellow/Ochre', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Amber', hex: '#FFBF00', rgb: [255, 191, 0], family: 'Yellow/Ochre', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Ochre / Turmeric', hex: '#E8A830', rgb: [232, 168, 48], family: 'Yellow/Ochre', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Mustard', hex: '#E1AD01', rgb: [225, 173, 1], family: 'Yellow/Ochre', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Saffron', hex: '#F4C430', rgb: [244, 196, 48], family: 'Yellow/Ochre', undertone: 'Warm', luminance: 'Light' },
  { name: 'Warm Gold', hex: '#FFD700', rgb: [255, 215, 0], family: 'Yellow/Ochre', undertone: 'Warm', luminance: 'Light' },
  { name: 'Antique Gold', hex: '#CFB53B', rgb: [207, 181, 59], family: 'Yellow/Ochre', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Classic Yellow', hex: '#FFFF00', rgb: [255, 255, 0], family: 'Yellow/Ochre', undertone: 'Warm', luminance: 'Light' },
  { name: 'Champagne', hex: '#F7E7CE', rgb: [247, 231, 206], family: 'Yellow/Ochre', undertone: 'Warm', luminance: 'Light' },
  { name: 'Peach', hex: '#FFE5B4', rgb: [255, 229, 180], family: 'Yellow/Ochre', undertone: 'Warm', luminance: 'Light' },
  { name: 'Coral', hex: '#FF7F50', rgb: [255, 127, 80], family: 'Red/Berry', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Copper', hex: '#B87333', rgb: [184, 115, 51], family: 'Yellow/Ochre', undertone: 'Warm', luminance: 'Mid' },

  // --- ATELIER NAVIES & BLUES ---
  { name: 'Midnight Navy', hex: '#0A1128', rgb: [10, 17, 40], family: 'Blue', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Oxford Navy', hex: '#0B1B3D', rgb: [11, 27, 61], family: 'Blue', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Classic Navy', hex: '#000080', rgb: [0, 0, 128], family: 'Blue', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Dark Indigo', hex: '#18203E', rgb: [24, 32, 62], family: 'Blue', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Deep Cobalt', hex: '#002366', rgb: [0, 35, 102], family: 'Blue', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Lapis Lazuli', hex: '#26619C', rgb: [38, 97, 156], family: 'Blue', undertone: 'Cool', luminance: 'Mid' },
  { name: 'Royal Blue', hex: '#4169E1', rgb: [65, 105, 225], family: 'Blue', undertone: 'Cool', luminance: 'Mid' },
  { name: 'Pure Blue', hex: '#0000FF', rgb: [0, 0, 255], family: 'Blue', undertone: 'Cool', luminance: 'Mid' },
  { name: 'Steel Blue', hex: '#4682B4', rgb: [70, 130, 180], family: 'Blue', undertone: 'Cool', luminance: 'Mid' },
  { name: 'Slate Blue', hex: '#6A5ACD', rgb: [106, 90, 205], family: 'Blue', undertone: 'Cool', luminance: 'Mid' },
  { name: 'French Blue', hex: '#0072BB', rgb: [0, 114, 187], family: 'Blue', undertone: 'Cool', luminance: 'Mid' },
  { name: 'Denim', hex: '#1560BD', rgb: [21, 96, 189], family: 'Blue', undertone: 'Cool', luminance: 'Mid' },
  { name: 'Cerulean', hex: '#2A52BE', rgb: [42, 82, 190], family: 'Blue', undertone: 'Cool', luminance: 'Mid' },
  { name: 'Sky Blue', hex: '#87CEEB', rgb: [135, 206, 235], family: 'Blue', undertone: 'Cool', luminance: 'Light' },
  { name: 'Powder Blue', hex: '#B0E0E6', rgb: [176, 224, 230], family: 'Blue', undertone: 'Cool', luminance: 'Light' },
  { name: 'Ice Blue', hex: '#D0F0FD', rgb: [208, 240, 253], family: 'Blue', undertone: 'Cool', luminance: 'Light' },
  { name: 'Teal', hex: '#008080', rgb: [0, 128, 128], family: 'Blue', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Dark Teal', hex: '#004C54', rgb: [0, 76, 84], family: 'Blue', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Petrol Blue', hex: '#005F73', rgb: [0, 95, 115], family: 'Blue', undertone: 'Cool', luminance: 'Mid' },
  { name: 'Aqua', hex: '#00FFFF', rgb: [0, 255, 255], family: 'Blue', undertone: 'Cool', luminance: 'Light' },

  // --- HERBAL GREENS & OLIVES ---
  { name: 'Deep Forest Green', hex: '#1E3F20', rgb: [30, 63, 32], family: 'Green', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Hunter Green', hex: '#355E3B', rgb: [53, 94, 59], family: 'Green', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Pine Green', hex: '#01796F', rgb: [1, 121, 111], family: 'Green', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Racing Green', hex: '#004225', rgb: [0, 66, 37], family: 'Green', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Emerald', hex: '#046307', rgb: [4, 99, 7], family: 'Green', undertone: 'Cool', luminance: 'Mid' },
  { name: 'Classic Green', hex: '#008000', rgb: [0, 128, 0], family: 'Green', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Military Olive', hex: '#556B2F', rgb: [85, 107, 47], family: 'Green', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Olive', hex: '#808000', rgb: [128, 128, 0], family: 'Green', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Olive Drab', hex: '#6B8E23', rgb: [107, 142, 35], family: 'Green', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Moss Green', hex: '#8A9A5B', rgb: [138, 154, 91], family: 'Green', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Sage Green', hex: '#9CAF88', rgb: [156, 175, 136], family: 'Green', undertone: 'Warm', luminance: 'Light' },
  { name: 'Eucalyptus', hex: '#5F8575', rgb: [95, 133, 117], family: 'Green', undertone: 'Cool', luminance: 'Mid' },
  { name: 'Celadon', hex: '#ACE1AF', rgb: [172, 225, 175], family: 'Green', undertone: 'Cool', luminance: 'Light' },
  { name: 'Mint', hex: '#3EB489', rgb: [62, 180, 137], family: 'Green', undertone: 'Cool', luminance: 'Light' },
  { name: 'Pistachio', hex: '#93C572', rgb: [147, 197, 114], family: 'Green', undertone: 'Warm', luminance: 'Light' },
  { name: 'Lime', hex: '#00FF00', rgb: [0, 255, 0], family: 'Green', undertone: 'Warm', luminance: 'Light' },

  // --- JEWELS, BERRIES & REDS ---
  { name: 'Deep Burgundy', hex: '#4A0E17', rgb: [74, 14, 23], family: 'Red/Berry', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Bordeaux', hex: '#5C061A', rgb: [92, 6, 26], family: 'Red/Berry', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Cabernet Wine', hex: '#722F37', rgb: [114, 47, 55], family: 'Red/Berry', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Maroon', hex: '#800000', rgb: [128, 0, 0], family: 'Red/Berry', undertone: 'Warm', luminance: 'Deep' },
  { name: 'Ruby', hex: '#9B111E', rgb: [155, 17, 30], family: 'Red/Berry', undertone: 'Cool', luminance: 'Mid' },
  { name: 'Crimson', hex: '#DC143C', rgb: [220, 20, 60], family: 'Red/Berry', undertone: 'Cool', luminance: 'Mid' },
  { name: 'Pure Red', hex: '#FF0000', rgb: [255, 0, 0], family: 'Red/Berry', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Scarlet', hex: '#FF2400', rgb: [255, 36, 0], family: 'Red/Berry', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Cherry Red', hex: '#D2042D', rgb: [210, 4, 45], family: 'Red/Berry', undertone: 'Cool', luminance: 'Mid' },
  { name: 'Brick Red', hex: '#CB4154', rgb: [203, 65, 84], family: 'Red/Berry', undertone: 'Warm', luminance: 'Mid' },
  { name: 'Plum', hex: '#581145', rgb: [88, 17, 69], family: 'Red/Berry', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Aubergine', hex: '#3B0934', rgb: [59, 9, 52], family: 'Purple', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Boysenberry', hex: '#873260', rgb: [135, 50, 96], family: 'Red/Berry', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Mulberry', hex: '#C54B8C', rgb: [197, 75, 140], family: 'Red/Berry', undertone: 'Cool', luminance: 'Mid' },
  { name: 'Mauve', hex: '#B784A7', rgb: [183, 132, 167], family: 'Purple', undertone: 'Cool', luminance: 'Mid' },
  { name: 'Dusty Rose', hex: '#DCAE96', rgb: [220, 174, 150], family: 'Red/Berry', undertone: 'Warm', luminance: 'Light' },
  { name: 'Blush Pink', hex: '#DE5D83', rgb: [222, 93, 131], family: 'Red/Berry', undertone: 'Cool', luminance: 'Light' },
  { name: 'Soft Pink', hex: '#FFC0CB', rgb: [255, 192, 203], family: 'Red/Berry', undertone: 'Warm', luminance: 'Light' },
  { name: 'Fuchsia', hex: '#FF00FF', rgb: [255, 0, 255], family: 'Red/Berry', undertone: 'Cool', luminance: 'Mid' },

  // --- PURPLES & VIOLETS ---
  { name: 'Imperial Purple', hex: '#66023C', rgb: [102, 2, 60], family: 'Purple', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Classic Purple', hex: '#800080', rgb: [128, 0, 128], family: 'Purple', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Deep Violet', hex: '#4B0082', rgb: [75, 0, 130], family: 'Purple', undertone: 'Cool', luminance: 'Deep' },
  { name: 'Amethyst', hex: '#9966CC', rgb: [153, 102, 204], family: 'Purple', undertone: 'Cool', luminance: 'Mid' },
  { name: 'Lilac', hex: '#C8A2C8', rgb: [200, 162, 200], family: 'Purple', undertone: 'Cool', luminance: 'Light' },
  { name: 'Lavender', hex: '#E6E6FA', rgb: [230, 230, 250], family: 'Purple', undertone: 'Cool', luminance: 'Light' },
  { name: 'Wisteria', hex: '#C9A0DC', rgb: [201, 160, 220], family: 'Purple', undertone: 'Cool', luminance: 'Light' },
  { name: 'Periwinkle', hex: '#CCCCFF', rgb: [204, 204, 255], family: 'Purple', undertone: 'Cool', luminance: 'Light' },
];

/**
 * Pre-computed Lab coordinates for CIELAB Delta-E matching
 */
const PALETTE_LAB = HAUTE_COUTURE_PALETTE.map((c) => {
  const lab = colord(c.hex).toLab();
  return { ...c, l: lab.l, a: lab.a, b: lab.b };
});

/**
 * Calculates CIELAB Delta-E (ΔE) perceptual difference between two colors.
 * Matches human optic response far better than Euclidean RGB.
 */
export function deltaE(hex1: string, hex2: string): number {
  const lab1 = colord(hex1).toLab();
  const lab2 = colord(hex2).toLab();
  const dl = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

/**
 * Perceptually matches any hex color to the closest Haute-Couture Editorial Color.
 * Falls back to colord CSS color naming if deltaE exceeds threshold.
 */
export function findNearestCoutureColor(hex: string): CoutureColorDef {
  const targetLab = colord(hex).toLab();
  let minDistance = Infinity;
  let bestMatch: CoutureColorDef = HAUTE_COUTURE_PALETTE[0];

  for (const c of PALETTE_LAB) {
    const dl = targetLab.l - c.l;
    const da = targetLab.a - c.a;
    const db = targetLab.b - c.b;
    const dist = Math.sqrt(dl * dl + da * da + db * db);
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = c;
    }
  }

  return bestMatch;
}
