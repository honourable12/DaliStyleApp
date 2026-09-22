import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
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
    // Shuffles or regenerates outfit
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
    // Refresh today outfit if appropriate
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

    // Recalculate outfit with new skin tone calibration
    const recalibrated = generateDailyOutfit(wardrobe, updatedProf, currentWeather);
    setTodayOutfit(recalibrated);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Global DRAPE Header */}
      <HeaderBar
        profile={profile}
        tempC={currentWeather.tempC}
        weatherCondition={currentWeather.condition}
        onPressProfile={() => setMonkModalVisible(true)}
      />

      {/* Screen Body */}
      <View style={styles.mainContent}>
        {activeTab === 'today' && (
          <TodayScreen
            outfit={todayOutfit}
            onReroll={handleReroll}
            onSaveToLookbook={handleSaveToLookbook}
            onSelectItem={(item) =>
              Alert.alert(item.name, `${item.category.toUpperCase()} · Color: ${item.primaryColorName} (${item.primaryColor})`)
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

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        {[
          { key: 'today', label: 'TODAY' },
          { key: 'closet', label: 'CLOSET' },
          { key: 'studio', label: 'STUDIO' },
          { key: 'lookbook', label: 'LOOKS' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.8}
              onPress={() => setActiveTab(tab.key as any)}
              style={styles.navItem}
            >
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
    height: 58,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  navText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  navTextActive: {
    color: COLORS.accent,
  },
  navActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
    marginTop: 4,
  },
});
