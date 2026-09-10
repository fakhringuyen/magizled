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
    body: 'Turn on Wi-Fi and join the Magiz access point.',
  },
  'not-wifi': {
    title: 'Not on Wi-Fi',
    body: 'Join the Magiz Wi-Fi. The controller is only reachable on its own network.',
  },
  timeout: {
    title: 'No answer from the controller',
    body: 'The Wi-Fi is up but the controller did not reply. If Android warns that this Wi-Fi has no internet, choose to stay connected, or turn mobile data off.',
  },
  refused: {
    title: 'Controller refused the connection',
    body: 'Something answered at that address but not the controller page. Check the address.',
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
    return { state: 'offline', reason: 'timeout' };
  } finally {
    clearTimeout(timer);
  }
}
