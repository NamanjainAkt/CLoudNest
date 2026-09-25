// components/common/ProgressBar.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface MultiSegmentProgressProps {
  mediaPercent: number; // e.g. 63
  docsPercent: number;  // e.g. 26
  archivesPercent: number; // e.g. 11
  style?: ViewStyle;
}

export const MultiSegmentProgress: React.FC<MultiSegmentProgressProps> = ({
  mediaPercent,
  docsPercent,
  archivesPercent,
  style,
}) => {
  const { colors, radii } = useTheme();

  return (
    <View
      style={[
        styles.barTrack,
        {
          borderRadius: radii.full,
          backgroundColor: colors.surfaceContainerLowest,
        },
        style,
      ]}
    >
      <View
        style={{
          width: `${mediaPercent}%`,
          backgroundColor: colors.primary,
          height: '100%',
        }}
      />
      <View
        style={{
          width: `${docsPercent}%`,
          backgroundColor: colors.secondaryContainer,
          height: '100%',
        }}
      />
      <View
        style={{
          width: `${archivesPercent}%`,
          backgroundColor: colors.tertiary,
          height: '100%',
        }}
      />
    </View>
  );
};

export interface GlowingProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  style?: ViewStyle;
}

export const GlowingProgressBar: React.FC<GlowingProgressBarProps> = ({
  progress,
  height = 6,
  style,
}) => {
  const { colors, radii } = useTheme();
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View
      style={[
        styles.barTrack,
        {
          height,
          borderRadius: radii.full,
          backgroundColor: colors.surfaceContainerLowest,
        },
        style,
      ]}
    >
      <View
        style={{
          width: `${clampedProgress * 100}%`,
          height: '100%',
          backgroundColor: colors.primary,
          borderRadius: radii.full,
        }}
      >
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 8,
            backgroundColor: colors.secondary,
            borderRadius: radii.full,
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  barTrack: {
    width: '100%',
    height: 8,
    overflow: 'hidden',
    flexDirection: 'row',
  },
});
