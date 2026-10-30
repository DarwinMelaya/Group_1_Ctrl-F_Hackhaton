import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '@/theme';

interface HeroIllustrationProps {
  height: number;
}

// A banca on the water with the three Tres Reyes islets on the horizon.
// The sun sits off-centre on purpose to give the welcome screen some lean.
export function HeroIllustration({ height }: HeroIllustrationProps) {
  return (
    <View
      style={{ height, width: '100%' }}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Illustration of a banca on calm water with small islands on the horizon"
    >
      <Svg width="100%" height="100%" viewBox="0 0 360 300" preserveAspectRatio="xMidYMax slice">
        <Circle cx={268} cy={92} r={58} fill={colors.coral100} />
        <Circle cx={268} cy={92} r={36} fill={colors.coral300} />

        <Path
          d="M206 58 q6 -7 12 0 q6 -7 12 0 M232 80 q4 -5 9 0 q4 -5 9 0"
          stroke={colors.sea700}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />

        {/* Tres Reyes: Gaspar, Melchor, Baltazar */}
        <Path d="M20 172 C 28 150, 46 146, 58 172 Z" fill={colors.sea300} />
        <Path d="M54 172 C 62 158, 76 157, 84 172 Z" fill={colors.sea300} />
        <Path d="M82 172 C 87 164, 95 164, 100 172 Z" fill={colors.sea300} />

        <Path d="M0 170 L360 170 L360 300 L0 300 Z" fill={colors.reef100} />
        <Path
          d="M0 197 C 40 187, 72 191, 104 199 S 170 207, 210 197 S 292 185, 360 195 L360 300 L0 300 Z"
          fill={colors.reef300}
        />

        {/* Banca: mast, sail, hull, and the katig outrigger */}
        <Path d="M152 190 L152 124" stroke={colors.sea900} strokeWidth={3} strokeLinecap="round" />
        <Path d="M155 128 L155 182 L194 177 Z" fill={colors.coral500} />
        <Path
          d="M100 186 C 128 200, 176 200, 206 183 C 200 195, 180 203, 152 203 C 126 203, 108 197, 100 186 Z"
          fill={colors.sea900}
        />
        <Path
          d="M78 207 L228 207 M130 199 L120 207 M178 199 L188 207"
          stroke={colors.sea900}
          strokeWidth={3}
          strokeLinecap="round"
        />

        <Path
          d="M0 216 C 36 207, 78 211, 114 221 S 198 229, 238 215 S 318 205, 360 213 L360 300 L0 300 Z"
          fill={colors.reef500}
        />
        <Path
          d="M0 250 C 50 240, 96 248, 140 256 S 230 262, 280 248 S 340 242, 360 246 L360 300 L0 300 Z"
          fill={colors.sea900}
        />
        <Path
          d="M26 234 C 40 229, 52 229, 66 233 M250 230 C 262 226, 274 226, 288 230"
          stroke={colors.reef100}
          strokeOpacity={0.7}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <View style={styles.fish} pointerEvents="none">
        <MaterialCommunityIcons name="fish" size={26} color={colors.reef300} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fish: { position: 'absolute', bottom: '6%', left: '58%', transform: [{ scaleX: -1 }] },
});
