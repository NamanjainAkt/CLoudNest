// components/auth/CountryPickerModal.tsx
import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, Check, Globe } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import {
  COUNTRIES,
  POPULAR_COUNTRY_CODES,
  CountryItem,
} from '../../services/telegram/countries';

interface CountryPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: CountryItem) => void;
  selectedCountryCode: string; // e.g. "IN"
}

export const CountryPickerModal: React.FC<CountryPickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  selectedCountryCode,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, typography, radii } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Popular list
  const popularCountries = useMemo(() => {
    return POPULAR_COUNTRY_CODES.map((code) =>
      COUNTRIES.find((c) => c.code === code)
    ).filter(Boolean) as CountryItem[];
  }, []);

  // Filtered countries based on search
  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    const cleanQ = q.replace(/^\+/, '');
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(cleanQ) ||
        c.dialCode.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelect = (item: CountryItem) => {
    onSelect(item);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.backdrop}>
        {/* Dismiss Backdrop Area */}
        <Pressable style={styles.dismissOverlay} onPress={handleClose} />

        {/* Modal Container */}
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderColor: colors.borderSubtle,
              borderTopLeftRadius: radii.xl || 24,
              borderTopRightRadius: radii.xl || 24,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Sheet Handle */}
          <View style={styles.handleContainer}>
            <View
              style={[
                styles.handle,
                { backgroundColor: colors.outlineVariant || '#383a48' },
              ]}
            />
          </View>

          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Globe size={18} color={colors.primary} />
              <Text
                style={[
                  typography.headlineSm,
                  { color: colors.onSurface, marginLeft: 8, fontWeight: '700' },
                ]}
              >
                Select Country Code
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              style={[
                styles.closeButton,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: colors.borderSubtle,
                borderRadius: radii.default,
              },
            ]}
          >
            <Search size={16} color={colors.onSurfaceVariant} />
            <TextInput
              style={[
                styles.searchInput,
                typography.bodyMd,
                { color: colors.onSurface },
              ]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search country name or code (+91, India...)"
              placeholderTextColor={colors.outline}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && Platform.OS !== 'ios' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={colors.outline} />
              </TouchableOpacity>
            )}
          </View>

          {/* Popular / Quick Selection Chips */}
          {!searchQuery && (
            <View style={styles.quickSelectContainer}>
              <Text
                style={[
                  typography.labelSm,
                  { color: colors.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.6 },
                ]}
              >
                QUICK SELECTION
              </Text>
              <View style={styles.chipsRow}>
                {popularCountries.map((c) => {
                  const isSelected = c.code === selectedCountryCode;
                  return (
                    <TouchableOpacity
                      key={c.code}
                      onPress={() => handleSelect(c)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? colors.primaryContainer
                            : colors.surfaceContainerHigh,
                          borderColor: isSelected ? colors.primary : 'transparent',
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chipFlag}>{c.flag}</Text>
                      <Text
                        style={[
                          typography.monoSm,
                          {
                            color: isSelected ? colors.onPrimaryContainer : colors.onSurface,
                            fontWeight: '600',
                            marginLeft: 4,
                          },
                        ]}
                      >
                        {c.dialCode}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Country List */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = item.code === selectedCountryCode;
              return (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    isSelected && {
                      backgroundColor: colors.surfaceContainer,
                    },
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.65}
                >
                  <View style={styles.countryInfo}>
                    <Text style={styles.flagText}>{item.flag}</Text>
                    <View style={styles.countryTexts}>
                      <Text
                        style={[
                          typography.bodyMd,
                          {
                            color: colors.onSurface,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          typography.bodySm,
                          { color: colors.onSurfaceVariant, fontSize: 11 },
                        ]}
                      >
                        Format: {item.format}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rightInfo}>
                    <View
                      style={[
                        styles.dialCodeBadge,
                        {
                          backgroundColor: isSelected
                            ? colors.primaryContainer
                            : colors.surfaceContainerHighest,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.monoSm,
                          {
                            color: isSelected
                              ? colors.onPrimaryContainer
                              : colors.primary,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {item.dialCode}
                      </Text>
                    </View>

                    {isSelected && (
                      <View style={styles.checkIcon}>
                        <Check size={16} color={colors.primary} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[typography.bodyMd, { color: colors.outline }]}>
                  No countries matching "{searchQuery}"
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  container: {
    maxHeight: '82%',
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    height: 40,
    paddingVertical: 0,
  },
  quickSelectContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipFlag: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    marginVertical: 1,
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  flagText: {
    fontSize: 22,
    marginRight: 12,
  },
  countryTexts: {
    flex: 1,
  },
  rightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dialCodeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  checkIcon: {
    width: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
});
