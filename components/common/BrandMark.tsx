// components/common/BrandMark.tsx
import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface BrandMarkProps {
  size?: number;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 32 }) => {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.24, overflow: 'hidden' }}>
      <Svg viewBox="0 0 100 100" width={size} height={size}>
        <Rect width="100" height="100" rx="24" fill="#0A0A0A" />
        <Path
          d="M50 24C38.954 24 30 32.954 30 44c0 1.25.115 2.473.336 3.659C26.068 49.332 23 53.794 23 59c0 7.18 5.82 13 13 13h28c8.837 0 16-7.163 16-16 0-7.85-5.656-14.379-13.113-15.727C65.918 33.398 58.82 24 50 24z"
          fill="url(#cloud_grad)"
        />
        <Path
          d="M50 48v14M44 54l6-6 6 6"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Defs>
          <LinearGradient id="cloud_grad" x1="23" y1="24" x2="77" y2="72" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#3B82F6" />
            <Stop offset="1" stopColor="#1D4ED8" />
          </LinearGradient>
        </Defs>
      </Svg>
    </View>
  );
};
