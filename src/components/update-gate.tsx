import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';

import { usePathname } from 'expo-router';

import { Confirm } from '@/components/confirm';
import { success } from '@/lib/haptics';

/**
 * Announces a downloaded update wherever the person happens to be.
 *
 * expo-updates can fetch one in the background on launch, and without this the
 * only sign would be the app quietly behaving differently after some later
 * restart. The prompt makes that moment explicit and lets it wait.
 */
export function UpdateGate() {
  const { isUpdatePending } = Updates.useUpdates();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [restarting, setRestarting] = useState(false);

  // About is a modal route. A modal opened from the root renders behind it, so
  // showing this there would be invisible. That screen carries its own button.
  const coveredByModal = pathname === '/about' || pathname === '/settings';

  // Derived, not stored. Keeping it in state meant setting it from an effect,
  // which cascades a second render for something already known at render time.
  const visible = isUpdatePending && !dismissed && !restarting && !coveredByModal;

  useEffect(() => {
    if (visible) success();
  }, [visible]);

  return (
    <Confirm
      visible={visible}
      title="Update ready"
      body="A new version has finished downloading. Restart to use it. Nothing on the LED board changes."
      confirmLabel="Restart now"
      cancelLabel="Later"
      onConfirm={() => {
        setRestarting(true);
        Updates.reloadAsync().catch(() => {
          setRestarting(false);
          setDismissed(true);
        });
      }}
      // Asking again on every screen change would be nagging.
      onCancel={() => setDismissed(true)}
    />
  );
}
