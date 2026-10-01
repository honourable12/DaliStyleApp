import AsyncStorage from '@react-native-async-storage/async-storage';
import { WardrobeItem, UserStyleProfile, OutfitRecommendation, ClothingCategory, AuthUser, ThemeMode } from '../types';

export const DEFAULT_USER_PROFILE: UserStyleProfile = {
  id: 'user-default-1',
  monkLabel: 'MST-6',
  skinHex: '#a07850',
  skinName: 'Medium Dark',
  persona: 'Minimalist',
  locationName: 'Accra',
};

// Storage keys for persistent state
const STORAGE_KEYS = {
  WARDROBE: '@stylora_wardrobe_v1',
  PROFILE: '@stylora_profile_v1',
  LOOKBOOK: '@stylora_lookbook_v1',
  ONBOARDING_COMPLETED: '@stylora_onboarding_completed_v1',
  WELCOME_SEEN: '@stylora_welcome_seen_v1',
  THEME_MODE: '@stylora_theme_mode_v1',
  CURRENT_USER: '@stylora_current_user_v1',
};

function normalizeCategory(cat: string): ClothingCategory {
  const c = String(cat || '').toLowerCase();
  if (['top', 'shirt', 't-shirt', 'sweater', 'hoodie', 'blouse'].some((k) => c.includes(k))) return 'top';
  if (['bottom', 'trousers', 'pants', 'jeans', 'shorts', 'skirt'].some((k) => c.includes(k))) return 'bottom';
  if (['outerwear', 'jacket', 'coat', 'blazer', 'cardigan'].some((k) => c.includes(k))) return 'outerwear';
  if (['shoes', 'sneakers', 'boots', 'derby', 'loafers'].some((k) => c.includes(k))) return 'shoes';
  return 'accessory';
}

class LocalWardrobeStore {
  // Empty wardrobe for test launch - encouraging users to digitize and add their own pieces
  private wardrobe: WardrobeItem[] = [];
  private profile: UserStyleProfile = { ...DEFAULT_USER_PROFILE };
  private lookbook: OutfitRecommendation[] = [];
  private hasCompletedOnboarding: boolean = false;
  private hasSeenWelcome: boolean = false;
  private currentUser: AuthUser | null = null;
  private themeMode: ThemeMode = 'editorial';
  private initialized: boolean = false;

  /**
   * Initializes store by loading persisted records from AsyncStorage
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const [
        savedWardrobe,
        savedProfile,
        savedLookbook,
        savedOnboarding,
        savedWelcome,
        savedTheme,
        savedUser,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.WARDROBE),
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.LOOKBOOK),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
        AsyncStorage.getItem(STORAGE_KEYS.WELCOME_SEEN),
        AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE),
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER),
      ]);

      if (savedWardrobe) {
        this.wardrobe = JSON.parse(savedWardrobe);
      }
      if (savedProfile) {
        this.profile = JSON.parse(savedProfile);
      }
      if (savedLookbook) {
        this.lookbook = JSON.parse(savedLookbook);
      }
      if (savedOnboarding !== null) {
        this.hasCompletedOnboarding = savedOnboarding === 'true';
      }
      if (savedWelcome !== null) {
        this.hasSeenWelcome = savedWelcome === 'true';
      }
      if (savedTheme === 'editorial' || savedTheme === 'alabaster') {
        this.themeMode = savedTheme;
      }
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }
    } catch {
      // Graceful fallback to memory defaults
    } finally {
      this.initialized = true;
    }
  }

  getThemeMode(): ThemeMode {
    return this.themeMode;
  }

  setThemeMode(mode: ThemeMode): void {
    this.themeMode = mode;
    AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode).catch(() => {});
  }

  getItems(): WardrobeItem[] {
    return [...this.wardrobe];
  }

  addItem(item: WardrobeItem): void {
    this.wardrobe.unshift(item);
    AsyncStorage.setItem(STORAGE_KEYS.WARDROBE, JSON.stringify(this.wardrobe)).catch(() => {});
  }

  setItems(items: WardrobeItem[]): void {
    this.wardrobe = [...items];
    AsyncStorage.setItem(STORAGE_KEYS.WARDROBE, JSON.stringify(this.wardrobe)).catch(() => {});
  }

  removeItem(id: string): void {
    this.wardrobe = this.wardrobe.filter((i) => i.id !== id);
    AsyncStorage.setItem(STORAGE_KEYS.WARDROBE, JSON.stringify(this.wardrobe)).catch(() => {});
  }

  getProfile(): UserStyleProfile {
    return { ...this.profile };
  }

  updateProfile(newProfile: Partial<UserStyleProfile>): void {
    this.profile = { ...this.profile, ...newProfile };
    AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(this.profile)).catch(() => {});
  }

  getLookbook(): OutfitRecommendation[] {
    return [...this.lookbook];
  }

  saveToLookbook(outfit: OutfitRecommendation): void {
    if (!this.lookbook.some((o) => o.id === outfit.id)) {
      this.lookbook.unshift({ ...outfit, savedInLookbook: true });
      AsyncStorage.setItem(STORAGE_KEYS.LOOKBOOK, JSON.stringify(this.lookbook)).catch(() => {});
    }
  }

  removeFromLookbook(id: string): void {
    this.lookbook = this.lookbook.filter((o) => o.id !== id);
    AsyncStorage.setItem(STORAGE_KEYS.LOOKBOOK, JSON.stringify(this.lookbook)).catch(() => {});
  }

  getHasCompletedOnboarding(): boolean {
    return this.hasCompletedOnboarding;
  }

  setHasCompletedOnboarding(completed: boolean): void {
    this.hasCompletedOnboarding = completed;
    AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, String(completed)).catch(() => {});
  }

  getHasSeenWelcome(): boolean {
    return this.hasSeenWelcome;
  }

  setHasSeenWelcome(seen: boolean): void {
    this.hasSeenWelcome = seen;
    AsyncStorage.setItem(STORAGE_KEYS.WELCOME_SEEN, String(seen)).catch(() => {});
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser ? { ...this.currentUser } : null;
  }

  setCurrentUser(user: AuthUser | null): void {
    this.currentUser = user ? { ...user } : null;
    if (user) {
      AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user)).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER).catch(() => {});
    }
  }

  logout(): void {
    this.currentUser = null;
    AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER).catch(() => {});
  }

  /**
   * Sync with backend commented out / inactive for offline test launch
   */
  async syncWithBackend(baseUrl = 'http://10.0.2.2:8000'): Promise<{ count: number; error?: string }> {
    return { count: 0, error: 'Offline mode active for test launch' };
  }
}

export const wardrobeStore = new LocalWardrobeStore();
