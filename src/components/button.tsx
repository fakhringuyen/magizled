import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { PRESS_SPRING } from '@/components/motion';
import { tap } from '@/lib/haptics';
import { BrandGradient, HitSize, Palette, Radius, Space, Type } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  busy?: boolean;
  disabled?: boolean;
  full?: boolean;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  busy = false,
  disabled = false,
  full = false,
  accessibilityHint,
}: Props) {
  const inert = disabled || busy;
  const press = useSharedValue(0);
  // A spring reads as a physical press. Opacity alone reads as a flicker.
  const motion = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.03 }],
  }));
  // White on the brand gradient measured 2.93:1 at the blue end. Dark ink
  // measures 6.24:1 there and 5.61:1 in the middle.
  const tint =
    variant === 'primary'
      ? Palette.onBrand
      : variant === 'danger'
        ? Palette.danger
        : variant === 'ghost'
          ? Palette.textMuted
          : Palette.text;

  const body = (
    <View style={styles.row}>
      {busy && <ActivityIndicator size="small" color={tint} />}
      <Text style={[styles.label, { color: tint }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );

  return (
    <AnimatedPressable
      onPressIn={() => {
        if (!inert) press.value = withSpring(1, PRESS_SPRING);
      }}
      onPressOut={() => {
        press.value = withSpring(0, PRESS_SPRING);
      }}
      onPress={() => {
        if (inert) return;
        tap();
        onPress();
      }}
      disabled={inert}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inert, busy }}
      hitSlop={6}
      style={[
        styles.base,
        full && styles.full,
        variant !== 'primary' && styles[variant],
        inert && styles.inert,
        motion,
      ]}>
      {variant === 'primary' && (
        <LinearGradient
          colors={[...BrandGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {body}
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
  base: {
    minHeight: HitSize,
    paddingHorizontal: Space.xl,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  full: { alignSelf: 'stretch' },
  secondary: { backgroundColor: Palette.surfaceHigh, borderWidth: 1, borderColor: Palette.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Palette.danger },
  inert: { opacity: 0.45 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  label: { ...Type.label, fontSize: 15, letterSpacing: 0.2 },
});
