import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Palette, Radius, Space, Type } from '@/theme/tokens';

type Props = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Replaces the original exit dialog, whose two choices were "IYA" and
 * "#MAGIZ" -- neither of which reads as cancel.
 */
export function Confirm({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCancel}>
      <Pressable style={styles.scrim} onPress={onCancel} accessibilityLabel="Dismiss">
        <Pressable style={styles.card} onPress={() => {}} accessible={false} accessibilityViewIsModal>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <View style={styles.actions}>
            <Button label={cancelLabel} onPress={onCancel} variant="secondary" />
            <Button
              label={confirmLabel}
              onPress={onConfirm}
              variant={destructive ? 'danger' : 'primary'}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(3,3,8,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Space.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '86%',
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Space.xl,
    gap: Space.md,
  },
  title: { ...Type.title, color: Palette.text },
  body: { ...Type.body, color: Palette.textMuted },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Space.md, marginTop: Space.sm },
});
