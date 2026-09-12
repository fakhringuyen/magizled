import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Palette } from '@/theme/tokens';

/** One spring, used everywhere, so every press feels like the same app. */
export const PRESS_SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

/** Cards arrive in order rather than all at once. */
export function Appear({
  index = 0,
  children,
  style,
}: {
  index?: number;
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <Animated.View entering={FadeIn.duration(260).delay(Math.min(index, 6) * 55)} style={style}>
      {children}
    </Animated.View>
  );
}

/** Breathes while the app is waiting, holds still once it is not. */
export function StatusDot({ color, busy }: { color: string; busy: boolean }) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (!busy) {
      cancelAnimation(t);
      t.value = withTiming(0, { duration: 200 });
      return;
    }
    t.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    return () => cancelAnimation(t);
  }, [busy, t]);

  const halo = useAnimatedStyle(() => ({
    opacity: 0.45 * t.value,
    transform: [{ scale: 1 + t.value * 1.6 }],
  }));

  return (
    <View style={styles.dotWrap}>
      <Animated.View style={[styles.halo, { backgroundColor: color }, halo]} />
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

/**
 * A saved tick that arrives and leaves on its own. Keeping it mounted and
 * animating opacity avoids the header jumping as text swaps in and out.
 */
export function SavedFlash({ visible }: { visible: boolean }) {
  const v = useSharedValue(0);

  useEffect(() => {
    v.value = withTiming(visible ? 1 : 0, { duration: 200 });
  }, [visible, v]);

  const style = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateY: (1 - v.value) * 6 }],
  }));

  return (
    <Animated.View style={[styles.saved, style]} pointerEvents="none">
      <View style={styles.tick} />
    </Animated.View>
  );
}

/** Nudges a value when it changes, so a remote change is not silent. */
export function useBump(dep: unknown) {
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = withSequence(
      withTiming(1.12, { duration: 90, easing: Easing.out(Easing.quad) }),
      withSpring(1, PRESS_SPRING)
    );
  }, [dep, s]);
  return useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
}

const styles = StyleSheet.create({
  dotWrap: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  halo: { ...StyleSheet.absoluteFill, borderRadius: 5 },
  saved: { flexDirection: 'row', alignItems: 'center' },
  tick: {
    width: 9,
    height: 5,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Palette.online,
    transform: [{ rotate: '-45deg' }],
  },
});
