// app/(tabs)/uploads.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { PauseCircle, Lock, UploadCloud } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { TopHeader } from '../../components/common/TopHeader';
import { FilterChip } from '../../components/common/FilterChip';
import { QueueItemRow } from '../../components/queue/QueueItemRow';
import { useVaultStore } from '../../store/useVaultStore';
import { UploadStatus } from '../../services/types/models';

export default function UploadsScreen() {
  const { colors, typography, radii } = useTheme();
  const {
    uploadQueue,
    pauseQueueItem,
    resumeQueueItem,
    cancelQueueItem,
    pauseAllUploads,
  } = useVaultStore();

  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');

  const filteredQueue = uploadQueue.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'active') return item.status === 'uploading' || item.status === 'paused';
    if (filter === 'completed') return item.status === 'completed';
    if (filter === 'failed') return item.status === 'failed';
    return true;
  });

  const activeCount = uploadQueue.filter((i) => i.status === 'uploading').length;
  const completedCount = uploadQueue.filter((i) => i.status === 'completed').length;
  const failedCount = uploadQueue.filter((i) => i.status === 'failed').length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <TopHeader
        title="Uploads Queue"
        subtitle={`${activeCount > 0 ? '4.2 MB/s • Encrypting' : 'Idle'}`}
      />

      <View style={styles.contentContainer}>
        {/* Dynamic Telemetry Strip */}
        <View
          style={[
            styles.telemetryCard,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: radii.default,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.telemetryTopRow}>
            <View style={styles.activityTitleRow}>
              <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
              <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
                Uploads Activity
              </Text>
            </View>

            <View style={styles.speedAndAction}>
              <View
                style={[
                  styles.speedBadge,
                  { backgroundColor: colors.surfaceContainer },
                ]}
              >
                <Text style={[typography.monoSm, { color: colors.primary, fontWeight: '600' }]}>
                  ↑ {activeCount > 0 ? '8.4 MB/s' : '0 MB/s'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={pauseAllUploads}
                style={[
                  styles.pauseAllBtn,
                  { backgroundColor: colors.surfaceContainerHigh },
                ]}
                activeOpacity={0.7}
              >
                <PauseCircle size={14} color={colors.onSurfaceVariant} style={{ marginRight: 4 }} />
                <Text style={[typography.labelSm, { color: colors.onSurfaceVariant }]}>
                  Pause All
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.telemetryBottomRow}>
            <Lock size={12} color={colors.tertiary} style={{ marginRight: 5 }} />
            <Text
              style={[
                typography.monoSm,
                { color: colors.onSurfaceVariant, fontSize: 11 },
              ]}
              numberOfLines={1}
            >
              End-to-End Encrypted • Automatic Cloud Sync
            </Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <FilterChip
            label="All"
            count={uploadQueue.length}
            active={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <FilterChip
            label="Active"
            count={activeCount}
            active={filter === 'active'}
            onPress={() => setFilter('active')}
          />
          <FilterChip
            label="Completed"
            count={completedCount}
            active={filter === 'completed'}
            onPress={() => setFilter('completed')}
          />
          <FilterChip
            label="Failed"
            count={failedCount}
            active={filter === 'failed'}
            onPress={() => setFilter('failed')}
          />
        </View>

        {/* Queue Items List */}
        <FlatList
          data={filteredQueue}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <UploadCloud size={44} color={colors.outline} style={{ opacity: 0.6 }} />
              <Text
                style={[
                  typography.headlineSm,
                  { color: colors.onSurface, marginTop: 12, fontSize: 16 },
                ]}
              >
                No Active Uploads
              </Text>
              <Text
                style={[
                  typography.bodySm,
                  { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4, maxWidth: 260 },
                ]}
              >
                New files added to your vault will be encrypted with AES-256 and queued here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <QueueItemRow
              item={item}
              onPause={pauseQueueItem}
              onResume={resumeQueueItem}
              onCancel={cancelQueueItem}
              onRetry={resumeQueueItem}
            />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  telemetryCard: {
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  telemetryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  speedAndAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pauseAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  telemetryBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
});
