import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from './src/theme';
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
import { wardrobeStore } from './src/db/storage';
import { generateDailyOutfit, generatePrecombinedLooks, WeatherCondition } from './src/core/stylingEngine';
import { calculateGarmentHarmony, calculateSkinContrast } from './src/core/colorTheory';
import { WardrobeItem, OutfitRecommendation, MonkTone, UserStyleProfile, AuthUser } from './src/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'closet' | 'studio' | 'lookbook' | 'feed' | 'profile'>('today');
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [profile, setProfile] = useState<UserStyleProfile>(wardrobeStore.getProfile());
  const [savedLooks, setSavedLooks] = useState<OutfitRecommendation[]>([]);
  const [todayOutfit, setTodayOutfit] = useState<OutfitRecommendation | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Auth & Onboarding Flow
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(wardrobeStore.getCurrentUser());
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

  const currentWeather: WeatherCondition = {
    tempC: 26,
    condition: 'Sunny',
  };

  useEffect(() => {
    const items = wardrobeStore.getItems();
    const prof = wardrobeStore.getProfile();
    const saved = wardrobeStore.getLookbook();
    setWardrobe(items);
    setProfile(prof);
    setSavedLooks(saved);

    const outfit = generateDailyOutfit(items, prof, currentWeather);
    setTodayOutfit(outfit);
  }, []);

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
    Alert.alert('Saved to Lookbook', 'Outfit archived for future inspiration.');
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

    Alert.alert('Piece Deleted', 'Item permanently removed from your vault.');

    // Background delete attempt on live backend
    try {
      fetch(`http://10.0.2.2:8000/api/wardrobe/items/${id}`, { method: 'DELETE' }).catch(() => {});
    } catch {
      // offline
    }
  };

  // --- WORKBENCH FUNCTIONS ---
  const handleAddToWorkbench = (item: WardrobeItem) => {
    if (workbenchItems.some((w) => w.id === item.id)) {
      Alert.alert('Workbench', 'This piece is already on your workbench.');
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
    Alert.alert('Look Saved', 'Your custom workbench outfit was saved to your Lookbook!');
  };

  const handleSelectTone = (tone: MonkTone) => {
    const updatedProf: UserStyleProfile = {
      ...profile,
      monkLabel: tone.label,
      skinHex: tone.hex,
      skinName: tone.name,
    };
    wardrobeStore.updateProfile(updatedProf);
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
    Alert.alert('Persona Updated', `Style persona set to: ${persona}`);
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
      Alert.alert('Live Sync Complete', `Synced ${result.count} live clothing items from your backend!`);
    } else {
      Alert.alert(
        'Live Backend Sync',
        'Could not reach local FastAPI server (default: http://10.0.2.2:8000). Your offline wardrobe is active and ready.'
      );
    }
  };

  // 5 Canonical Tabs matching DRAPE Design Architecture
  const NAV_ITEMS: Array<{
    key: 'today' | 'closet' | 'studio' | 'lookbook' | 'feed';
    label: string;
    iconActive: keyof typeof Ionicons.glyphMap;
    iconInactive: keyof typeof Ionicons.glyphMap;
  }> = [
    { key: 'today', label: 'TODAY', iconActive: 'sparkles', iconInactive: 'sparkles-outline' },
    { key: 'closet', label: 'CLOSET', iconActive: 'shirt', iconInactive: 'shirt-outline' },
    { key: 'studio', label: 'STUDIO', iconActive: 'color-palette', iconInactive: 'color-palette-outline' },
    { key: 'lookbook', label: 'LOOKS', iconActive: 'bookmark', iconInactive: 'bookmark-outline' },
    { key: 'feed', label: 'FEED', iconActive: 'globe', iconInactive: 'globe-outline' },
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
              Alert.alert('Atelier Authenticated', `Welcome back, ${user.name || user.email}!`);
            }}
            onSkipToGuest={() => {
              setIsAuthActive(false);
            }}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (isOnboardingActive) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
          <OnboardingScreen
            initialProfile={profile}
            seedWardrobe={wardrobe}
            onOpenSelfie={() => setSelfieModalVisible(true)}
            onComplete={(newProfile) => {
              wardrobeStore.updateProfile(newProfile);
              wardrobeStore.setHasCompletedOnboarding(true);
              setProfile(newProfile);
              setIsOnboardingActive(false);
              const refreshed = generateDailyOutfit(wardrobe, newProfile, currentWeather);
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
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

        {/* Global DRAPE Header */}
        <HeaderBar
          profile={profile}
          tempC={currentWeather.tempC}
          weatherCondition={currentWeather.condition}
          onPressProfile={() => setActiveTab('profile')}
          onPressSync={handleLiveBackendSync}
          isSyncing={isSyncing}
        />

        {/* Screen Body */}
        <View style={styles.mainContent}>
          {activeTab === 'today' && (
            <TodayScreen
              outfit={todayOutfit}
              onReroll={handleReroll}
              onSaveToLookbook={handleSaveToLookbook}
              onSelectItem={(item) => {
                setSelectedDetailItem(item);
                setDetailsModalVisible(true);
              }}
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
                Alert.alert('Signed Out', 'Returned to local offline atelier vault.');
              }}
              onRelaunchOnboarding={() => setIsOnboardingActive(true)}
            />
          )}
        </View>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomNav}>
          {NAV_ITEMS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.75}
                onPress={() => setActiveTab(tab.key)}
                style={styles.navItem}
              >
                <Ionicons
                  name={isActive ? tab.iconActive : tab.iconInactive}
                  size={20}
                  color={isActive ? COLORS.accent : COLORS.textSecondary}
                  style={styles.navIcon}
                />
                <Text style={[styles.navText, isActive && styles.navTextActive]}>
                  {tab.label}
                </Text>
                {isActive && <View style={styles.navActiveDot} />}
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
    height: 62,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    minWidth: 54,
  },
  navIcon: {
    marginBottom: 2,
  },
  navText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  navTextActive: {
    color: COLORS.accent,
  },
  navActiveDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
    marginTop: 3,
  },
});
