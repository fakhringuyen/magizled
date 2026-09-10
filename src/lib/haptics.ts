import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

export function tap() {
  if (supported) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function success() {
  if (supported) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function warn() {
  if (supported) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}
