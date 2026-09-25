// app/trash.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  AlertTriangle,
  Cloud,
  Clock,
  History,
  Trash2,
  Table,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useVaultStore } from '../store/useVaultStore';
import { FileRecord } from '../services/types/models';

export default function TrashScreen() {
  const { colors, typography, radii } = useTheme();
  const router = useRouter();
  const { trashFiles, restoreFromTrash, deletePermanently, emptyTrash } = useVaultStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');

  const formatBytes = (bytes: number) => {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const totalTrashBytes = trashFiles.reduce((acc: number, f: FileRecord) => acc + (f.size || 0), 0);

  const handleEmptyTrash = () => {
    if (trashFiles.length === 0) {
      Alert.alert('Trash Empty', 'There are no items in trash to delete.');
      return;
    }
    Alert.alert(
      'Empty Trash',
      `All ${trashFiles.length} item(s) will be permanently deleted immediately. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Empty Trash',
          style: 'destructive',
          onPress: async () => {
            await emptyTrash();
            setSelectedIds([]);
          },
        },
      ]
    );
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === trashFiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(trashFiles.map((f: FileRecord) => f.id));
    }
  };

  const handleCycleSort = () => {
    if (sortOrder === 'newest') setSortOrder('oldest');
    else if (sortOrder === 'oldest') setSortOrder('name');
    else setSortOrder('newest');
  };

  const handleRestoreSelected = async () => {
    for (const id of selectedIds) {
      await restoreFromTrash(id);
    }
    setSelectedIds([]);
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Permanently',
      `Permanently delete ${selectedIds.length} item(s)? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            for (const id of selectedIds) {
              await deletePermanently(id);
            }
            setSelectedIds([]);
          },
        },
      ]
    );
  };

  const sortedFiles = [...trashFiles].sort((a, b) => {
    if (sortOrder === 'newest') return (b.deletedAt || 0) - (a.deletedAt || 0);
    if (sortOrder === 'oldest') return (a.deletedAt || 0) - (b.deletedAt || 0);
    return a.name.localeCompare(b.name);
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      {/* Top Header */}
      <View
        style={[
          styles.headerRow,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderSubtle,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.onSurface} />
        </TouchableOpacity>

        <Text
          style={[typography.headlineSm, { color: colors.onSurface, flex: 1, marginLeft: 8 }]}
          numberOfLines={1}
        >
          Trash
        </Text>

        <TouchableOpacity
          onPress={handleEmptyTrash}
          style={[
            styles.emptyTrashBtn,
            { backgroundColor: colors.errorContainer + '30' },
          ]}
          activeOpacity={0.7}
        >
          <Text style={[typography.labelSm, { color: colors.error, fontWeight: '600' }]}>
            Empty Trash
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainContainer}>
        {/* 30-Day Auto Delete Warning Banner */}
        <View
          style={[
            styles.policyBanner,
            {
              backgroundColor: colors.surfaceContainerHigh,
              borderRadius: radii.default,
            },
          ]}
        >
          <View style={[styles.amberIndicator, { backgroundColor: colors.tertiary }]} />
          <View style={styles.bannerContent}>
            <AlertTriangle size={18} color={colors.tertiary} style={{ marginTop: 2 }} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={[typography.labelMd, { color: colors.onSurface, fontWeight: '600' }]}>
                30-Day Auto Delete
              </Text>
              <Text
                style={[
                  typography.bodySm,
                  { color: colors.onSurfaceVariant, marginTop: 2, lineHeight: 17 },
                ]}
              >
                Files in trash are automatically deleted forever after 30 days.
              </Text>
            </View>
          </View>
        </View>

        {/* Storage Summary */}
        <View
          style={[
            styles.telemetryBar,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: radii.default,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={[
                styles.telemetryIcon,
                { backgroundColor: colors.surfaceContainerHighest },
              ]}
            >
              <Trash2 size={16} color={colors.primary} />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={[typography.labelMd, { color: colors.onSurface, fontWeight: '600' }]}>
                {trashFiles.length} {trashFiles.length === 1 ? 'item' : 'items'} in trash
              </Text>
              <Text style={[typography.monoSm, { color: colors.onSurfaceVariant }]}>
                {formatBytes(totalTrashBytes)} occupied
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.pendingPill,
              { backgroundColor: colors.surfaceContainerHighest },
            ]}
          >
            <View style={[styles.amberDot, { backgroundColor: colors.tertiary }]} />
            <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 10 }]}>
              Auto-delete in 30 days
            </Text>
          </View>
        </View>

        {/* Filter & Sort Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[
              styles.sortBtn,
              { backgroundColor: colors.surfaceContainer },
            ]}
            onPress={handleCycleSort}
            activeOpacity={0.7}
          >
            <Text style={[typography.labelSm, { color: colors.onSurfaceVariant }]}>
              {sortOrder === 'newest' ? 'Date Deleted (Newest)' : sortOrder === 'oldest' ? 'Date Deleted (Oldest)' : 'Name (A to Z)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSelectAll} activeOpacity={0.7}>
            <Text style={[typography.labelSm, { color: colors.primary }]}>
              {selectedIds.length === trashFiles.length && trashFiles.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Deleted Items List */}
        <FlatList
          data={sortedFiles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: selectedIds.length > 0 ? 120 : 80 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
                Trash is empty.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selectedIds.includes(item.id);
            const sizeMB = (item.size / (1024 * 1024)).toFixed(1);

            return (
              <View
                style={[
                  styles.trashItemCard,
                  {
                    backgroundColor: colors.surfaceContainerLow,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.default,
                  },
                ]}
              >
                <View style={styles.cardTopRow}>
                  {/* Checkbox */}
                  <TouchableOpacity
                    onPress={() => handleToggleSelect(item.id)}
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surfaceContainerHighest,
                      },
                    ]}
                  >
                    {isSelected && <Check size={12} color={colors.onPrimary} />}
                  </TouchableOpacity>

                  {/* Icon */}
                  <View
                    style={[
                      styles.fileIconBox,
                      { backgroundColor: colors.surfaceContainerHighest },
                    ]}
                  >
                    <Table size={20} color={colors.primary} />
                  </View>

                  {/* File Info */}
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[typography.headlineSm, { color: colors.onSurface, fontSize: 14 }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    {(() => {
                      const daysAgo = item.deletedAt ? Math.max(0, Math.floor((Date.now() - item.deletedAt) / (1000 * 60 * 60 * 24))) : 0;
                      return (
                        <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                          {sizeMB} MB • Deleted {daysAgo === 0 ? 'today' : `${daysAgo}d ago`}
                        </Text>
                      );
                    })()}
                  </View>
                </View>

                {/* Expiration and Actions */}
                <View style={[styles.cardBottomRow, { borderTopColor: colors.borderSubtle, borderTopWidth: 1 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Clock size={13} color={colors.onSurfaceVariant} style={{ marginRight: 4 }} />
                    {(() => {
                      const daysAgo = item.deletedAt ? Math.max(0, Math.floor((Date.now() - item.deletedAt) / (1000 * 60 * 60 * 24))) : 0;
                      const daysRemaining = Math.max(1, 30 - daysAgo);
                      return (
                        <Text style={[typography.labelSm, { color: colors.onSurfaceVariant }]}>
                          Expires in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                        </Text>
                      );
                    })()}
                  </View>

                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      onPress={async () => await restoreFromTrash(item.id)}
                      style={[
                        styles.restoreBtn,
                        { backgroundColor: colors.primaryContainer + '20' },
                      ]}
                      activeOpacity={0.7}
                    >
                      <History size={13} color={colors.primary} style={{ marginRight: 4 }} />
                      <Text style={[typography.labelSm, { color: colors.primary }]}>Restore</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={async () => await deletePermanently(item.id)}
                      style={[
                        styles.deleteForeverBtn,
                        { backgroundColor: colors.errorContainer + '30' },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={13} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />

        {/* Floating Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <View
            style={[
              styles.bulkActionBar,
              {
                backgroundColor: colors.surfaceContainerHighest,
                borderColor: colors.borderSubtle,
                borderRadius: radii.lg,
              },
            ]}
          >
            <Text style={[typography.labelSm, { color: colors.onSurface, fontWeight: '600' }]}>
              {selectedIds.length} selected
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={handleRestoreSelected}
                style={[styles.bulkBtn, { backgroundColor: colors.primaryContainer }]}
                activeOpacity={0.8}
              >
                <History size={13} color={colors.onPrimaryContainer} style={{ marginRight: 4 }} />
                <Text style={[typography.labelSm, { color: colors.onPrimaryContainer, fontWeight: '600' }]}>
                  Restore
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteSelected}
                style={[styles.bulkBtn, { backgroundColor: colors.errorContainer }]}
                activeOpacity={0.8}
              >
                <Trash2 size={13} color={colors.onErrorContainer} style={{ marginRight: 4 }} />
                <Text style={[typography.labelSm, { color: colors.onErrorContainer, fontWeight: '600' }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  bulkActionBar: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bulkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTrashBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  policyBanner: {
    overflow: 'hidden',
    position: 'relative',
    padding: 14,
    marginBottom: 12,
  },
  amberIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  telemetryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 12,
  },
  telemetryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  amberDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  trashItemCard: {
    borderWidth: 1,
    padding: 12,
    marginVertical: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fileIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  deleteForeverBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
});
