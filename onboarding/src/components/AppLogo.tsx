import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { colors, fonts } from '@/theme';

// The MarAIne mark: a banca under the sun on two waves, in a rounded square. Flat, so it reads at any
// size. `withName` writes "MarAIne" inside the square, under the boat, for the welcome screen.
export function AppLogo({ size = 88, withName = false }: { size?: number; withName?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel={withName ? 'MarAIne' : 'MarAIne logo'}>
      <Rect x={0} y={0} width={100} height={100} rx={withName ? 22 : 24} fill={colors.sea900} />
      {withName ? (
        <>
          {/* The same mark, smaller and higher, leaving room for the name. */}
          <G transform="translate(19 2) scale(0.62)">
            <Mark />
          </G>
          <SvgText x={50} y={84} textAnchor="middle" fontFamily={fonts.display} fontSize={17} fill={colors.sand50}>
            MarAIne
          </SvgText>
        </>
      ) : (
        <Mark />
      )}
    </Svg>
  );
}

function Mark() {
  return (
    <>
      <Circle cx={66} cy={34} r={14} fill={colors.coral300} />
      {/* Sail and mast */}
      <Path d="M44 22 L44 62" stroke={colors.sand50} strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M47 25 L47 58 L68 56 Z" fill={colors.sand50} />
      {/* Hull */}
      <Path d="M24 62 C 38 70, 60 70, 76 61 C 72 68, 62 72, 50 72 C 38 72, 28 68, 24 62 Z" fill={colors.sand50} />
      {/* Waves */}
      <Path d="M12 80 C 22 74, 30 74, 40 80 S 58 86, 68 80 S 82 74, 88 78" stroke={colors.reef300} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M22 89 C 30 85, 38 85, 46 89 S 62 93, 72 88" stroke={colors.reef500} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    </>
  );
}
