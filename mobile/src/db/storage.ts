import { WardrobeItem, UserStyleProfile, OutfitRecommendation, ClothingCategory, AuthUser } from '../types';

export const DEFAULT_USER_PROFILE: UserStyleProfile = {
  id: 'user-default-1',
  monkLabel: 'MST-6',
  skinHex: '#a07850',
  skinName: 'Medium Dark',
  persona: 'Minimalist',
  locationName: 'Accra',
};

// Initial offline items with verified reliable CDN endpoints and instant visual fallbacks
export const INITIAL_WARDROBE: WardrobeItem[] = [
  {
    id: 'w-1',
    name: 'Ochre Turmeric Overshirt',
    category: 'top',
    primaryColor: '#E8A830', // Turmeric
    primaryColorName: 'Rust / Turmeric',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'w-2',
    name: 'Pleated Raw Wool Trousers',
    category: 'bottom',
    primaryColor: '#1A1917', // Ash / Charcoal
    primaryColorName: 'Charcoal',
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'w-3',
    name: 'Minimalist Poplin Shirt',
    category: 'top',
    primaryColor: '#F2EDE6', // Cream
    primaryColorName: 'Cream',
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'w-4',
    name: 'Tailored Indigo Denim',
    category: 'bottom',
    primaryColor: '#141E30', // Deep Indigo
    primaryColorName: 'Navy',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: 'w-5',
    name: 'Wool Trench Coat',
    category: 'outerwear',
    primaryColor: '#825C43', // Deep Camel
    primaryColorName: 'Brown',
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'w-6',
    name: 'Derby Leather Shoes',
    category: 'shoes',
    primaryColor: '#1A1917',
    primaryColorName: 'Black',
    imageUrl: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 86400000 * 10,
  },
];

export const INITIAL_LOOKBOOK: OutfitRecommendation[] = [
  {
    id: 'seed-look-1',
    items: [INITIAL_WARDROBE[0], INITIAL_WARDROBE[1], INITIAL_WARDROBE[5]],
    harmonyScore: 94,
    skinContrastScore: 88,
    weatherAppropriate: true,
    weatherType: 'Clear',
    harmonyType: 'Analogous',
    stylingNote: 'Warm ochre turmeric overshirt grounded by tailored raw wool trousers and classic leather derbies.',
    savedInLookbook: true,
  },
  {
    id: 'seed-look-2',
    items: [INITIAL_WARDROBE[2], INITIAL_WARDROBE[3], INITIAL_WARDROBE[4]],
    harmonyScore: 91,
    skinContrastScore: 82,
    weatherAppropriate: true,
    weatherType: 'Cold',
    harmonyType: 'Complementary',
    stylingNote: 'Crisp poplin shirt contrasted against deep indigo denim, layered beneath a structured wool trench.',
    savedInLookbook: true,
  },
];

function normalizeCategory(cat: string): ClothingCategory {
  const c = String(cat || '').toLowerCase();
  if (['top', 'shirt', 't-shirt', 'sweater', 'hoodie', 'blouse'].some((k) => c.includes(k))) return 'top';
  if (['bottom', 'trousers', 'pants', 'jeans', 'shorts', 'skirt'].some((k) => c.includes(k))) return 'bottom';
  if (['outerwear', 'jacket', 'coat', 'blazer', 'cardigan'].some((k) => c.includes(k))) return 'outerwear';
  if (['shoes', 'sneakers', 'boots', 'derby', 'loafers'].some((k) => c.includes(k))) return 'shoes';
  return 'accessory';
}

class LocalWardrobeStore {
  private wardrobe: WardrobeItem[] = [...INITIAL_WARDROBE];
  private profile: UserStyleProfile = { ...DEFAULT_USER_PROFILE };
  private lookbook: OutfitRecommendation[] = [...INITIAL_LOOKBOOK];
  private hasCompletedOnboarding: boolean = false;
  private currentUser: AuthUser | null = null;

  getItems(): WardrobeItem[] {
    return [...this.wardrobe];
  }

  addItem(item: WardrobeItem): void {
    this.wardrobe.unshift(item);
  }

  setItems(items: WardrobeItem[]): void {
    this.wardrobe = [...items];
  }

  removeItem(id: string): void {
    this.wardrobe = this.wardrobe.filter((i) => i.id !== id);
  }

  getProfile(): UserStyleProfile {
    return { ...this.profile };
  }

  updateProfile(newProfile: Partial<UserStyleProfile>): void {
    this.profile = { ...this.profile, ...newProfile };
  }

  getLookbook(): OutfitRecommendation[] {
    return [...this.lookbook];
  }

  saveToLookbook(outfit: OutfitRecommendation): void {
    if (!this.lookbook.some((o) => o.id === outfit.id)) {
      this.lookbook.unshift({ ...outfit, savedInLookbook: true });
    }
  }

  removeFromLookbook(id: string): void {
    this.lookbook = this.lookbook.filter((o) => o.id !== id);
  }

  getHasCompletedOnboarding(): boolean {
    return this.hasCompletedOnboarding;
  }

  setHasCompletedOnboarding(completed: boolean): void {
    this.hasCompletedOnboarding = completed;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser ? { ...this.currentUser } : null;
  }

  setCurrentUser(user: AuthUser | null): void {
    this.currentUser = user ? { ...user } : null;
  }

  logout(): void {
    this.currentUser = null;
  }

  /**
   * Attempts to sync items from the live FastAPI backend server
   */
  async syncWithBackend(baseUrl = 'http://10.0.2.2:8000'): Promise<{ count: number; error?: string }> {
    try {
      const endpoints = [
        `${baseUrl}/api/wardrobe/items`,
        `${baseUrl}/wardrobe/items`,
        'http://localhost:8000/api/wardrobe/items',
      ];

      let data: any[] | null = null;
      let activeHost = baseUrl;

      for (const ep of endpoints) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3000);
          const res = await fetch(ep, { signal: controller.signal });
          clearTimeout(timeout);
          if (res.ok) {
            data = await res.json();
            activeHost = ep.split('/api')[0].split('/wardrobe')[0];
            break;
          }
        } catch {
          // try next endpoint
        }
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        return { count: 0, error: 'No live items returned from backend. Using local wardrobe.' };
      }

      const liveItems: WardrobeItem[] = data.map((raw: any) => {
        let img = raw.image_url || '';
        if (img && !img.startsWith('http')) {
          img = `${activeHost}/static/${img.replace(/^users\//, 'users/')}`;
        }
        return {
          id: String(raw.id || `live-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
          name: raw.name || 'Tailored Garment',
          category: normalizeCategory(raw.category),
          primaryColor: raw.color_primary && raw.color_primary !== 'unknown' ? raw.color_primary : '#1A1917',
          primaryColorName: raw.color_primary_name || 'Neutral',
          imageUrl: img,
          pattern: raw.pattern || 'solid',
          createdAt: Date.now(),
        };
      });

      this.wardrobe = liveItems;
      return { count: liveItems.length };
    } catch (e: any) {
      return { count: 0, error: e.message || 'Sync failed' };
    }
  }
}

export const wardrobeStore = new LocalWardrobeStore();
