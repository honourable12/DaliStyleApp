# Stylora (DRAPE) — Mobile Engineering & Architecture Blueprint

> **Goal:** Transform Stylora into an ultra-performant, easily maintainable, and offline-first mobile application that runs smoothly on low-end devices and slow/unreliable networks (2G/3G/offline).

---

## 1. Framework Selection & Architecture

### Evaluation Matrix

| Criterion | React Native + Expo (New Arch) *(Chosen)* | Flutter | Kotlin Multiplatform (KMP) | Swift + Kotlin Native |
| :--- | :--- | :--- | :--- | :--- |
| **Performance** | **9.5/10** (Fabric C++ renderer, JSI, Bridgeless, Skia) | **9.5/10** (Impeller engine, Dart AOT) | **10/10** (100% native platform views) | **10/10** (Platform native) |
| **Code Sharing with Web** | **10/10** (100% shared TypeScript types, HSL color math, validation) | **3/10** (Requires full rewrite into Dart) | **6/10** (Shared logic in Kotlin, separate UIs) | **0/10** (Two separate languages/codebases) |
| **Upgradeability (OTA)** | **10/10** (EAS Update: Instant over-the-air patches without store review) | **6/10** (Third-party solutions like Shorebird) | **3/10** (Full binary releases for all UI/feature changes) | **2/10** (Full store review cycle: 24–48h delay) |
| **On-Device Edge AI** | **9.5/10** (CoreML/TFLite via JSI/Nitro modules + Apple Vision / ML Kit) | **8.5/10** (tflite_flutter, ffi) | **10/10** (Direct access to CoreML/TFLite) | **10/10** (First-party native SDKs) |
| **Maintainability** | **10/10** (Single TypeScript stack across web and mobile) | **6/10** (Team must maintain Dart + TS/Python) | **7/10** (Compose Multiplatform is evolving) | **4/10** (Doubles engineering overhead) |

### Architectural Decision: Expo + React Native (New Architecture)
* **Fabric & TurboModules (Bridgeless):** Synchronous C++ calls via JavaScript Interface (JSI) eliminate traditional React Native bridge serialization bottlenecks.
* **Instant Over-the-Air (OTA) Updates:** Using **Expo Application Services (EAS Update)**, UI refinements, styling algorithm tweaks, seasonal multipliers, and hotfixes bypass App Store review latency entirely.
* **Shared Ecosystem:** Reuses Stylora's existing Next.js logic, TypeScript interfaces, and Tailwind CSS design tokens.

---

## 2. On-Device Edge AI & Storage Budgets

### A. Realistic Storage & Memory Limits
To avoid OS memory warnings, battery drain, and storage complaints:

| Target Category | Ideal Allocation | Hard Upper Limit | Rationale |
| :--- | :--- | :--- | :--- |
| **App Download Binary** | **30 MB – 50 MB** | < 100 MB | Avoids cellular download warnings on App Store/Play Store. |
| **On-Device AI Models** | **~3.8 MB total** | < 25 MB | Prevents crashing low-RAM devices (Android 3GB–4GB). |
| **Local Images (WebP)** | **50 MB – 150 MB** | Capped at 250 MB | Stores 300–800 outfits locally; LRU cache evicts old items. |
| **Local SQLite Metadata**| **5 MB – 15 MB** | < 50 MB | Holds wardrobe records, tags, and precomputed outfits. |
| **Runtime RAM Usage** | **80 MB – 140 MB** | < 220 MB | Immune to iOS/Android background memory termination. |

### B. On-Device Edge AI Pipeline (Zero Network Dependency)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ON-DEVICE ENGINE PIPELINE                       │
├────────────────────────────────┬───────────────────────────────────────┤
│ 1. Skin Tone Calibration       │ Apple Vision / Google ML Kit +        │
│    (Monk Scale MST-1..10)      │ Skia/JSI Pixel extraction (< 15ms)    │
├────────────────────────────────┼───────────────────────────────────────┤
│ 2. Garment Segmentation        │ Native iOS Subject Lifting /          │
│    & Background Removal        │ YOLOv8n-seg CoreML/TFLite (< 50ms)    │
├────────────────────────────────┼───────────────────────────────────────┤
│ 3. Dominant Color & HSL        │ On-Device K-Means clustering          │
│    Palette Extraction          │ on 128x128 preview mask (< 5ms)       │
├────────────────────────────────┼───────────────────────────────────────┤
│ 4. Wardrobe Harmony Engine     │ Deterministic Permutation Math        │
│    (Tops, Bottoms, Layers)     │ over local SQLite database (< 30ms)   │
└────────────────────────────────┴───────────────────────────────────────┘
```

1. **Skin Tone Calibration (Monk Scale MST-1 to 10):**
   * Real-time cheek/forehead bounding box extraction via **Apple Vision** (`VNDetectFaceLandmarksRequest` on iOS) and **Google ML Kit Face Detection** (Android).
   * Color matching against the 10 Monk Scale reference vectors in pure TypeScript/C++:
     $$\text{distance} = \sqrt{(R_1 - R_2)^2 + (G_1 - G_2)^2 + (B_1 - B_2)^2}$$
   * **Size: 0 MB extra download.** Latency: < 15ms. 100% biometric privacy.

2. **Clothing Segmentation & Background Removal:**
   * **iOS (iOS 17+):** Native **Vision Subject Lifting** (`VNGenerateForegroundInstanceMaskRequest`). Cuts out garments with studio precision with **0 MB added to the app bundle**.
   * **Android:** Quantized **YOLOv8n-seg (INT8)** compiled for Android NNAPI / TFLite (~3.8 MB) executed via `react-native-fast-tflite`.
   * **Viewfinder Cutout:** Live preview cutout directly in camera stream before taking the photo.

3. **Dominant Color & Palette Extraction:**
   * Downsamples the segmented garment mask to $128 \times 128$.
   * Executes a lightweight K-Means / Median-Cut clustering in JS runtime or C++ JSI module.
   * Extracts primary hex, saturation weighting, and closest named color in **< 5 milliseconds**.

4. **Wardrobe Harmony & Recommendation Engine:**
   * Ports `engine.py` and `rules.py` directly into a shared TypeScript module:
     * HSL distance and complementary/triadic/analogous harmony scoring.
     * Contrast ratio scoring against the user's calibrated Monk skin hex.
     * Weather-weighted priorities (sunny, cold, rainy, clear).
   * Evaluates combinations directly from the phone's local database across 50–500 wardrobe items in **< 30ms**.

5. **Styling Notes (Hybrid Approach):**
   * **Offline / Slow Network:** Local template-based styling explanation generator (e.g., *"High contrast pairing: warm turmeric accent balances deep navy foundation suited for 21°C"*).
   * **Online (Fast Network / Wi-Fi):** Background call to cloud LLM (Ollama/Claude/GPT-4o) to enrich daily lookbook cards with bespoke editorial flair.

---

## 3. Slow-Network & Offline-First Strategy

### The Local-First Architecture
Users should experience zero spinners or blocking loaders upon opening the app.

```
┌─────────────────────────────────────────────────────────────┐
│                          UI LAYER                           │
│        Reads 100% from Local SQLite (0ms UI latency)        │
└───────────────┬─────────────────────────────▲───────────────┘
                │ Optimistic Writes           │ Reactive Live Queries
                ▼                             │
┌─────────────────────────────────────────────────────────────┐
│          LOCAL PERSISTENCE (OP-SQLite / WatermelonDB)       │
│  - Wardrobe Items          - Cached Monk Profile            │
│  - Precomputed Outfits     - Outbox Sync Queue              │
└───────────────┬─────────────────────────────────────────────┘
                │ Background Worker (When Network Available)
                ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKGROUND SYNC & UPLOAD QUEUE                 │
│  - Resumable Chunked Transfers (TUS protocol)               │
│  - On-Device WebP Compression (85% bandwidth reduction)     │
│  - Delta sync with ETag / timestamp cursors                 │
└───────────────┬─────────────────────────────────────────────┘
                │ HTTPS
                ▼
           CLOUD BACKEND (PostgreSQL + S3 Storage)
```

1. **Storage & State:**
   * `op-sqlite` (direct C++ SQLite bindings) or `WatermelonDB`.
   * Instant startup: The home screen ("Today") queries local storage synchronously; user recommendations load in **0ms** even in airplane mode.

2. **Optimistic UI & Outbox Sync Queue:**
   * Every user action (adding clothes, favouriting an outfit, updating tags) writes immediately to local SQLite with status `sync_pending: true`.
   * An outbox sync worker attempts synchronization with the server in the background.
   * Automatic retry with exponential backoff and jitter prevents battery/network drain.

3. **Media Optimization Pipeline:**
   * **Camera Capture:** Captured full-resolution photo is immediately compressed on-device to **WebP (quality 80)** with a max dimension of 1200px, reducing file sizes from ~5MB to ~150KB (over 95% bandwidth reduction).
   * **Instant Micro-Thumbnails:** An ultra-compact **BlurHash** (or 30px thumbnail string) is stored directly in SQLite for immediate rendering while high-res images load from disk.
   * **Resumable Uploads:** Image uploads to S3/Supabase use chunked resumable transfers (TUS protocol / BackgroundFetch). If the network cuts out at 60%, it resumes from 60% when signal returns.

---

## 4. Platform Build Setup: Android & iOS

### A. Android Setup (Local Development)
Because you have Android tools / CLI on your Windows machine:
1. **Ensure Environment Variables are set:**
   * `ANDROID_HOME` = `C:\Users\<user>\AppData\Local\Android\Sdk` (or your custom Android SDK location).
   * `PATH` includes:
     * `%ANDROID_HOME%\platform-tools` (provides `adb`)
     * `%ANDROID_HOME%\emulator`
     * `%ANDROID_HOME%\cmdline-tools\latest\bin`
2. **Local Testing:**
   * Connect an Android phone with **USB Debugging enabled** or start an Android Virtual Device (AVD).
   * Run: `npx expo run:android` (builds the local native debug APK) or `npx expo start` with the **Expo Go** app on Android.

### B. iOS Setup (Windows Host with Cloud Build & Device Testing)
Since macOS/Xcode is required for local iOS binary compilation, development on Windows uses the industry-standard workflow:
1. **Live Development & Testing (No Mac needed):**
   * Install the free **Expo Go** app from the iOS App Store onto your iPhone.
   * Run `npx expo start` on Windows.
   * Scan the terminal QR code with your iPhone camera to run and hot-reload Stylora instantly on your phone over Wi-Fi.
2. **Standalone iOS Builds (EAS Build CLI):**
   * Install Expo Application Services CLI:
     ```bash
     npm install -g eas-cli
     eas login
     ```
   * Configure project:
     ```bash
     eas build:configure
     ```
   * Trigger cloud iOS builds directly from Windows terminal:
     ```bash
     eas build -p ios --profile preview
     ```
   * Expo’s cloud macOS builders compile your `.ipa` or generate an installable ad-hoc build via QR code or TestFlight.

---

## 5. High-Performance UI/UX & Graphics (60–120 FPS)

1. **The Signature "Outfit Ring":**
   * Radial arrangement of garments that rotates continuously with smooth physical inertia, animating HSL harmony scores on a color wheel.
   * Built with `@shopify/react-native-skia` and `react-native-reanimated 3` running on the native GPU thread.
2. **Wardrobe Grid Virtualization:**
   * Using `@shopify/flashlist` recycles native platform views to eliminate memory spikes and scroll stutter through 1,000+ items.
3. **DRAPE Visual Identity System (Design Tokens):**
   * **Background:** Warm Void (`#0E0D0C`)
   * **Surface:** Ash (`#1A1917`)
   * **Surface Raised:** Linen Dark (`#252320`)
   * **Accent:** Turmeric (`#E8A830`)
   * **Accent Soft:** Pale Sand (`#F5E9C8`)
   * Configured via **NativeWind v4** (Tailwind CSS for React Native).

---

## 6. Monorepo Project Structure & Execution

```
D:\Projects\DaliStyleApp/
├── mobile/                  # Expo / React Native App (New Architecture)
│   ├── app/                 # Expo Router file-based screens
│   │   ├── (tabs)/          # Today, Closet, Studio, Lookbook, Profile
│   │   ├── _layout.tsx
│   │   └── camera.tsx       # Live cutout capture screen
│   ├── src/
│   │   ├── components/      # OutfitRing, GarmentCard, HarmonyWheel
│   │   ├── core/            # Color theory math, Monk scale matching
│   │   ├── db/              # OP-SQLite schemas and sync queue
│   │   ├── hooks/           # useWardrobe, useTodayOutfit
│   │   └── ai/              # Local segmentation & color extractor
│   ├── package.json
│   ├── tailwind.config.js
│   └── app.json
├── frontend/                # Existing Next.js Web App
├── backend/                 # Existing FastAPI Backend
└── ai-service/              # Existing Python AI Service
```
