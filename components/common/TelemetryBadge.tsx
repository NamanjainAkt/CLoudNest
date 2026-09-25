// components/common/TelemetryBadge.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface TelemetryBadgeProps {
  label: string;
  variant?: 'enclave' | 'encrypted' | 'alert' | 'neutral';
  showPulse?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const TelemetryBadge: React.FC<TelemetryBadgeProps> = ({
  label,
  variant = 'enclave',
  showPulse = false,
  icon,
  style,
}) => {
  const { colors, typography, radii } = useTheme();

  let dotColor = colors.primary;
  let textColor = colors.onSurfaceVariant;
  let bgColor = colors.surfaceContainerHigh;

  if (variant === 'enclave') {
    dotColor = colors.primary;
    textColor = colors.onSurfaceVariant;
    bgColor = colors.surfaceContainerHigh;
  } else if (variant === 'encrypted') {
    dotColor = colors.secondary;
    textColor = colors.secondary;
    bgColor = colors.surfaceContainerHighest;
  } else if (variant === 'alert') {
    dotColor = colors.tertiary;
    textColor = colors.tertiary;
    bgColor = colors.surfaceContainerHigh;
  }

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: radii.full,
          backgroundColor: bgColor,
        },
        style,
      ]}
    >
      {showPulse && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[typography.monoSm, { color: textColor, fontSize: 10 }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  icon: {
    marginRight: 4,
  },
});
