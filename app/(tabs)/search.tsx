// app/(tabs)/search.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Search as SearchIcon,
  X,
  SlidersHorizontal,
  Shield,
  History,
  Star,
  Trash2,
  FileText,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { TopHeader } from '../../components/common/TopHeader';
import { FilterChip } from '../../components/common/FilterChip';
import { FileListItem } from '../../components/file-manager/FileListItem';
import { FileDao } from '../../services/db/dbClient';
import { SecureStorageService } from '../../services/crypto/secureStore';
import { FileRecord } from '../../services/types/models';
import { CustomConfirmDialog } from '../../components/common/CustomConfirmDialog';

type SortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'documents', label: 'Documents' },
  { id: 'images', label: 'Photos & Videos' },
  { id: 'archives', label: 'Files & Archives' },
  { id: 'audio', label: 'Audio' },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'date_desc', label: 'Newest First' },
  { id: 'date_asc', label: 'Oldest First' },
  { id: 'name_asc', label: 'Name (A to Z)' },
  { id: 'name_desc', label: 'Name (Z to A)' },
  { id: 'size_desc', label: 'Largest Size' },
  { id: 'size_asc', label: 'Smallest Size' },
];

export default function SearchScreen() {
  const { colors, typography, radii } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(params.category || 'all');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [results, setResults] = useState<FileRecord[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [actionFile, setActionFile] = useState<FileRecord | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync route param changes to category state
  useEffect(() => {
    if (params.category) {
      setActiveCategory(params.category);
    }
  }, [params.category]);

  // Load persistent search history on mount
  useEffect(() => {
    SecureStorageService.getRecentSearches().then((history) => {
      if (Array.isArray(history)) {
        setRecentSearches(history);
      }
    });
  }, []);

  // Execute database search
  const executeSearch = useCallback(async () => {
    try {
      const files = await FileDao.searchFiles(query, activeCategory, {
        sortBy,
        favoritesOnly,
      });
      setResults(files);
    } catch (err) {
      console.error('[Search] Failed to query files:', err);
    }
  }, [query, activeCategory, sortBy, favoritesOnly]);

  // Debounced search trigger
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      executeSearch();
    }, 150);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [executeSearch]);

  const saveToRecentSearches = async (term: string) => {
    const trimmed = term.trim();
    if (trimmed.length < 2) return;

    const filtered = recentSearches.filter((t) => t.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, 8);
    setRecentSearches(updated);
    await SecureStorageService.saveRecentSearches(updated);
  };

  const handleSubmitSearch = () => {
    saveToRecentSearches(query);
    executeSearch();
  };

  const handleClear = () => {
    setQuery('');
  };

  const handleRecentPress = (term: string) => {
    setQuery(term);
    saveToRecentSearches(term);
  };

  const handleRemoveRecent = async (term: string) => {
    const filtered = recentSearches.filter((t) => t !== term);
    setRecentSearches(filtered);
    await SecureStorageService.saveRecentSearches(filtered);
  };

  const handleClearAllRecent = async () => {
    setRecentSearches([]);
    await SecureStorageService.saveRecentSearches([]);
  };

  const handleToggleFavorite = async (file: FileRecord) => {
    try {
      await FileDao.toggleFavorite(file.id);
      setActionModalVisible(false);
      executeSearch();
    } catch (err) {
      console.error('[Search] Failed to toggle favorite:', err);
    }
  };

  const handleDeleteFile = (file: FileRecord) => {
    setActionModalVisible(false);
    setActionFile(file);
    setDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (actionFile) {
      try {
        setDeleteLoading(true);
        await FileDao.moveToTrash(actionFile.id);
        setDeleteLoading(false);
        setDeleteConfirmVisible(false);
        executeSearch();
      } catch (err) {
        console.error('[Search] Failed to delete file:', err);
        setDeleteLoading(false);
        setDeleteConfirmVisible(false);
      }
    }
  };

  const hasActiveFilters = favoritesOnly || sortBy !== 'date_desc';

  const resetFilters = () => {
    setSortBy('date_desc');
    setFavoritesOnly(false);
    setFilterModalVisible(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <TopHeader title="CloudNest" />

      <View style={styles.contentContainer}>
        {/* Search Bar Input Box */}
        <View
          style={[
            styles.searchBar,
            {
              borderRadius: radii.full,
              backgroundColor: colors.surfaceContainerHigh,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <SearchIcon size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <TextInput
            style={[
              typography.bodyMd,
              styles.textInput,
              { color: colors.onSurface },
            ]}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmitSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Search files by name..."
            placeholderTextColor={colors.outline}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.iconCircle} activeOpacity={0.7}>
              <X size={14} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            style={[
              styles.tuneBtn,
              {
                backgroundColor: hasActiveFilters
                  ? colors.primary
                  : colors.surfaceContainerHighest,
              },
            ]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Filter and Sort"
          >
            <SlidersHorizontal
              size={14}
              color={hasActiveFilters ? colors.onPrimary : colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

        {/* Private Search Status Strip */}
        <View
          style={[
            styles.telemetryStrip,
            { backgroundColor: colors.surfaceContainerLowest },
          ]}
        >
          <View style={styles.telemetryLeft}>
            <Shield size={12} color={colors.primary} style={{ marginRight: 5 }} />
            <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 11 }]}>
              Private Search
            </Text>
          </View>
          <View style={styles.telemetryRight}>
            <View style={[styles.ramDot, { backgroundColor: colors.secondary }]} />
            <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 10 }]}>
              {hasActiveFilters ? 'Filters Applied' : 'Cloud Synced & Fast'}
            </Text>
          </View>
        </View>

        {/* Horizontal Category Filter Chips */}
        <View style={styles.filterChipsRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <FilterChip
                label={item.label}
                active={activeCategory === item.id}
                onPress={() => setActiveCategory(item.id)}
              />
            )}
          />
        </View>

        {/* Recent Searches (shown when query is empty) */}
        {recentSearches.length > 0 && query.trim().length === 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text
                style={[
                  typography.labelSm,
                  { color: colors.onSurfaceVariant, letterSpacing: 0.8 },
                ]}
              >
                RECENT SEARCHES
              </Text>
              <TouchableOpacity onPress={handleClearAllRecent}>
                <Text style={[typography.labelSm, { color: colors.primary }]}>Clear All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentChipsContainer}>
              {recentSearches.map((term) => (
                <View
                  key={term}
                  style={[
                    styles.recentPill,
                    { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderSubtle },
                  ]}
                >
                  <History size={12} color={colors.outline} style={{ marginRight: 5 }} />
                  <TouchableOpacity onPress={() => handleRecentPress(term)}>
                    <Text style={[typography.bodySm, { color: colors.onSurface, fontSize: 12 }]}>{term}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveRecent(term)}
                    style={{ marginLeft: 6, padding: 2 }}
                  >
                    <X size={12} color={colors.outline} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Search Results List */}
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            results.length > 0 ? (
              <View style={styles.resultsHeaderRow}>
                <Text
                  style={[
                    typography.monoSm,
                    { color: colors.onSurfaceVariant, fontSize: 11 },
                  ]}
                >
                  {results.length} {results.length === 1 ? 'file found' : 'files found'}
                  {favoritesOnly ? ' (Favorites)' : ''}
                </Text>
                {hasActiveFilters && (
                  <TouchableOpacity onPress={resetFilters} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <RotateCcw size={11} color={colors.primary} style={{ marginRight: 3 }} />
                    <Text style={[typography.monoSm, { color: colors.primary, fontSize: 11 }]}>Reset</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            query.trim().length > 0 ? (
              <View style={styles.emptyContainer}>
                <SearchIcon size={32} color={colors.outline} style={{ opacity: 0.5, marginBottom: 8 }} />
                <Text style={[typography.headlineSm, { color: colors.onSurface, fontSize: 15 }]}>
                  No files found
                </Text>
                <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }]}>
                  No files match "{query.trim()}" in {activeCategory === 'all' ? 'storage' : activeCategory}.
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Sparkles size={32} color={colors.primary} style={{ opacity: 0.6, marginBottom: 8 }} />
                <Text style={[typography.headlineSm, { color: colors.onSurface, fontSize: 15 }]}>
                  {activeCategory === 'all' ? 'Storage is Empty' : `No ${activeCategory} yet`}
                </Text>
                <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }]}>
                  Upload files to start searching and organizing your storage.
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <FileListItem
              file={item}
              onPress={(f) => router.push(`/file/${f.id}` as any)}
              onMorePress={(f) => {
                setActionFile(f);
                setActionModalVisible(true);
              }}
            />
          )}
        />
      </View>

      {/* Sort & Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlayMask }]}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.filterModalCard,
                  {
                    backgroundColor: colors.surfaceContainerLow,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.lg,
                  },
                ]}
              >
                <View style={styles.modalHeaderRow}>
                  <Text style={[typography.headlineSm, { color: colors.onSurface, fontSize: 17 }]}>
                    Sort & Filter
                  </Text>
                  <TouchableOpacity
                    onPress={() => setFilterModalVisible(false)}
                    style={styles.modalCloseBtn}
                  >
                    <X size={18} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>

                {/* Favorites Only Toggle */}
                <Text style={[typography.labelSm, { color: colors.onSurfaceVariant, marginTop: 12, marginBottom: 6 }]}>
                  FILTER BY
                </Text>
                <TouchableOpacity
                  onPress={() => setFavoritesOnly((prev) => !prev)}
                  style={[
                    styles.favoriteToggleRow,
                    {
                      backgroundColor: favoritesOnly
                        ? colors.primaryContainer + '30'
                        : colors.surfaceContainer,
                      borderColor: favoritesOnly ? colors.primary : colors.borderSubtle,
                      borderRadius: radii.md,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Star
                      size={16}
                      color={favoritesOnly ? colors.primary : colors.onSurfaceVariant}
                      fill={favoritesOnly ? colors.primary : 'none'}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        typography.bodyMd,
                        {
                          color: favoritesOnly ? colors.primary : colors.onSurface,
                          fontWeight: favoritesOnly ? '600' : '400',
                        },
                      ]}
                    >
                      Favorites Only
                    </Text>
                  </View>
                  {favoritesOnly && <Check size={16} color={colors.primary} />}
                </TouchableOpacity>

                {/* Sort By Options */}
                <Text style={[typography.labelSm, { color: colors.onSurfaceVariant, marginTop: 14, marginBottom: 6 }]}>
                  SORT BY
                </Text>
                {SORT_OPTIONS.map((opt) => {
                  const selected = sortBy === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setSortBy(opt.id)}
                      style={[
                        styles.sortOptionRow,
                        {
                          backgroundColor: selected
                            ? colors.primaryContainer + '25'
                            : colors.surfaceContainer,
                          borderColor: selected ? colors.primary : colors.borderSubtle,
                          borderRadius: radii.md,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          typography.bodyMd,
                          {
                            color: selected ? colors.primary : colors.onSurface,
                            fontWeight: selected ? '600' : '400',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {selected && <Check size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}

                {/* Modal Action Buttons */}
                <View style={styles.modalActionButtons}>
                  <TouchableOpacity
                    onPress={resetFilters}
                    style={[
                      styles.resetBtn,
                      { backgroundColor: colors.surfaceContainerHigh, borderRadius: radii.full },
                    ]}
                  >
                    <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setFilterModalVisible(false)}
                    style={[
                      styles.applyBtn,
                      { backgroundColor: colors.primary, borderRadius: radii.full },
                    ]}
                  >
                    <Text style={[typography.labelMd, { color: colors.onPrimary, fontWeight: '600' }]}>
                      Apply
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* File Action Modal (Triggered by 3 dots on any search result) */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setActionModalVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlayMask }]}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.actionModalCard,
                  {
                    backgroundColor: colors.surfaceContainerLow,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.lg,
                  },
                ]}
              >
                <View style={styles.modalHeaderRow}>
                  <Text
                    style={[typography.headlineSm, { color: colors.onSurface, fontSize: 16, flex: 1 }]}
                    numberOfLines={1}
                  >
                    {actionFile?.name || 'File Options'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setActionModalVisible(false)}
                    style={styles.modalCloseBtn}
                  >
                    <X size={18} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>

                {/* Open / View Details */}
                <TouchableOpacity
                  onPress={() => {
                    setActionModalVisible(false);
                    if (actionFile) router.push(`/file/${actionFile.id}` as any);
                  }}
                  style={[styles.actionRow, { borderBottomColor: colors.borderSubtle, borderBottomWidth: 1 }]}
                  activeOpacity={0.7}
                >
                  <FileText size={18} color={colors.primary} style={{ marginRight: 10 }} />
                  <Text style={[typography.bodyMd, { color: colors.onSurface }]}>Open File Details</Text>
                </TouchableOpacity>

                {/* Star / Unstar Favorite */}
                <TouchableOpacity
                  onPress={() => {
                    if (actionFile) handleToggleFavorite(actionFile);
                  }}
                  style={[styles.actionRow, { borderBottomColor: colors.borderSubtle, borderBottomWidth: 1 }]}
                  activeOpacity={0.7}
                >
                  <Star
                    size={18}
                    color={actionFile?.isFavorite ? colors.primary : colors.onSurfaceVariant}
                    fill={actionFile?.isFavorite ? colors.primary : 'none'}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={[typography.bodyMd, { color: colors.onSurface }]}>
                    {actionFile?.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  </Text>
                </TouchableOpacity>

                {/* Delete / Move to Trash */}
                <TouchableOpacity
                  onPress={() => {
                    if (actionFile) handleDeleteFile(actionFile);
                  }}
                  style={styles.actionRow}
                  activeOpacity={0.7}
                >
                  <Trash2 size={18} color={colors.error} style={{ marginRight: 10 }} />
                  <Text style={[typography.bodyMd, { color: colors.error }]}>Move to Trash</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Delete File Confirmation Dialog */}
      <CustomConfirmDialog
        visible={deleteConfirmVisible}
        title="Move to Trash"
        message={`Are you sure you want to move "${actionFile?.name || 'this file'}" to trash?`}
        confirmLabel="Move to Trash"
        isDestructive
        icon="trash"
        confirmLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
      />
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
    paddingTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  tuneBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 6,
  },
  telemetryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  telemetryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ramDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  filterChipsRow: {
    marginVertical: 8,
  },
  recentSection: {
    marginVertical: 6,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  recentChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filterModalCard: {
    width: '100%',
    maxWidth: 380,
    padding: 18,
    borderWidth: 1,
  },
  actionModalCard: {
    width: '100%',
    maxWidth: 380,
    padding: 16,
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalCloseBtn: {
    padding: 4,
  },
  favoriteToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 11,
    borderWidth: 1,
    marginBottom: 6,
  },
  modalActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  resetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  applyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
});
