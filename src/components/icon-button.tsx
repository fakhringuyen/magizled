import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { tap } from '@/lib/haptics';
import { HitSize, Palette, Radius } from '@/theme/tokens';

type Props = {
  children: ReactNode;
  onPress: () => void;
  label: string;
  disabled?: boolean;
  tone?: 'plain' | 'filled';
};

export function IconButton({ children, onPress, label, disabled, tone = 'plain' }: Props) {
  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        tap();
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        tone === 'filled' && styles.filled,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: HitSize,
    height: HitSize,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: { backgroundColor: Palette.surfaceHigh, borderWidth: 1, borderColor: Palette.border },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.6, backgroundColor: Palette.surface },
});
