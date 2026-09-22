import { WardrobeItem, UserStyleProfile, OutfitRecommendation } from '../types';

export const DEFAULT_USER_PROFILE: UserStyleProfile = {
  id: 'user-default-1',
  monkLabel: 'MST-6',
  skinHex: '#a07850',
  skinName: 'Medium Dark',
  persona: 'Minimalist',
  locationName: 'Accra',
};

export const INITIAL_WARDROBE: WardrobeItem[] = [
  {
    id: 'w-1',
    name: 'Structured Linen Overshirt',
    category: 'top',
    primaryColor: '#E8A830', // Turmeric
    primaryColorName: 'Rust / Turmeric',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'w-2',
    name: 'Pleated Raw Wool Trousers',
    category: 'bottom',
    primaryColor: '#1A1917', // Ash / Charcoal
    primaryColorName: 'Charcoal',
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=400&q=80',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'w-3',
    name: 'Minimalist Poplin Shirt',
    category: 'top',
    primaryColor: '#F2EDE6', // Cream
    primaryColorName: 'Cream',
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'w-4',
    name: 'Tailored Indigo Denim',
    category: 'bottom',
    primaryColor: '#141E30', // Deep Indigo
    primaryColorName: 'Navy',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=400&q=80',
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: 'w-5',
    name: 'Wool Trench Coat',
    category: 'outerwear',
    primaryColor: '#825C43', // Deep Camel
    primaryColorName: 'Brown',
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=400&q=80',
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'w-6',
    name: 'Derby Leather Shoes',
    category: 'shoes',
    primaryColor: '#1A1917',
    primaryColorName: 'Black',
    imageUrl: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=400&q=80',
    createdAt: Date.now() - 86400000 * 10,
  },
];

class LocalWardrobeStore {
  private wardrobe: WardrobeItem[] = [...INITIAL_WARDROBE];
  private profile: UserStyleProfile = { ...DEFAULT_USER_PROFILE };
  private lookbook: OutfitRecommendation[] = [];

  getItems(): WardrobeItem[] {
    return [...this.wardrobe];
  }

  addItem(item: WardrobeItem): void {
    this.wardrobe.unshift(item);
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
}

export const wardrobeStore = new LocalWardrobeStore();
