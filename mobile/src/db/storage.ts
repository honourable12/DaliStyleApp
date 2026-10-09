import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import {
  WardrobeItem,
  UserStyleProfile,
  OutfitRecommendation,
  ClothingCategory,
  AuthUser,
  ThemeMode,
} from '../types';

export const DEFAULT_USER_PROFILE: UserStyleProfile = {
  id: 'user-default-1',
  monkLabel: '',
  skinHex: '',
  skinName: 'Awaiting Calibration',
  persona: 'Minimalist',
  locationName: '',
};

const STORAGE_KEYS = {
  WARDROBE: '@stylora_wardrobe_v1',
  PROFILE: '@stylora_profile_v1',
  LOOKBOOK: '@stylora_lookbook_v1',
  ONBOARDING_COMPLETED: '@stylora_onboarding_completed_v1',
  WELCOME_SEEN: '@stylora_welcome_seen_v1',
  THEME_MODE: '@stylora_theme_mode_v1',
  CURRENT_USER: '@stylora_current_user_v1',
} as const;

const log = (msg: string, err?: unknown) => {
  if (__DEV__) console.warn(`[wardrobeStore] ${msg}`, err ?? '');
};

export function normalizeCategory(cat: string): ClothingCategory {
  const c = String(cat || '').toLowerCase();
  if (['dress', 'jumpsuit', 'romper', 'overall', 'gown', 'one-piece', 'co-ord'].some((k) => c.includes(k))) return 'one-piece';
  if (['top', 'shirt', 't-shirt', 'sweater', 'hoodie', 'blouse'].some((k) => c.includes(k))) return 'top';
  if (['bottom', 'trousers', 'pants', 'jeans', 'shorts', 'skirt'].some((k) => c.includes(k))) return 'bottom';
  if (['outerwear', 'jacket', 'coat', 'blazer', 'cardigan'].some((k) => c.includes(k))) return 'outerwear';
  if (['shoes', 'sneakers', 'boots', 'derby', 'loafers'].some((k) => c.includes(k))) return 'shoes';
  return 'accessory';
}

/** Parse JSON safely: a corrupt key returns the fallback instead of breaking everything. */
function safeParse<T>(raw: string | null, fallback: T, key: string): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    log(`Corrupt data for ${key}, using default`, e);
    return fallback;
  }
}

type Listener = () => void;

class LocalWardrobeStore {
  // NOTE: state is treated as immutable. We always replace arrays/objects, never mutate them.
  // That lets getters return stable references (needed for useSyncExternalStore).
  private wardrobe: WardrobeItem[] = [];
  private profile: UserStyleProfile = { ...DEFAULT_USER_PROFILE };
  private lookbook: OutfitRecommendation[] = [];
  private hasCompletedOnboarding = false;
  private hasSeenWelcome = false;
  private currentUser: AuthUser | null = null;
  private themeMode: ThemeMode = 'editorial';

  private initialized = false;
  private initPromise: Promise<void> | null = null;

  // Writes are queued so they hit disk in order and never overlap.
  private writeQueue: Promise<void> = Promise.resolve();
  private listeners = new Set<Listener>();


  /** Safe to call many times; every caller gets the same promise. Await it before rendering. */
  init(): Promise<void> {
    if (!this.initPromise) this.initPromise = this.loadFromDisk();
    return this.initPromise;
  }

  isReady(): boolean {
    return this.initialized;
  }

  private async loadFromDisk(): Promise<void> {
    try {
      const entries = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
      const raw = Object.fromEntries(entries) as Record<string, string | null>;

      const wardrobe = safeParse<WardrobeItem[]>(raw[STORAGE_KEYS.WARDROBE], [], 'wardrobe');
      // Re-normalize categories so older/messy saved data is cleaned on load
      this.wardrobe = wardrobe.map((i) => ({ ...i, category: normalizeCategory((i as any).category) }));

      this.profile = { ...DEFAULT_USER_PROFILE, ...safeParse(raw[STORAGE_KEYS.PROFILE], {}, 'profile') };
      this.lookbook = safeParse<OutfitRecommendation[]>(raw[STORAGE_KEYS.LOOKBOOK], [], 'lookbook');
      this.hasCompletedOnboarding = raw[STORAGE_KEYS.ONBOARDING_COMPLETED] === 'true';
      this.hasSeenWelcome = raw[STORAGE_KEYS.WELCOME_SEEN] === 'true';

      const theme = raw[STORAGE_KEYS.THEME_MODE];
      if (theme === 'editorial' || theme === 'alabaster') this.themeMode = theme;

      this.currentUser = safeParse<AuthUser | null>(raw[STORAGE_KEYS.CURRENT_USER], null, 'user');
    } catch (e) {
      log('Failed to load from storage, using defaults', e);
    } finally {
      this.initialized = true;
      this.emit();
    }
  }

  // ---------- Subscriptions (makes the UI reactive) ----------

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit() {
    this.listeners.forEach((l) => l());
  }

  // ---------- Persistence ----------

  private persist(key: string, value: string | null) {
    if (!this.initialized) {
      log(`Write to ${key} before init() finished. Await wardrobeStore.init() first.`);
    }
    this.writeQueue = this.writeQueue.then(async () => {
      try {
        if (value === null) await AsyncStorage.removeItem(key);
        else await AsyncStorage.setItem(key, value);
      } catch (e) {
        log(`Failed to save ${key}`, e);
      }
    });
  }

  /** Resolves once all pending writes are on disk (useful before app close / in tests). */
  flush(): Promise<void> {
    return this.writeQueue;
  }

  private commit(key: string, value: unknown) {
    this.persist(key, JSON.stringify(value));
    this.emit();
  }

  // ---------- Theme ----------

  getThemeMode(): ThemeMode {
    return this.themeMode;
  }

  setThemeMode(mode: ThemeMode): void {
    this.themeMode = mode;
    this.persist(STORAGE_KEYS.THEME_MODE, mode);
    this.emit();
  }

  // ---------- Wardrobe ----------

  getItems(): WardrobeItem[] {
    return this.wardrobe;
  }

  addItem(item: WardrobeItem): void {
    const normalized = { ...item, category: normalizeCategory((item as any).category) };
    this.wardrobe = [normalized, ...this.wardrobe];
    this.commit(STORAGE_KEYS.WARDROBE, this.wardrobe);
  }

  setItems(items: WardrobeItem[]): void {
    this.wardrobe = items.map((i) => ({ ...i, category: normalizeCategory((i as any).category) }));
    this.commit(STORAGE_KEYS.WARDROBE, this.wardrobe);
  }

  removeItem(id: string): void {
    this.wardrobe = this.wardrobe.filter((i) => i.id !== id);
    this.commit(STORAGE_KEYS.WARDROBE, this.wardrobe);
  }

  // ---------- Profile ----------

  getProfile(): UserStyleProfile {
    return this.profile;
  }

  updateProfile(patch: Partial<UserStyleProfile>): void {
    this.profile = { ...this.profile, ...patch };
    this.commit(STORAGE_KEYS.PROFILE, this.profile);
  }

  /** True once the user has completed skin-tone calibration. Use this to gate the app. */
  isProfileCalibrated(): boolean {
    return !!this.profile.skinHex && !!this.profile.monkLabel;
  }

  /** Saves the calibration only if the required fields are present. Returns false if rejected. */
  completeCalibration(data: Pick<UserStyleProfile, 'monkLabel' | 'skinHex' | 'skinName'> & Partial<UserStyleProfile>): boolean {
    if (!data.monkLabel?.trim() || !data.skinHex?.trim()) return false;
    this.updateProfile(data);
    return true;
  }

  // ---------- Lookbook ----------

  getLookbook(): OutfitRecommendation[] {
    return this.lookbook;
  }

  saveToLookbook(outfit: OutfitRecommendation): void {
    if (this.lookbook.some((o) => o.id === outfit.id)) return;
    this.lookbook = [{ ...outfit, savedInLookbook: true }, ...this.lookbook];
    this.commit(STORAGE_KEYS.LOOKBOOK, this.lookbook);
  }

  removeFromLookbook(id: string): void {
    this.lookbook = this.lookbook.filter((o) => o.id !== id);
    this.commit(STORAGE_KEYS.LOOKBOOK, this.lookbook);
  }

  // ---------- Onboarding flags ----------

  getHasCompletedOnboarding(): boolean {
    return this.hasCompletedOnboarding;
  }

  setHasCompletedOnboarding(completed: boolean): void {
    this.hasCompletedOnboarding = completed;
    this.persist(STORAGE_KEYS.ONBOARDING_COMPLETED, String(completed));
    this.emit();
  }

  getHasSeenWelcome(): boolean {
    return this.hasSeenWelcome;
  }

  setHasSeenWelcome(seen: boolean): void {
    this.hasSeenWelcome = seen;
    this.persist(STORAGE_KEYS.WELCOME_SEEN, String(seen));
    this.emit();
  }

  // ---------- Auth (local cache only, not real authentication) ----------

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  setCurrentUser(user: AuthUser | null): void {
    this.currentUser = user ? { ...user } : null;
    this.persist(STORAGE_KEYS.CURRENT_USER, user ? JSON.stringify(user) : null);
    this.emit();
  }

  logout(): void {
    this.setCurrentUser(null);
  }

  /** Wipe everything (e.g. "Delete my data"). Optionally keep nothing at all. */
  async clearAll(): Promise<void> {
    this.wardrobe = [];
    this.lookbook = [];
    this.profile = { ...DEFAULT_USER_PROFILE };
    this.currentUser = null;
    this.hasCompletedOnboarding = false;
    this.hasSeenWelcome = false;
    this.themeMode = 'editorial';
    this.writeQueue = this.writeQueue.then(() =>
      AsyncStorage.multiRemove(Object.values(STORAGE_KEYS)).catch((e) => log('clearAll failed', e)),
    );
    this.emit();
    await this.writeQueue;
  }

  async syncWithBackend(_baseUrl = 'http://10.0.2.2:8000'): Promise<{ count: number; error?: string }> {
    return { count: 0, error: 'Offline mode active for test launch' };
  }
}

export const wardrobeStore = new LocalWardrobeStore();

/**
 * React hook: re-renders the component whenever the store changes.
 * The selector must return a stable reference (the getters above do).
 *
 *   const items = useWardrobe((s) => s.getItems());
 *   const theme = useWardrobe((s) => s.getThemeMode());
 */
export function useWardrobe<T>(selector: (s: LocalWardrobeStore) => T): T {
  return useSyncExternalStore(wardrobeStore.subscribe, () => selector(wardrobeStore));
}