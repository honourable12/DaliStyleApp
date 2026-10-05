import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS, ThemeProvider, useTheme } from './src/theme';
import { HeaderBar } from './src/components/HeaderBar';
import { TodayScreen } from './src/screens/TodayScreen';
import { ClosetScreen } from './src/screens/ClosetScreen';
import { StudioScreen } from './src/screens/StudioScreen';
import { LookbookScreen } from './src/screens/LookbookScreen';
import { FeedScreen } from './src/screens/FeedScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AddGarmentModal } from './src/screens/AddGarmentModal';
import { MonkCalibrationModal } from './src/screens/MonkCalibrationModal';
import { SelfieCalibrationModal } from './src/screens/SelfieCalibrationModal';
import { ItemDetailsModal } from './src/components/ItemDetailsModal';
import { AuthScreen } from './src/screens/AuthScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { BatchUploadSheet } from './src/components/BatchUploadSheet';
import { batchUploadQueue } from './src/uploads/BatchUploadQueue';
import { wardrobeStore } from './src/db/storage';
import { generateDailyOutfit, generatePrecombinedLooks, WeatherCondition } from './src/core/stylingEngine';
import { calculateGarmentHarmony, calculateSkinContrast } from './src/core/colorTheory';
import { WardrobeItem, OutfitRecommendation, MonkTone, UserStyleProfile, AuthUser, ThemeMode } from './src/types';
import { requestAndFetchLocationWeather, fetchOpenMeteoWeather } from './src/services/weatherService';
import { ToastProvider, showAtelierToast } from './src/context/ToastContext';

export default function App() {
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [initialMode, setInitialMode] = useState<ThemeMode>('editorial');

  useEffect(() => {
    let mounted = true;
    (async () => {
      await wardrobeStore.init();
      if (mounted) {
        setInitialMode(wardrobeStore.getThemeMode());
        setIsStoreReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!isStoreReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#141312', alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor="#141312" />
        <ActivityIndicator size="large" color="#E8A830" />
      </View>
    );
  }

  return (
    <ThemeProvider initialMode={initialMode}>
      <ToastProvider>
        <StyloraApp />
      </ToastProvider>
    </ThemeProvider>
  );
}

function StyloraApp() {
  const { colors, mode } = useTheme();
  const [activeTab, setActiveTab] = useState<'today' | 'closet' | 'studio' | 'lookbook' | 'feed' | 'profile'>('today');
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([...wardrobeStore.getItems()]);
  const [profile, setProfile] = useState<UserStyleProfile>(wardrobeStore.getProfile());
  const [savedLooks, setSavedLooks] = useState<OutfitRecommendation[]>([...wardrobeStore.getLookbook()]);
  const [todayOutfit, setTodayOutfit] = useState<OutfitRecommendation | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Auth, Welcome & Onboarding Flow
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(wardrobeStore.getCurrentUser());
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean>(wardrobeStore.getHasSeenWelcome());
  const [isOnboardingActive, setIsOnboardingActive] = useState<boolean>(!wardrobeStore.getHasCompletedOnboarding());
  const [isAuthActive, setIsAuthActive] = useState<boolean>(false);

  // Workbench State
  const [workbenchItems, setWorkbenchItems] = useState<WardrobeItem[]>([]);

  // Item Details & Delete Modal State
  const [selectedDetailItem, setSelectedDetailItem] = useState<WardrobeItem | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [monkModalVisible, setMonkModalVisible] = useState(false);
  const [selfieModalVisible, setSelfieModalVisible] = useState(false);

  const [currentWeather, setCurrentWeather] = useState<WeatherCondition>({
    tempC: 24,
    condition: 'Sunny',
  });
  const [isWeatherLoaded, setIsWeatherLoaded] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const items = wardrobeStore.getItems();
      const prof = wardrobeStore.getProfile();

      let activeWeather = currentWeather;
      if (prof.latitude && prof.longitude) {
        try {
          const forecast = await fetchOpenMeteoWeather(prof.latitude, prof.longitude);
          if (forecast) {
            activeWeather = { tempC: forecast.tempC, condition: forecast.condition };
            setCurrentWeather(activeWeather);
            setIsWeatherLoaded(true);
          }
        } catch {
          // Keep ambient weather
        }
      }

      if (items.length > 0) {
        const outfit = generateDailyOutfit(items, prof, activeWeather);
        setTodayOutfit(outfit);
      } else {
        setTodayOutfit(null);
      }
    })();
  }, []);

  // Wire the batch upload queue so completed items refresh the wardrobe + today outfit
  useEffect(() => {
    batchUploadQueue.onItemAdded = () => {
      const updated = wardrobeStore.getItems();
      setWardrobe(updated);
      const refreshed = generateDailyOutfit(updated, profile, currentWeather);
      setTodayOutfit(refreshed);
    };
    return () => {
      batchUploadQueue.onItemAdded = undefined;
    };
  }, [profile]);

  // Precombined matched looks generated algorithmically from the current wardrobe
  const precombinedLooks = generatePrecombinedLooks(wardrobe, profile);

  const handleReroll = () => {
    const shuffled = [...wardrobe].sort(() => 0.5 - Math.random());
    const outfit = generateDailyOutfit(shuffled, profile, currentWeather);
    setTodayOutfit(outfit);
  };

  const handleSaveToLookbook = (outfit: OutfitRecommendation) => {
    wardrobeStore.saveToLookbook(outfit);
    setSavedLooks(wardrobeStore.getLookbook());
    if (todayOutfit?.id === outfit.id) {
      setTodayOutfit({ ...outfit, savedInLookbook: true });
    }
    showAtelierToast({
      title: 'LOOKBOOK ARCHIVED',
      message: 'Outfit saved to your editorial collection.',
      type: 'success',
      icon: 'bookmark',
    });
  };

  const handleRemoveFromLookbook = (id: string) => {
    wardrobeStore.removeFromLookbook(id);
    setSavedLooks(wardrobeStore.getLookbook());
  };

  const handleAddGarment = (newItem: WardrobeItem) => {
    wardrobeStore.addItem(newItem);
    const updated = wardrobeStore.getItems();
    setWardrobe(updated);
    const refreshed = generateDailyOutfit(updated, profile, currentWeather);
    setTodayOutfit(refreshed);
  };

  // --- DELETE ITEM FUNCTION ---
  const handleDeleteItem = async (id: string) => {
    wardrobeStore.removeItem(id);
    const updated = wardrobeStore.getItems();
    setWardrobe(updated);

    // Remove from workbench if present
    setWorkbenchItems((prev) => prev.filter((i) => i.id !== id));

    // Refresh today outfit
    const refreshed = generateDailyOutfit(updated, profile, currentWeather);
    setTodayOutfit(refreshed);

    showAtelierToast({
      title: 'PIECE REMOVED',
      message: 'Item removed from your atelier vault.',
      type: 'info',
      icon: 'trash',
    });

    // Background delete attempt on live backend commented out for offline test launch
    /*
    try {
      fetch(`http://10.0.2.2:8000/api/wardrobe/items/${id}`, { method: 'DELETE' }).catch(() => {});
    } catch {
      // offline
    }
    */
  };

  // --- WORKBENCH FUNCTIONS ---
  const handleAddToWorkbench = (item: WardrobeItem) => {
    if (workbenchItems.some((w) => w.id === item.id)) {
      showAtelierToast({
        title: 'WORKBENCH',
        message: 'This piece is already active on your workbench.',
        type: 'info',
      });
      return;
    }

    setWorkbenchItems((prev) => {
      // If same category exists and not accessory, replace it
      const filtered = prev.filter((w) => w.category !== item.category || item.category === 'accessory');
      if (filtered.length >= 3) {
        return [...filtered.slice(0, 2), item];
      }
      return [...filtered, item];
    });
  };

  const handleRemoveWorkbenchItem = (id: string) => {
    setWorkbenchItems((prev) => prev.filter((w) => w.id !== id));
  };

  const handleClearWorkbench = () => {
    setWorkbenchItems([]);
  };

  const handleSaveWorkbenchLook = () => {
    if (workbenchItems.length < 2) return;

    const colors = workbenchItems.map((i) => i.primaryColor);
    const harmony = calculateGarmentHarmony(colors);
    const skinContrast = calculateSkinContrast(profile.skinHex, workbenchItems[0].primaryColor);

    const newLook: OutfitRecommendation = {
      id: `wb-look-${Date.now()}`,
      items: [...workbenchItems],
      harmonyScore: harmony.score,
      skinContrastScore: skinContrast,
      weatherAppropriate: true,
      weatherType: 'Clear',
      harmonyType: harmony.type,
      stylingNote: `Bespoke workbench composition. Hand-assembled ${harmony.type} look featuring ${workbenchItems.map((i) => i.name).join(' & ')}.`,
      savedInLookbook: true,
    };

    wardrobeStore.saveToLookbook(newLook);
    setSavedLooks(wardrobeStore.getLookbook());
    showAtelierToast({
      title: 'BESPOKE LOOK SAVED',
      message: 'Custom workbench outfit saved to your Lookbook.',
      type: 'success',
      icon: 'sparkles',
    });
  };

  const handleSelectTone = (tone: MonkTone) => {
    wardrobeStore.completeCalibration({
      monkLabel: tone.label,
      skinHex: tone.hex,
      skinName: tone.name,
    });
    const updatedProf = wardrobeStore.getProfile();
    setProfile(updatedProf);

    const recalibrated = generateDailyOutfit(wardrobe, updatedProf, currentWeather);
    setTodayOutfit(recalibrated);
  };

  const handleUpdatePersona = (persona: UserStyleProfile['persona']) => {
    const updatedProf: UserStyleProfile = { ...profile, persona };
    wardrobeStore.updateProfile(updatedProf);
    setProfile(updatedProf);
    const recalibrated = generateDailyOutfit(wardrobe, updatedProf, currentWeather);
    setTodayOutfit(recalibrated);
    showAtelierToast({
      title: 'PERSONA UPDATED',
      message: `Style persona calibrated to: ${persona}`,
      type: 'success',
    });
  };

  const handleLiveBackendSync = async () => {
    setIsSyncing(true);
    const result = await wardrobeStore.syncWithBackend();
    setIsSyncing(false);

    if (result.count > 0) {
      const liveItems = wardrobeStore.getItems();
      setWardrobe(liveItems);
      const newOutfit = generateDailyOutfit(liveItems, profile, currentWeather);
      setTodayOutfit(newOutfit);
      showAtelierToast({
        title: 'LIVE SYNC COMPLETE',
        message: `Synced ${result.count} live clothing items from your backend.`,
        type: 'success',
      });
    } else {
      showAtelierToast({
        title: 'ATELIER VAULT READY',
        message: 'Your offline wardrobe is fully active and calibrated.',
        type: 'info',
      });
    }
  };

  const handleDetectWeather = async () => {
    try {
      const weather = await requestAndFetchLocationWeather();
      if (weather) {
        const updatedProf: UserStyleProfile = {
          ...profile,
          locationName: weather.locationName,
          latitude: weather.latitude,
          longitude: weather.longitude,
        };
        wardrobeStore.updateProfile(updatedProf);
        setProfile(updatedProf);
        const newWeather: WeatherCondition = { tempC: weather.tempC, condition: weather.condition };
        setCurrentWeather(newWeather);
        setIsWeatherLoaded(true);
        const refreshed = generateDailyOutfit(wardrobe, updatedProf, newWeather);
        setTodayOutfit(refreshed);
        showAtelierToast({
          title: 'WEATHER SYNCHRONIZED',
          message: `${weather.locationName} · ${weather.tempC}°C ${weather.condition}`,
          type: 'success',
          icon: 'partly-sunny',
        });
      } else {
        showAtelierToast({
          title: 'LOCATION REQUIRED',
          message: 'Enable device location to adapt daily recommendations.',
          type: 'warning',
        });
      }
    } catch (e: any) {
      showAtelierToast({
        title: 'LOCATION ERROR',
        message: e.message || 'Could not fetch weather telemetry.',
        type: 'error',
      });
    }
  };

  // 5 Canonical Tabs matching DRAPE Design Architecture
  const NAV_ITEMS: Array<{
    key: 'today' | 'closet' | 'studio' | 'lookbook' | 'feed';
    label: string;
    iconActive: keyof typeof Ionicons.glyphMap;
    iconInactive: keyof typeof Ionicons.glyphMap;
  }> = [
    { key: 'today', label: 'Today', iconActive: 'sparkles', iconInactive: 'sparkles-outline' },
    { key: 'closet', label: 'Closet', iconActive: 'shirt', iconInactive: 'shirt-outline' },
    { key: 'studio', label: 'Studio', iconActive: 'color-palette', iconInactive: 'color-palette-outline' },
    { key: 'lookbook', label: 'Looks', iconActive: 'bookmark', iconInactive: 'bookmark-outline' },
    { key: 'feed', label: 'Feed', iconActive: 'globe', iconInactive: 'globe-outline' },
  ];

  if (isAuthActive) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
          <AuthScreen
            onAuthSuccess={(user) => {
              wardrobeStore.setCurrentUser(user);
              setCurrentUser(user);
              setIsAuthActive(false);
              showAtelierToast({
                title: 'ATELIER AUTHENTICATED',
                message: `Welcome back, ${user.name || user.email}!`,
                type: 'success',
              });
            }}
            onSkipToGuest={() => {
              setIsAuthActive(false);
            }}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // First launch page telling users about Stylora before onboarding
  if (!hasSeenWelcome) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
          <WelcomeScreen
            onStart={() => {
              wardrobeStore.setHasSeenWelcome(true);
              setHasSeenWelcome(true);
            }}
            onSignIn={() => {
              wardrobeStore.setHasSeenWelcome(true);
              setHasSeenWelcome(true);
              setIsAuthActive(true);
            }}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Calibration & Onboarding Gate (Blocks access until biometric calibration is completed)
  const isCalibrated = wardrobeStore.isProfileCalibrated();
  if (isOnboardingActive || !isCalibrated) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
          <OnboardingScreen
            initialProfile={profile}
            seedWardrobe={wardrobe}
            onOpenSelfie={() => setSelfieModalVisible(true)}
            onComplete={(newProfile) => {
              wardrobeStore.completeCalibration({
                monkLabel: newProfile.monkLabel,
                skinHex: newProfile.skinHex,
                skinName: newProfile.skinName,
                persona: newProfile.persona,
              });
              wardrobeStore.setHasCompletedOnboarding(true);
              const updatedProf = wardrobeStore.getProfile();
              setProfile(updatedProf);
              setIsOnboardingActive(false);
              const refreshed = generateDailyOutfit(wardrobe, updatedProf, currentWeather);
              setTodayOutfit(refreshed);
            }}
          />
          <SelfieCalibrationModal
            visible={selfieModalVisible}
            onClose={() => setSelfieModalVisible(false)}
            onCalibrate={handleSelectTone}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

        {/* Global DRAPE Header */}
        <HeaderBar
          profile={profile}
          tempC={currentWeather.tempC}
          weatherCondition={currentWeather.condition}
          isWeatherLoaded={isWeatherLoaded}
          onPressProfile={() => setActiveTab('profile')}
          onPressLocation={handleDetectWeather}
          onPressSync={handleLiveBackendSync}
          isSyncing={isSyncing}
        />

        {/* Screen Body */}
        <View style={[styles.mainContent, { backgroundColor: colors.background }]}>
          {activeTab === 'today' && (
            <TodayScreen
              outfit={todayOutfit}
              onReroll={handleReroll}
              onSaveToLookbook={handleSaveToLookbook}
              onSelectItem={(item) => {
                setSelectedDetailItem(item);
                setDetailsModalVisible(true);
              }}
              onOpenCloset={() => setActiveTab('closet')}
            />
          )}

          {activeTab === 'closet' && (
            <ClosetScreen
              items={wardrobe}
              workbenchItems={workbenchItems}
              onSelectItem={(item) => {
                setSelectedDetailItem(item);
                setDetailsModalVisible(true);
              }}
              onPressAdd={() => setAddModalVisible(true)}
              onAddToWorkbench={handleAddToWorkbench}
              onRemoveWorkbenchItem={handleRemoveWorkbenchItem}
              onClearWorkbench={handleClearWorkbench}
              onSaveWorkbenchLook={handleSaveWorkbenchLook}
              onDeleteItem={handleDeleteItem}
              onOpenStudio={() => setActiveTab('studio')}
              onOpenWardrobeIQ={() => setActiveTab('profile')}
            />
          )}

          {activeTab === 'studio' && (
            <StudioScreen wardrobe={wardrobe} userProfile={profile} />
          )}

          {activeTab === 'lookbook' && (
            <LookbookScreen
              savedLooks={savedLooks}
              precombinedLooks={precombinedLooks}
              onRemove={handleRemoveFromLookbook}
              onSavePrecombined={handleSaveToLookbook}
              onWearLook={(outfit) => {
                setTodayOutfit(outfit);
                setActiveTab('today');
              }}
            />
          )}

          {activeTab === 'feed' && <FeedScreen />}

          {activeTab === 'profile' && (
            <ProfileScreen
              profile={profile}
              wardrobe={wardrobe}
              currentUser={currentUser}
              onUpdatePersona={handleUpdatePersona}
              onOpenSelfieCalibration={() => setSelfieModalVisible(true)}
              onOpenMonkList={() => setMonkModalVisible(true)}
              onOpenAuth={() => setIsAuthActive(true)}
              onLogout={() => {
                wardrobeStore.logout();
                setCurrentUser(null);
                showAtelierToast({
                  title: 'SIGNED OUT',
                  message: 'Returned to local offline atelier vault.',
                  type: 'info',
                });
              }}
              onRelaunchOnboarding={() => setIsOnboardingActive(true)}
              onLocationUpdated={(locationName, tempC, condition) => {
                const updatedProf = wardrobeStore.getProfile();
                setProfile(updatedProf);
                const newWeather: WeatherCondition = { tempC, condition };
                setCurrentWeather(newWeather);
                setIsWeatherLoaded(true);
                const refreshed = generateDailyOutfit(wardrobe, updatedProf, newWeather);
                setTodayOutfit(refreshed);
              }}
            />
          )}
        </View>

        {/* Bottom Navigation Bar */}
        <View style={[styles.bottomNav, { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder, borderTopWidth: 1 }]}>
          {NAV_ITEMS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.6}
                onPress={() => setActiveTab(tab.key)}
                style={styles.navItem}
              >
                <View style={[styles.navIconWrap, isActive && { backgroundColor: colors.tagActiveBg }]}>
                  <Ionicons
                    name={isActive ? tab.iconActive : tab.iconInactive}
                    size={22}
                    color={isActive ? colors.accent : colors.textSecondary}
                  />
                </View>
                <Text style={[styles.navText, { color: isActive ? colors.accent : colors.textSecondary, fontWeight: isActive ? '700' : '600' }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Item Details & Delete Modal */}
        <ItemDetailsModal
          item={selectedDetailItem}
          visible={detailsModalVisible}
          onClose={() => setDetailsModalVisible(false)}
          onAddToWorkbench={handleAddToWorkbench}
          onDelete={handleDeleteItem}
        />

        {/* Cloth Upload Modal */}
        <AddGarmentModal
          visible={addModalVisible}
          onClose={() => setAddModalVisible(false)}
          onSave={handleAddGarment}
        />

        {/* Selfie Skin Tone Calibration Modal */}
        <SelfieCalibrationModal
          visible={selfieModalVisible}
          onClose={() => setSelfieModalVisible(false)}
          onCalibrate={handleSelectTone}
        />

        {/* Monk Scale Reference List Modal */}
        <MonkCalibrationModal
          visible={monkModalVisible}
          selectedLabel={profile.monkLabel}
          onClose={() => setMonkModalVisible(false)}
          onSelectTone={handleSelectTone}
        />

        {/* Batch Upload Progress Overlay — auto-shows when jobs exist */}
        <BatchUploadSheet />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mainContent: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 68,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 8,
    paddingTop: 8,
    ...SHADOWS.float,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 56,
  },
  navIconWrap: {
    width: 40,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: COLORS.accentMuted,
  },
  navText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  navTextActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
});
