// components/common/FilterChip.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  count?: number;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  active,
  onPress,
  count,
  icon,
  style,
}) => {
  const { colors, typography, radii } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderRadius: radii.full,
          backgroundColor: active ? colors.primary : colors.surfaceContainerHigh,
          borderColor: active ? colors.primary : colors.borderSubtle,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          typography.labelSm,
          {
            color: active ? colors.onPrimary : colors.onSurfaceVariant,
            fontWeight: active ? '600' : '500',
          },
        ]}
      >
        {label}
      </Text>
      {count !== undefined && (
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: active ? colors.onPrimaryContainer : colors.surfaceContainerLowest,
            },
          ]}
        >
          <Text
            style={[
              typography.monoSm,
              {
                fontSize: 10,
                lineHeight: 12,
                color: active ? colors.primaryFixed : colors.onSurfaceVariant,
              },
            ]}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  iconContainer: {
    marginRight: 6,
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
});
