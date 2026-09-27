import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../theme';
import { batchUploadQueue, UploadJob } from '../uploads/BatchUploadQueue';

/**
 * BatchUploadSheet — a bottom overlay that shows live progress for the
 * batch upload queue. Auto-appears when jobs exist. Can be collapsed into
 * a small floating pill to keep working while uploads run.
 */
export const BatchUploadSheet: React.FC = () => {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => batchUploadQueue.subscribe(setJobs), []);

  const total = jobs.length;
  if (total === 0) return null;

  const active = jobs.filter(
    (j) => j.status === 'queued' || j.status === 'uploading' || j.status === 'processing'
  ).length;
  const done = jobs.filter((j) => j.status === 'done').length;
  const failed = jobs.filter((j) => j.status === 'failed').length;
  const overallProgress = jobs.reduce((s, j) => s + j.progress, 0) / total;
  const allDone = active === 0;

  // ── Collapsed pill ──
  if (collapsed) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setCollapsed(false)}
        style={styles.pill}
      >
        {allDone ? (
          <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
        ) : (
          <ActivityIndicator size="small" color={COLORS.accent} />
        )}
        <Text style={styles.pillText}>
          {allDone
            ? `${done} added${failed ? ` · ${failed} failed` : ''}`
            : `Uploading ${done + active} of ${total}`}
        </Text>
        <Ionicons name="chevron-up" size={16} color={COLORS.textSecondary} />
      </TouchableOpacity>
    );
  }

  // ── Expanded sheet ──
  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Batch upload</Text>
          <Text style={styles.subtitle}>
            {allDone
              ? `${done} added${failed ? ` · ${failed} failed` : ''}`
              : `Processing ${active} of ${total}`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setCollapsed(true)}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            style={styles.iconBtn}
          >
            <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Overall progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${overallProgress * 100}%` }]} />
      </View>

      {/* Job list */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {jobs.map((job) => (
          <View key={job.id} style={styles.jobRow}>
            <Image source={{ uri: job.localUri }} style={styles.thumb} resizeMode="cover" />
            <View style={styles.jobInfo}>
              <Text style={styles.jobName} numberOfLines={1}>
                {job.result?.name || job.name}
              </Text>
              <Text style={styles.jobStatus}>
                {job.status === 'queued' && 'Waiting…'}
                {job.status === 'uploading' && 'Uploading…'}
                {job.status === 'processing' && 'Analyzing color…'}
                {job.status === 'done' && 'Added to closet'}
                {job.status === 'failed' && (job.error || 'Failed')}
              </Text>
            </View>

            {job.status === 'uploading' || job.status === 'processing' || job.status === 'queued' ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : job.status === 'done' ? (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            ) : (
              <TouchableOpacity
                onPress={() => batchUploadQueue.retry(job.id)}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                style={styles.retryBtn}
              >
                <Ionicons name="refresh" size={16} color={COLORS.accent} />
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Footer actions */}
      <View style={styles.footer}>
        {failed > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => batchUploadQueue.retryAllFailed()}
            style={styles.footerBtn}
          >
            <Ionicons name="refresh-circle-outline" size={16} color={COLORS.accent} />
            <Text style={styles.footerBtnText}>Retry {failed} failed</Text>
          </TouchableOpacity>
        )}
        {done > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => batchUploadQueue.clearCompleted()}
            style={styles.footerBtn}
          >
            <Ionicons name="checkmark-done-outline" size={16} color={COLORS.textSecondary} />
            <Text style={[styles.footerBtnText, { color: COLORS.textSecondary }]}>
              Clear {done} done
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Collapsed pill
  pill: {
    position: 'absolute',
    bottom: 80,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceRaised,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    ...SHADOWS.float,
  },
  pillText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },

  // Expanded sheet
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    maxHeight: '62%',
    ...SHADOWS.float,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: 2,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  list: {
    maxHeight: 280,
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    marginRight: 12,
    backgroundColor: COLORS.surfaceRaised,
  },
  jobInfo: {
    flex: 1,
  },
  jobName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  jobStatus: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  retryText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
