import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/button';
import { HitSize, Palette, Radius, Space, Type } from '@/theme/tokens';

type Props = {
  index: number | null;
  currentName: string;
  isOn: boolean;
  onSolo: () => void;
  onToggle: () => void;
  onRename: (name: string) => void;
  onClose: () => void;
};

/**
 * The firmware ships 41 animations and names none of them. Running one alone
 * is how you find out what it is; naming it is how you remember.
 */
export function AnimationSheet({
  index,
  currentName,
  isOn,
  onSolo,
  onToggle,
  onRename,
  onClose,
}: Props) {
  // The parent keys this component by index, so a fresh one mounts for every
  // animation and the initial value is already right. Syncing it from an
  // effect would cascade a second render for something known at mount.
  const [name, setName] = useState(currentName);

  const number = index === null ? '' : String(index + 1);

  return (
    <Modal
      visible={index !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.fill} behavior="padding">
      <Pressable
        style={styles.scrim}
        onPress={onClose}
        // Pressable is accessible by default, so this scrim used to become one
        // element wrapping the dialog and no child could be reached.
        accessible={false}
        accessibilityLabel="Dismiss">
        <Pressable style={styles.card} onPress={() => {}} accessible={false} accessibilityViewIsModal>
          <ScrollView
            contentContainerStyle={styles.cardInner}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Animation {number}</Text>
          <Text style={styles.body}>
            Run it on its own to see what it looks like, then give it a name you will recognise.
          </Text>

          <Button label="Run only this one" onPress={onSolo} full />

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={`Animation ${number}`}
              placeholderTextColor={Palette.textFaint}
              style={styles.input}
              maxLength={18}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => onRename(name)}
              accessibilityLabel={`Name for animation ${number}`}
            />
            <Text style={styles.hint}>Leave it empty to go back to the number.</Text>
          </View>

          <View style={styles.actions}>
            <Button label={isOn ? 'Turn off' : 'Turn on'} onPress={onToggle} variant="secondary" />
            <Button label="Save name" onPress={() => onRename(name)} />
          </View>
          </ScrollView>
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  cardInner: { gap: Space.lg },
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
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Space.xl,
    maxHeight: '86%',
  },
  title: { ...Type.title, color: Palette.text },
  body: { ...Type.body, color: Palette.textMuted },
  field: { gap: Space.sm },
  label: { ...Type.label, color: Palette.textFaint, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    ...Type.body,
    color: Palette.text,
    backgroundColor: Palette.bg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.borderStrong,
    paddingHorizontal: Space.md,
    minHeight: HitSize,
  },
  hint: { ...Type.caption, color: Palette.textFaint },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Space.md },
});
