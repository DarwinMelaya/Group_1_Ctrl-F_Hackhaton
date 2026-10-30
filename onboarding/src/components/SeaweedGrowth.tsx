import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme';

// A seaweed line drawn in 2D: the strands grow with the cycle (0..1). Decorative.
export function SeaweedGrowth({ progress, width = 96 }: { progress: number; width?: number }) {
  const g = 0.25 + Math.max(0, Math.min(1, progress)) * 0.75;
  const strand = (x: number, h: number, lean: number) => {
    const top = 52 - h * g;
    return `M${x} 52 C ${x + lean} ${52 - (h * g) / 3}, ${x - lean} ${52 - (h * g * 2) / 3}, ${x + lean / 2} ${top}`;
  };
  return (
    <Svg width={width} height={width * 0.6} viewBox="0 0 100 60" accessible={false}>
      <Path d="M2 54 L98 54" stroke={colors.sea700} strokeWidth={2} strokeLinecap="round" />
      <Path d="M8 54 l0 4 M50 54 l0 4 M92 54 l0 4" stroke={colors.sea700} strokeWidth={2} strokeLinecap="round" />
      {[
        [16, 40, 5],
        [30, 46, -6],
        [44, 36, 4],
        [58, 48, -5],
        [72, 38, 6],
        [86, 44, -4],
      ].map(([x, h, lean]) => (
        <Path key={x} d={strand(x!, h!, lean!)} stroke={colors.mangrove600} strokeWidth={4} strokeLinecap="round" fill="none" />
      ))}
    </Svg>
  );
}
