import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../theme';

interface FeedPost {
  id: string;
  creatorName: string;
  creatorHandle: string;
  avatarUrl: string;
  imageUrl: string;
  caption: string;
  harmonyScore: number;
  harmonyType: string;
  likesCount: number;
  liked: boolean;
  timeAgo: string;
}

const INITIAL_POSTS: FeedPost[] = [
  {
    id: 'p-1',
    creatorName: 'Amara Vance',
    creatorHandle: '@amarastyle',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
    caption: 'High-contrast monochrome with turmeric undertones.',
    harmonyScore: 94,
    harmonyType: 'Complementary',
    likesCount: 142,
    liked: false,
    timeAgo: '2h',
  },
  {
    id: 'p-2',
    creatorName: 'Kofi Mensah',
    creatorHandle: '@kofidrape',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
    caption: 'Indigo linen with chalk loafers, MST-7 warm tones.',
    harmonyScore: 91,
    harmonyType: 'Triadic',
    likesCount: 89,
    liked: true,
    timeAgo: '5h',
  },
  {
    id: 'p-3',
    creatorName: 'Sienna Blake',
    creatorHandle: '@siennastyle',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=600&q=80',
    caption: 'Minimalist neutral base. Letting the silhouette carry it.',
    harmonyScore: 88,
    harmonyType: 'Monochrome',
    likesCount: 204,
    liked: false,
    timeAgo: '1d',
  },
];

export const FeedScreen: React.FC = () => {
  const [posts, setPosts] = useState<FeedPost[]>(INITIAL_POSTS);

  const handleToggleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === id) {
          const nextLiked = !post.liked;
          return {
            ...post,
            liked: nextLiked,
            likesCount: nextLiked ? post.likesCount + 1 : post.likesCount - 1,
          };
        }
        return post;
      })
    );
  };

  const handleComment = (id: string) => {
    Alert.prompt
      ? Alert.prompt('Comment', 'Share your thoughts:', (text) => {
          if (text) Alert.alert('Posted', 'Your comment was shared.');
        })
      : Alert.alert('Comment', 'Commenting is enabled on the community server.');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.creatorRow}>
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              <View style={styles.creatorInfo}>
                <Text style={styles.creatorName}>{item.creatorName}</Text>
                <Text style={styles.creatorHandle}>
                  {item.creatorHandle} · {item.timeAgo}
                </Text>
              </View>
              <View style={styles.harmonyPill}>
                <Text style={styles.harmonyScore}>{item.harmonyScore}%</Text>
              </View>
            </View>

            <View style={styles.imageWrap}>
              <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => handleToggleLike(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 4, right: 8 }}
                style={styles.actionBtn}
              >
                <Ionicons
                  name={item.liked ? 'heart' : 'heart-outline'}
                  size={22}
                  color={item.liked ? COLORS.destructive : COLORS.textPrimary}
                />
                <Text style={[styles.actionCount, item.liked && styles.actionCountLiked]}>
                  {item.likesCount}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => handleComment(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                style={styles.actionBtn}
              >
                <Ionicons name="chatbubble-outline" size={21} color={COLORS.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => Alert.alert('Share', `Sharing ${item.creatorName}'s look`)}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 4 }}
                style={styles.actionBtn}
              >
                <Ionicons name="paper-plane-outline" size={21} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.captionText}>{item.caption}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  creatorHandle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  harmonyPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  harmonyScore: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  imageWrap: {
    width: '100%',
    height: 340,
    backgroundColor: COLORS.surface,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  actionCount: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  actionCountLiked: {
    color: COLORS.destructive,
  },
  captionText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
});
