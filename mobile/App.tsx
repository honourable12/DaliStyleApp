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
import { AddGarmentModal } from './src/screens/AddGarmentModal';
import { MonkCalibrationModal } from './src/screens/MonkCalibrationModal';
import { wardrobeStore } from './src/db/storage';
import { generateDailyOutfit, WeatherCondition } from './src/core/stylingEngine';
import { WardrobeItem, OutfitRecommendation, MonkTone, UserStyleProfile } from './src/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'closet' | 'studio' | 'lookbook'>('today');
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [profile, setProfile] = useState<UserStyleProfile>(wardrobeStore.getProfile());
  const [lookbook, setLookbook] = useState<OutfitRecommendation[]>([]);
  const [todayOutfit, setTodayOutfit] = useState<OutfitRecommendation | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [monkModalVisible, setMonkModalVisible] = useState(false);

  const currentWeather: WeatherCondition = {
    tempC: 26,
    condition: 'Sunny',
  };

  useEffect(() => {
    // Initial offline data load (0ms instantaneous)
    const items = wardrobeStore.getItems();
    const prof = wardrobeStore.getProfile();
    const saved = wardrobeStore.getLookbook();
    setWardrobe(items);
    setProfile(prof);
    setLookbook(saved);

    // Generate initial outfit
    const outfit = generateDailyOutfit(items, prof, currentWeather);
    setTodayOutfit(outfit);
  }, []);

  const handleReroll = () => {
    const shuffled = [...wardrobe].sort(() => 0.5 - Math.random());
    const outfit = generateDailyOutfit(shuffled, profile, currentWeather);
    setTodayOutfit(outfit);
  };

  const handleSaveToLookbook = (outfit: OutfitRecommendation) => {
    wardrobeStore.saveToLookbook(outfit);
    setLookbook(wardrobeStore.getLookbook());
    setTodayOutfit({ ...outfit, savedInLookbook: true });
    Alert.alert('Saved to Lookbook', 'Outfit archived for future inspiration.');
  };

  const handleRemoveFromLookbook = (id: string) => {
    wardrobeStore.removeFromLookbook(id);
    setLookbook(wardrobeStore.getLookbook());
  };

  const handleAddGarment = (newItem: WardrobeItem) => {
    wardrobeStore.addItem(newItem);
    const updated = wardrobeStore.getItems();
    setWardrobe(updated);
    const refreshed = generateDailyOutfit(updated, profile, currentWeather);
    setTodayOutfit(refreshed);
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

  const NAV_ITEMS: Array<{
    key: 'today' | 'closet' | 'studio' | 'lookbook';
    label: string;
    iconActive: keyof typeof Ionicons.glyphMap;
    iconInactive: keyof typeof Ionicons.glyphMap;
  }> = [
    { key: 'today', label: 'TODAY', iconActive: 'sparkles', iconInactive: 'sparkles-outline' },
    { key: 'closet', label: 'CLOSET', iconActive: 'shirt', iconInactive: 'shirt-outline' },
    { key: 'studio', label: 'STUDIO', iconActive: 'color-palette', iconInactive: 'color-palette-outline' },
    { key: 'lookbook', label: 'LOOKS', iconActive: 'bookmark', iconInactive: 'bookmark-outline' },
  ];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

        {/* Global DRAPE Header */}
        <HeaderBar
          profile={profile}
          tempC={currentWeather.tempC}
          weatherCondition={currentWeather.condition}
          onPressProfile={() => setMonkModalVisible(true)}
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
              onSelectItem={(item) =>
                Alert.alert(
                  item.name,
                  `${item.category.toUpperCase()} · Color: ${item.primaryColorName} (${item.primaryColor})`
                )
              }
            />
          )}

          {activeTab === 'closet' && (
            <ClosetScreen
              items={wardrobe}
              onSelectItem={(item) =>
                Alert.alert(item.name, `${item.category.toUpperCase()} · ${item.primaryColorName}`)
              }
              onPressAdd={() => setAddModalVisible(true)}
            />
          )}

          {activeTab === 'studio' && (
            <StudioScreen wardrobe={wardrobe} userProfile={profile} />
          )}

          {activeTab === 'lookbook' && (
            <LookbookScreen
              lookbook={lookbook}
              onRemove={handleRemoveFromLookbook}
            />
          )}
        </View>

        {/* Bottom Navigation Bar with Vector Icons */}
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
                  size={21}
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

        {/* Modals */}
        <AddGarmentModal
          visible={addModalVisible}
          onClose={() => setAddModalVisible(false)}
          onSave={handleAddGarment}
        />

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
    height: 64,
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
    paddingHorizontal: 12,
    minWidth: 64,
  },
  navIcon: {
    marginBottom: 2,
  },
  navText: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  navTextActive: {
    color: COLORS.accent,
  },
  navActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
    marginTop: 3,
  },
});
