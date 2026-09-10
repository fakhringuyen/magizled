import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Palette } from '@/theme/tokens';

const DURATION = 2000;

function Ring({ delay, size, color }: { delay: number; size: number; color: string }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) }), -1, false)
    );
    return () => cancelAnimation(t);
  }, [delay, t]);

  const style = useAnimatedStyle(() => ({
    opacity: (1 - t.value) * 0.55,
    transform: [{ scale: 0.55 + t.value * 0.75 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2, borderColor: color },
        style,
      ]}
    />
  );
}

/**
 * Searching indicator. Replaces the four Lottie files the original shipped,
 * two of which were 1920x1080 compositions.
 */
export function Pulse({ size = 190, active = true }: { size?: number; active?: boolean }) {
  if (!active) return null;
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Ring delay={0} size={size} color={Palette.blue} />
      <Ring delay={DURATION / 3} size={size} color={Palette.violet} />
      <Ring delay={(DURATION / 3) * 2} size={size} color={Palette.magenta} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 1.5 },
});
