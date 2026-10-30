import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { AskChat } from './AskChat';

const SIZE = 60;
const TAB_BAR = 64;
const MARGIN = 12;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// The round "Ask MarAIne" button floating above the tab bar on every main screen. Tapping it opens
// a floating chat window that can be dragged by its header and closed with the X. The window stays
// mounted after the first open, so the conversation is still there when it is reopened.
export function FloatingAsk() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { colors, radii } = useTheme();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);

  // Window size: most of the screen on a phone, a comfortable column on a wide browser.
  const panelW = Math.min(width - MARGIN * 2, 420);
  const panelH = Math.min(height - insets.top - insets.bottom - TAB_BAR - MARGIN * 3, 560);
  const bounds = useRef({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
  bounds.current = {
    minX: MARGIN - (width - panelW - MARGIN), // panel starts at the right edge (x = 0)
    maxX: 0,
    minY: insets.top + MARGIN - (height - insets.bottom - TAB_BAR - MARGIN - panelH),
    maxY: 0,
  };

  // Drag offset from the resting spot (bottom right, above the tab bar).
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const start = useRef({ x: 0, y: 0 });
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 2,
        onPanResponderGrant: () => {
          start.current = { x: x.value, y: y.value };
        },
        onPanResponderMove: (_, g) => {
          const b = bounds.current;
          x.value = clamp(start.current.x + g.dx, b.minX, b.maxX);
          y.value = clamp(start.current.y + g.dy, b.minY, b.maxY);
        },
      }),
    [x, y],
  );
  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }] }));

  // A rotated or resized screen can push the window out of view; pull it back in.
  useEffect(() => {
    const b = bounds.current;
    x.value = withSpring(clamp(x.value, b.minX, b.maxX));
    y.value = withSpring(clamp(y.value, b.minY, b.maxY));
  }, [width, height, x, y]);

  // The button bobs like a buoy with a slow ripple; both stop under reduced motion.
  const bob = useSharedValue(0);
  const ring = useSharedValue(0);
  const press = useSharedValue(1);
  useEffect(() => {
    if (reduce || open) return;
    bob.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true);
    ring.value = withRepeat(withSequence(withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 0 })), -1, false);
    return () => {
      cancelAnimation(bob);
      cancelAnimation(ring);
    };
  }, [bob, ring, reduce, open]);
  // The bubble can be dragged anywhere and snaps to the nearest side when let go. A short touch that
  // barely moves is a tap and opens the chat.
  const bx = useSharedValue(0);
  const by = useSharedValue(0);
  const bubbleStart = useRef({ x: 0, y: 0 });
  const dragged = useRef(false);
  const bubbleBounds = useRef({ minX: 0, minY: 0 });
  bubbleBounds.current = {
    minX: -(width - SIZE - 32),
    minY: -(height - insets.top - (TAB_BAR + insets.bottom + MARGIN + 4) - SIZE - 16),
  };
  const openChat = () => {
    setOpened(true);
    setOpen(true);
  };
  const bubblePan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragged.current = false;
          bubbleStart.current = { x: bx.value, y: by.value };
          press.value = withTiming(0.92, { duration: 90 });
        },
        onPanResponderMove: (_, g) => {
          if (!dragged.current && Math.abs(g.dx) + Math.abs(g.dy) < 6) return;
          dragged.current = true;
          const b = bubbleBounds.current;
          bx.value = clamp(bubbleStart.current.x + g.dx, b.minX, 0);
          by.value = clamp(bubbleStart.current.y + g.dy, b.minY, 0);
        },
        onPanResponderRelease: () => {
          press.value = withTiming(1, { duration: 140 });
          if (!dragged.current) {
            openChat();
            return;
          }
          // Snap to whichever side is closer, with a soft spring.
          const b = bubbleBounds.current;
          bx.value = withSpring(bx.value < b.minX / 2 ? b.minX : 0, { damping: 18, stiffness: 180 });
        },
        onPanResponderTerminate: () => {
          press.value = withTiming(1, { duration: 140 });
        },
      }),
    // openChat only sets state; the responder is created once.
    [bx, by, press],
  );

  const float = useAnimatedStyle(() => ({
    transform: [{ translateX: bx.value }, { translateY: by.value - bob.value * 4 }, { scale: press.value }],
  }));
  const ripple = useAnimatedStyle(() => ({ opacity: 0.45 * (1 - ring.value), transform: [{ scale: 1 + ring.value * 0.45 }] }));

  const bottom = TAB_BAR + insets.bottom + MARGIN;

  return (
    <>
      {opened ? (
        <Animated.View
          pointerEvents={open ? 'auto' : 'none'}
          style={[
            styles.panel,
            {
              right: MARGIN,
              bottom,
              width: panelW,
              height: panelH,
              borderRadius: radii.lg,
              backgroundColor: colors.background,
              borderColor: colors.border,
              display: open ? 'flex' : 'none',
            },
            panelStyle,
          ]}
          accessibilityViewIsModal={open}
        >
          <Animated.View key={String(open)} entering={reduce ? undefined : ZoomIn.duration(180)} style={styles.fill}>
            <AskChat onClose={() => setOpen(false)} dragHandlers={pan.panHandlers} />
          </Animated.View>
        </Animated.View>
      ) : null}

      {open ? null : (
        <Animated.View exiting={reduce ? undefined : FadeOut.duration(120)} pointerEvents="box-none" style={[styles.wrap, { right: 16, bottom: bottom + 4 }, float]}>
          <Animated.View pointerEvents="none" style={[styles.ripple, { borderColor: colors.selected }, ripple]} />
          <View
            {...bubblePan.panHandlers}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Ask MarAIne"
            accessibilityHint="Opens a chat about the sea, weather, places and rules. You can drag it to move it."
            accessibilityActions={[{ name: 'activate' }]}
            onAccessibilityAction={openChat}
            style={[styles.button, { backgroundColor: colors.primary, borderColor: colors.surface }]}
          >
            <MaterialCommunityIcons name="chat-question-outline" size={28} color={colors.textOnPrimary} />
          </View>
        </Animated.View>
      )}
    </>
  );
}

const shadow = {
  shadowColor: '#0E2A3B',
  shadowOpacity: 0.25,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 10,
};

const styles = StyleSheet.create({
  panel: { position: 'absolute', zIndex: 60, borderWidth: 1.5, overflow: 'hidden', ...shadow },
  fill: { flex: 1 },
  wrap: { position: 'absolute', width: SIZE, height: SIZE, zIndex: 50 },
  ripple: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 2 },
  button: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 3, alignItems: 'center', justifyContent: 'center', ...shadow },
});

