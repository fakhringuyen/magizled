import * as Network from 'expo-network';

export type Reachability =
  | { state: 'checking' }
  | { state: 'online'; ms: number }
  | { state: 'offline'; reason: OfflineReason };

export type OfflineReason =
  | 'no-network'
  | 'not-wifi'
  | 'timeout'
  | 'refused'
  | 'bad-address';

export const OFFLINE_COPY: Record<OfflineReason, { title: string; body: string }> = {
  'no-network': {
    title: 'No network',
    body: 'Turn Wi-Fi on and join the Wi-Fi the LED board broadcasts.',
  },
  'not-wifi': {
    title: 'Not on Wi-Fi',
    body: 'This phone is on mobile data. Join the Wi-Fi the LED board broadcasts.',
  },
  timeout: {
    title: 'No answer from the board',
    body: 'This phone is on Wi-Fi but the board did not reply. The board Wi-Fi has no internet, so Android may be sending everything over mobile data instead.',
  },
  refused: {
    title: 'Wrong device at that address',
    body: 'Something answered but it was not the LED board. Check the address.',
  },
  'bad-address': {
    title: 'Address is not valid',
    body: 'Enter an IP address or host name, for example 192.168.2.2.',
  },
};

/**
 * Ask the controller itself instead of trusting the connectivity flag.
 * The original app gated on a generic "is connected" check, which is true on
 * mobile data as well, so it opened a page that could never load.
 */
export async function probe(url: string, timeoutMs = 4000): Promise<Reachability> {
  if (!url) return { state: 'offline', reason: 'bad-address' };

  const net = await Network.getNetworkStateAsync().catch(() => null);
  if (net && net.isConnected === false) {
    return { state: 'offline', reason: 'no-network' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    // Any HTTP status proves the controller answered. Only transport errors count as offline.
    await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    });
    return { state: 'online', ms: Date.now() - started };
  } catch (err) {
    const aborted = (err as Error)?.name === 'AbortError';
    if (aborted) {
      const onWifi = net?.type === Network.NetworkStateType.WIFI;
      return { state: 'offline', reason: onWifi ? 'timeout' : 'not-wifi' };
    }
    if (net && net.type !== Network.NetworkStateType.WIFI && net.isConnected) {
      return { state: 'offline', reason: 'not-wifi' };
    }
    // A refusal on Wi-Fi means something answered and it was not the board.
    // Calling that a timeout sent people hunting a mobile data problem.
    const msg = (err as Error)?.message ?? '';
    if (/refus|econnrefused|reset/i.test(msg)) {
      return { state: 'offline', reason: 'refused' };
    }
    return { state: 'offline', reason: 'timeout' };
  } finally {
    clearTimeout(timer);
  }
}
