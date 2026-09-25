// app/(tabs)/search.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Search as SearchIcon, X, SlidersHorizontal, Shield, History } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { TopHeader } from '../../components/common/TopHeader';
import { FilterChip } from '../../components/common/FilterChip';
import { FileListItem } from '../../components/file-manager/FileListItem';
import { FileDao } from '../../services/db/dbClient';
import { FileRecord } from '../../services/types/models';

export default function SearchScreen() {
  const { colors, typography, radii } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(params.category || 'all');
  const [results, setResults] = useState<FileRecord[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const executeSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    try {
      const files = await FileDao.searchFiles(query.trim(), activeCategory);
      setResults(files);
    } catch (err) {
      console.error(err);
    }
  }, [query, activeCategory]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
  };

  const handleRecentPress = (term: string) => {
    setQuery(term);
  };

  const handleRemoveRecent = (term: string) => {
    setRecentSearches((prev) => prev.filter((t) => t !== term));
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <TopHeader title="CloudNest" subtitle="Search" />

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
            placeholder="Search encrypted files, tags, contents..."
            placeholderTextColor={colors.outline}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.iconCircle} activeOpacity={0.7}>
              <X size={14} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.tuneBtn, { backgroundColor: colors.primaryContainer + '20' }]}
            activeOpacity={0.7}
          >
            <SlidersHorizontal size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Cryptographic Telemetry Badge */}
        <View
          style={[
            styles.telemetryStrip,
            { backgroundColor: colors.surfaceContainerLowest },
          ]}
        >
          <View style={styles.telemetryLeft}>
            <Shield size={12} color={colors.tertiary} style={{ marginRight: 5 }} />
            <Text style={[typography.monoSm, { color: colors.onSurfaceVariant }]}>
              Private Search
            </Text>
          </View>
          <View style={styles.telemetryRight}>
            <View style={[styles.ramDot, { backgroundColor: colors.secondary }]} />
            <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 10 }]}>
              Encrypted & Fast
            </Text>
          </View>
        </View>

        {/* Horizontal Filter Chips */}
        <View style={styles.filterChipsRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { id: 'all', label: 'All' },
              { id: 'documents', label: 'Documents' },
              { id: 'images', label: 'Images' },
              { id: 'archives', label: 'Archives' },
              { id: 'media', label: 'Media' },
            ]}
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

        {/* Recent Searches (shown when query is empty or few results) */}
        {recentSearches.length > 0 && query.length < 3 && (
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
              <TouchableOpacity onPress={() => setRecentSearches([])}>
                <Text style={[typography.labelSm, { color: colors.primary }]}>Clear All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentChipsContainer}>
              {recentSearches.map((term) => (
                <View
                  key={term}
                  style={[
                    styles.recentPill,
                    { backgroundColor: colors.surfaceContainerLow },
                  ]}
                >
                  <History size={12} color={colors.outline} style={{ marginRight: 4 }} />
                  <TouchableOpacity onPress={() => handleRecentPress(term)}>
                    <Text style={[typography.bodySm, { color: colors.onSurface }]}>{term}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveRecent(term)}
                    style={{ marginLeft: 6 }}
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
              <Text
                style={[
                  typography.monoSm,
                  { color: colors.onSurfaceVariant, marginVertical: 8 },
                ]}
              >
                {results.length} encrypted matches found
              </Text>
            ) : null
          }
          ListEmptyComponent={
            query.trim().length > 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
                  No encrypted files matching "{query}"
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <SearchIcon size={36} color={colors.outline} style={{ opacity: 0.5, marginBottom: 8 }} />
                <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
                  Type a filename or keyword to search your vault
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <FileListItem
              file={item}
              onPress={(f) => router.push(`/file/${f.id}` as any)}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    height: 40,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 8,
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
    marginVertical: 10,
  },
  recentSection: {
    marginVertical: 8,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recentChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
});
