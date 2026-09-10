import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { BrandGradient } from '@/theme/tokens';

const LOGO = require('../../assets/images/magiz-mark.png');

/** The MAGIZ wordmark over a soft brand glow. */
export function BrandMark({ size = 132 }: { size?: number }) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <LinearGradient
        colors={[...BrandGradient]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={[styles.glow, { borderRadius: size / 2 }]}
      />
      <Image
        source={LOGO}
        style={{ width: size * 0.82, height: size * 0.82 }}
        contentFit="contain"
        // The mark never changes, so cache it in memory and skip the fade.
        cachePolicy="memory-disk"
        transition={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  glow: { ...StyleSheet.absoluteFill, opacity: 0.16 },
});
