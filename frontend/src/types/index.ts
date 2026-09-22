export interface MonkTone {
  label: string;
  name: string;
  hex: string;
  rgb: [number, number, number];
}

export interface UserSkinMetadata {
  hex?: string;
  monk_scale?: string;
  undertone?: string;
  [key: string]: unknown;
}

export interface User {
  id?: number | string;
  email: string;
  skin_type?: string | null;
  metadata_skin?: UserSkinMetadata | null;
  style_persona?: string | null;
  created_at?: string;
}

export interface ClothingItem {
  id: number | string;
  name: string;
  category: string;
  color_primary: string;
  color_secondary?: string;
  image_url: string;
  brand?: string | null;
  material?: string | null;
  season?: string | null;
  occasion_tags?: string[];
  sustainability_score?: number;
  is_shoppable?: boolean;
  purchase_url?: string | null;
  price?: number | null;
  mask_b64?: string;
  created_at?: string;
}

export interface DailyLookItem {
  id: number | string;
  name: string;
  category: string;
  color_primary: string;
  image_url: string;
  brand?: string | null;
}

export interface DailyLook {
  items: DailyLookItem[];
  stylist_note: string;
  occasion: string;
  weather_context?: string;
  harmony_score: number;
  sustainability_impact: number;
}

export interface SavedOutfit {
  id: number | string;
  occasion: string;
  items: ClothingItem[];
  llm_reason: string;
  created_at: string;
}

export interface BodyScan {
  id: number | string;
  image_url: string;
  created_at?: string;
}

export type StatusToastType = "success" | "error" | "info" | "";

export interface StatusToastState {
  type: StatusToastType;
  message: string;
}

export type ActiveModel =
  | { kind: "default"; tone: MonkTone }
  | ({ kind: "scan" } & BodyScan);

export interface WardrobeIQ {
  distribution: Record<string, number>;
  consultant_report: string;
}

export interface SocialComment {
  id: number | string;
  content: string;
  created_at?: string;
  user: {
    email: string;
  };
}

export interface SocialPost {
  id: number | string;
  post_type: "outfit" | "item";
  caption?: string;
  created_at?: string;
  user: {
    email: string;
  };
  outfit?: SavedOutfit;
  item?: ClothingItem;
  has_liked?: boolean;
  likes_count: number;
  comments?: SocialComment[];
}

export interface PartnerApiKey {
  id: number | string;
  name: string;
  type: "production" | "sandbox" | string;
  key_prefix: string;
  api_key?: string;
  is_active: boolean;
  created_at: string;
}

export interface PartnerAnalytics {
  total_requests: number;
  average_latency_ms: number;
  error_rate_percent: number;
}

export interface Partner {
  id: number | string;
  name: string;
  email: string;
  settings?: Record<string, string>;
}
