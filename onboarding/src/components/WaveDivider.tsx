import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/theme';

interface WaveDividerProps {
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

// Deliberately uneven crests so it reads as drawn by hand, not generated.
const MAIN =
  'M2 13 C 18 6, 34 5, 52 12 S 86 21, 108 12 S 140 3, 166 11 S 198 20, 222 12 S 252 5, 276 12 S 318 19, 358 9';
const ECHO = 'M40 21 C 56 16, 70 16, 86 20 S 116 25, 134 20';

export function WaveDivider({ color, height = 24, style }: WaveDividerProps) {
  const { colors } = useTheme();
  const stroke = color ?? colors.accent;

  return (
    <View
      style={[{ height, width: '100%' }, style]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%" viewBox="0 0 360 26" preserveAspectRatio="none">
        <Path d={MAIN} stroke={stroke} strokeWidth={2.75} strokeLinecap="round" fill="none" />
        <Path d={ECHO} stroke={stroke} strokeOpacity={0.45} strokeWidth={2} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}
