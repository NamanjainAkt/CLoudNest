// components/common/TopHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ShieldCheck, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { BrandMark } from './BrandMark';

export interface TopHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  showEnclaveBadge?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  title = 'CloudNest',
  subtitle,
  showBack = false,
  onBackPress,
  rightAction,
  showEnclaveBadge = false,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, typography } = useTheme();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.headerContainer,
        {
          paddingTop: Math.max(insets.top, 12),
          backgroundColor: colors.surface,
          borderBottomColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.leftGroup}>
          {showBack ? (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <ArrowLeft size={20} color={colors.onSurface} />
            </TouchableOpacity>
          ) : (
            <BrandMark size={32} />
          )}

          <View style={styles.titleColumn}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  typography.headlineSm,
                  { color: colors.onSurface, letterSpacing: -0.3 },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {!showBack && (
                <ShieldCheck
                  size={15}
                  color={colors.primary}
                  style={styles.shieldIcon}
                />
              )}
            </View>
            {subtitle && (
              <Text style={[typography.labelSm, { color: colors.onSurfaceVariant }]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {rightAction ? (
          <View style={styles.rightGroup}>
            {rightAction}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  titleColumn: {
    marginLeft: 8,
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldIcon: {
    marginLeft: 5,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
