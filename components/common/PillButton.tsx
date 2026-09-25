// components/common/PillButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface PillButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
}

export const PillButton: React.FC<PillButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'right',
  loading = false,
  disabled = false,
  style,
  textStyle,
  size = 'md',
}) => {
  const { colors, typography, radii } = useTheme();

  const getContainerStyle = (): ViewStyle => {
    let bg = colors.primary;
    let border = 'transparent';
    let borderWidth = 0;

    if (variant === 'primary') {
      bg = colors.primaryContainer;
    } else if (variant === 'outline') {
      bg = colors.surfaceContainer;
      border = colors.borderSubtle;
      borderWidth = 1;
    } else if (variant === 'ghost') {
      bg = 'transparent';
    } else if (variant === 'destructive') {
      bg = colors.errorContainer;
    }

    const minHeight = size === 'sm' ? 36 : size === 'lg' ? 52 : 46;
    const paddingHorizontal = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;

    return {
      backgroundColor: bg,
      borderColor: border,
      borderWidth,
      borderRadius: radii.full,
      minHeight,
      paddingHorizontal,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getLabelColor = (): string => {
    if (variant === 'primary') return colors.onPrimaryContainer;
    if (variant === 'outline') return colors.onSurface;
    if (variant === 'ghost') return colors.primary;
    if (variant === 'destructive') return colors.onErrorContainer;
    return colors.onSurface;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getLabelColor()} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            style={[
              typography.labelMd,
              { color: getLabelColor(), fontWeight: '600' },
              textStyle,
            ]}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
