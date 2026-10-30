import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { colors, useTheme } from '@/theme';

import { AppText } from './AppText';

interface EmptyStateProps {
  title: string;
  body: string;
  art?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, body, art = <Banyera />, action }: EmptyStateProps) {
  const { spacing } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg, paddingHorizontal: spacing.md }}>
      {art}
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      <AppText variant="caption" color="textMuted" align="center">
        {body}
      </AppText>
      {action ? <View style={{ alignSelf: 'stretch', marginTop: spacing.xs }}>{action}</View> : null}
    </View>
  );
}

// An empty banyera (the tub catch is landed in), with one fish waiting beside it.
export function Banyera({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.62} viewBox="0 0 160 100" accessible={false}>
      <Ellipse cx={80} cy={92} rx={66} ry={6} fill={colors.sand200} />
      <Path d="M28 40 L132 40 L120 88 C 118 92, 114 94, 110 94 L50 94 C 46 94, 42 92, 40 88 Z" fill={colors.sea500} />
      <Path d="M22 36 C 22 32, 26 30, 30 30 L130 30 C 134 30, 138 32, 138 36 L138 40 L22 40 Z" fill={colors.sea700} />
      <Path d="M46 52 L114 52 M50 66 L110 66 M54 80 L106 80" stroke={colors.sea300} strokeWidth={2} strokeLinecap="round" strokeOpacity={0.6} />
      {/* The fish, a little crooked on purpose. */}
      <Path d="M118 22 C 128 12, 146 12, 152 20 C 146 28, 128 30, 118 22 Z" fill={colors.reef500} />
      <Path d="M118 22 L108 14 L110 22 L106 30 Z" fill={colors.reef500} />
      <Path d="M145 19 L145.5 19" stroke={colors.sea900} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}
