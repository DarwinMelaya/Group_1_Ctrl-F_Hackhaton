import type { ReactElement, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  type RefreshControlProps,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

interface ScreenContainerProps {
  children: ReactNode;
  // Pinned below the scrolling content; holds the screen's main action.
  footer?: ReactNode;
  header?: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  // Pull-to-refresh, for scrolling screens only.
  refreshControl?: ReactElement<RefreshControlProps>;
}

export function ScreenContainer({
  children,
  footer,
  header,
  scroll = true,
  padded = true,
  edges = ['top', 'bottom', 'left', 'right'],
  contentStyle,
  refreshControl,
}: ScreenContainerProps) {
  const { colors, spacing } = useTheme();
  const horizontal = padded ? spacing.lg : 0;

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Android is edge-to-edge, so the window no longer resizes for the keyboard. */}
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        {header ? <View style={{ paddingHorizontal: spacing.md }}>{header}</View> : null}
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.grow,
              { paddingHorizontal: horizontal, paddingBottom: spacing.lg },
              contentStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControl}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, { paddingHorizontal: horizontal }, contentStyle]}>{children}</View>
        )}
        {footer ? (
          <View
            style={{
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.sm,
              paddingBottom: spacing.md,
              gap: spacing.xs,
            }}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
});
