// components/file-manager/BreadcrumbBar.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Lock, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface BreadcrumbItem {
  id: string | null;
  label: string;
}

export interface BreadcrumbBarProps {
  items: BreadcrumbItem[];
  onSelect: (item: BreadcrumbItem) => void;
}

export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({ items, onSelect }) => {
  const { colors, typography, radii } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity
        onPress={() => onSelect({ id: null, label: 'Vault' })}
        style={styles.rootItem}
        activeOpacity={0.7}
      >
        <Lock size={12} color={colors.onSurfaceVariant} style={{ marginRight: 4 }} />
        <Text style={[typography.monoSm, { color: colors.onSurfaceVariant }]}>Vault</Text>
      </TouchableOpacity>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <View key={item.id || index} style={styles.crumbGroup}>
            <ChevronRight size={14} color={colors.outlineVariant} style={{ marginHorizontal: 4 }} />
            <TouchableOpacity
              onPress={() => onSelect(item)}
              activeOpacity={0.7}
              style={[
                styles.crumbButton,
                isLast && {
                  backgroundColor: colors.surfaceContainer,
                  borderRadius: radii.full,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                },
              ]}
            >
              <Text
                style={[
                  typography.monoSm,
                  {
                    color: isLast ? colors.primary : colors.onSurfaceVariant,
                    fontWeight: isLast ? '600' : '400',
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rootItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  crumbGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crumbButton: {
    paddingVertical: 2,
  },
});
