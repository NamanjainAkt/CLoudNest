// components/file-manager/SortOptionsModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import {
  Check,
  X,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Star,
  ArrowDownUp,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

export type SortMode = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc';

interface SortOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  sortMode: SortMode;
  onSelectSortMode: (mode: SortMode) => void;
  isGridView: boolean;
  onToggleGridView: (grid: boolean) => void;
  favoritesOnly?: boolean;
  onToggleFavoritesOnly?: () => void;
}

const SORT_OPTIONS: { id: SortMode; label: string; desc: string }[] = [
  { id: 'date_desc', label: 'Newest First', desc: 'Recently modified or uploaded' },
  { id: 'date_asc', label: 'Oldest First', desc: 'Earliest modified or uploaded' },
  { id: 'name_asc', label: 'Name (A to Z)', desc: 'Alphabetical order' },
  { id: 'name_desc', label: 'Name (Z to A)', desc: 'Reverse alphabetical order' },
  { id: 'size_desc', label: 'Largest Size', desc: 'Biggest files first' },
  { id: 'size_asc', label: 'Smallest Size', desc: 'Smallest files first' },
];

export const SortOptionsModal: React.FC<SortOptionsModalProps> = ({
  visible,
  onClose,
  sortMode,
  onSelectSortMode,
  isGridView,
  onToggleGridView,
  favoritesOnly,
  onToggleFavoritesOnly,
}) => {
  const { colors, typography, radii } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlayMask }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: colors.borderSubtle,
                  borderRadius: radii.xl || 24,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={styles.titleGroup}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.primaryContainer + '30' }]}>
                    <SlidersHorizontal size={18} color={colors.primary} />
                  </View>
                  <Text style={[typography.headlineSm, { color: colors.onSurface, marginLeft: 10, fontSize: 17 }]}>
                    View & Sort Options
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <X size={18} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {/* View Mode Selection */}
                <Text
                  style={[
                    typography.labelSm,
                    { color: colors.onSurfaceVariant, letterSpacing: 0.8, marginTop: 14, marginBottom: 8 },
                  ]}
                >
                  LAYOUT VIEW
                </Text>
                <View style={styles.viewModeRow}>
                  <TouchableOpacity
                    onPress={() => onToggleGridView(false)}
                    style={[
                      styles.viewModeBtn,
                      {
                        backgroundColor: !isGridView
                          ? colors.primaryContainer + '40'
                          : colors.surfaceContainer,
                        borderColor: !isGridView ? colors.primary : colors.borderSubtle,
                        borderRadius: radii.default,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <List size={18} color={!isGridView ? colors.primary : colors.onSurfaceVariant} />
                    <Text
                      style={[
                        typography.bodyMd,
                        {
                          color: !isGridView ? colors.primary : colors.onSurface,
                          fontWeight: !isGridView ? '700' : '400',
                          marginLeft: 8,
                          fontSize: 13,
                        },
                      ]}
                    >
                      List View
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => onToggleGridView(true)}
                    style={[
                      styles.viewModeBtn,
                      {
                        backgroundColor: isGridView
                          ? colors.primaryContainer + '40'
                          : colors.surfaceContainer,
                        borderColor: isGridView ? colors.primary : colors.borderSubtle,
                        borderRadius: radii.default,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <LayoutGrid size={18} color={isGridView ? colors.primary : colors.onSurfaceVariant} />
                    <Text
                      style={[
                        typography.bodyMd,
                        {
                          color: isGridView ? colors.primary : colors.onSurface,
                          fontWeight: isGridView ? '700' : '400',
                          marginLeft: 8,
                          fontSize: 13,
                        },
                      ]}
                    >
                      Grid View
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Optional Favorites Filter Toggle */}
                {onToggleFavoritesOnly !== undefined && (
                  <TouchableOpacity
                    onPress={onToggleFavoritesOnly}
                    style={[
                      styles.favoriteToggleRow,
                      {
                        backgroundColor: colors.surfaceContainer,
                        borderColor: favoritesOnly ? colors.tertiary : colors.borderSubtle,
                        borderRadius: radii.default,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Star
                        size={18}
                        color={favoritesOnly ? colors.tertiary : colors.onSurfaceVariant}
                        fill={favoritesOnly ? colors.tertiary : 'transparent'}
                      />
                      <Text
                        style={[
                          typography.bodyMd,
                          {
                            color: favoritesOnly ? colors.onSurface : colors.onSurfaceVariant,
                            fontWeight: favoritesOnly ? '600' : '400',
                            marginLeft: 10,
                            fontSize: 13,
                          },
                        ]}
                      >
                        Favorites Only
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkCircle,
                        {
                          backgroundColor: favoritesOnly ? colors.tertiary : colors.surfaceContainerHigh,
                          borderColor: favoritesOnly ? colors.tertiary : colors.outlineVariant,
                        },
                      ]}
                    >
                      {favoritesOnly && <Check size={12} color="#000" />}
                    </View>
                  </TouchableOpacity>
                )}

                {/* Sort By Options */}
                <Text
                  style={[
                    typography.labelSm,
                    { color: colors.onSurfaceVariant, letterSpacing: 0.8, marginTop: 18, marginBottom: 8 },
                  ]}
                >
                  SORT FILES BY
                </Text>
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sortMode === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => {
                        onSelectSortMode(opt.id);
                        onClose();
                      }}
                      style={[
                        styles.sortOptionRow,
                        {
                          backgroundColor: isSelected
                            ? colors.primaryContainer + '25'
                            : colors.surfaceContainer,
                          borderColor: isSelected ? colors.primary : colors.borderSubtle,
                          borderRadius: radii.default,
                        },
                      ]}
                      activeOpacity={0.75}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            typography.bodyMd,
                            {
                              color: isSelected ? colors.primary : colors.onSurface,
                              fontWeight: isSelected ? '700' : '500',
                              fontSize: 13,
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                        <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 11, marginTop: 2 }]}>
                          {opt.desc}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={[styles.activeCheck, { backgroundColor: colors.primary }]}>
                          <Check size={12} color={colors.onPrimary} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Close Button */}
              <TouchableOpacity
                onPress={onClose}
                style={[styles.doneBtn, { backgroundColor: colors.primary, borderRadius: radii.full }]}
                activeOpacity={0.8}
              >
                <Text style={[typography.labelMd, { color: colors.onPrimary, fontWeight: '700' }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  viewModeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  viewModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
  },
  favoriteToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 11,
    borderWidth: 1,
    marginBottom: 6,
  },
  activeCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
});
