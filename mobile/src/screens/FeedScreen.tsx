import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
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
    caption: 'High contrast monochrome styling with turmeric undertones. Perfect for autumn afternoons.',
    harmonyScore: 94,
    harmonyType: 'Complementary',
    likesCount: 142,
    liked: false,
    timeAgo: '2h ago',
  },
  {
    id: 'p-2',
    creatorName: 'Kofi Mensah',
    creatorHandle: '@kofidrape',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
    caption: 'Tailored deep indigo linen paired with chalk loafers. Calibrated for MST-7 warm tones.',
    harmonyScore: 91,
    harmonyType: 'Triadic',
    likesCount: 89,
    liked: true,
    timeAgo: '5h ago',
  },
  {
    id: 'p-3',
    creatorName: 'Sienna Blake',
    creatorHandle: '@siennastyle',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=600&q=80',
    caption: 'Minimalist neutral base. Letting the natural silhouette carry the outfit.',
    harmonyScore: 88,
    harmonyType: 'Monochrome',
    likesCount: 204,
    liked: false,
    timeAgo: '1d ago',
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
      ? Alert.prompt('Add Comment', 'Share your style thoughts:', (text) => {
          if (text) Alert.alert('Comment Posted', `Your thought was shared with the community.`);
        })
      : Alert.alert('Community Comment', 'Commenting enabled on community server.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>COMMUNITY FEED</Text>
      <Text style={styles.subHeading}>Curated looks from stylists worldwide</Text>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Creator Header */}
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
                <Text style={styles.harmonyType}>{item.harmonyType.toUpperCase()}</Text>
              </View>
            </View>

            {/* Post Image */}
            <View style={styles.imageWrap}>
              <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
            </View>

            {/* Actions Bar */}
            <View style={styles.actionsRow}>
              <View style={styles.actionsLeft}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleToggleLike(item.id)}
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
                  activeOpacity={0.7}
                  onPress={() => handleComment(item.id)}
                  style={styles.actionBtn}
                >
                  <Ionicons name="chatbubble-outline" size={20} color={COLORS.textPrimary} />
                  <Text style={styles.actionCount}>Discuss</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => Alert.alert('Share', `Sharing look by ${item.creatorName}`)}
                style={styles.actionBtn}
              >
                <Ionicons name="paper-plane-outline" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Caption */}
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
  heading: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  subHeading: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  creatorHandle: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
    marginTop: 1,
  },
  harmonyPill: {
    alignItems: 'flex-end',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  harmonyScore: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  harmonyType: {
    color: COLORS.textSecondary,
    fontSize: 7.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  imageWrap: {
    width: '100%',
    height: 320,
    backgroundColor: COLORS.surface,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  actionCountLiked: {
    color: COLORS.destructive,
  },
  captionText: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    lineHeight: 18,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
});
