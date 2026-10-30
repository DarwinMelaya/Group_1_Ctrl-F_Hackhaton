import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import type { CommunityIconName } from '@/constants/icons';
import { useTheme, type Tone } from '@/theme';

type BadgeSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<BadgeSize, { box: number; icon: number; radius: number }> = {
  sm: { box: 40, icon: 22, radius: 12 },
  md: { box: 52, icon: 28, radius: 14 },
  lg: { box: 88, icon: 46, radius: 20 },
  xl: { box: 120, icon: 64, radius: 28 },
};

interface IconBadgeProps {
  icon: CommunityIconName;
  tone?: Tone;
  size?: BadgeSize;
  // Solid uses the tone's strong colour as background, for overlapping accents.
  solid?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconBadge({ icon, tone = 'reef', size = 'md', solid = false, style }: IconBadgeProps) {
  const { tones, colors } = useTheme();
  const dims = SIZES[size];
  const { fg, bg } = tones[tone];

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: dims.box,
          height: dims.box,
          borderRadius: dims.radius,
          backgroundColor: solid ? fg : bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={dims.icon} color={solid ? colors.surface : fg} />
    </View>
  );
}
