# MagizLED

A rebuild of the MagizLED Android app. The original was built in MIT App Inventor
(`appinventor.ai_zamzamy_ig.MagizAutos`, v1.0). This version is Expo SDK 57 and
React Native.

The app is a controller front end. It finds the LED controller on the local
Wi-Fi and shows the controller's own web page inside the app.

## Screens

| Route | Purpose |
|---|---|
| `/` | Connect. Probes the controller and reports why it is not answering. |
| `/control` | The controller's web page, with reload, in-page back, and error recovery. |
| `/settings` | Controller address, auto open, keep the screen on. |

## What changed from the original

| Area | Original | Now |
|---|---|---|
| Reachability | `Net1.IsConnected`, true on mobile data too | Real HTTP probe of the controller, with a 4 second timeout |
| Address | `http://192.168.2.2` hard coded | Editable and saved, with a Test connection button |
| Back button | Always opened the exit dialog | Walks the page history first |
| Exit dialog | Buttons "IYA" and "#MAGIZ" | "Close" and "Stay" |
| Load failure | Blank page | Error pane with the reason, Retry, and Change address |
| Load progress | None | Progress bar |
| Loading art | 4 Lottie files, 2 at 1920x1080 | Reanimated rings, no asset |
| Screen sleep | Slept while you adjusted the lights | Optional keep awake |
| Off-device links | Opened inside the WebView with no way back | Open in the system browser |
| Page fit | Firmware pages render zoomed out | A viewport tag is injected when the page has none |
| API level | `minSdk 13`, `targetSdk 33` | `minSdk 24`, `targetSdk 36` |
| Permissions | INTERNET, ACCESS_NETWORK_STATE, legacy storage flags | INTERNET, ACCESS_NETWORK_STATE, VIBRATE. Camera, microphone, storage and draw-over-other-apps are blocked. |

## Run it

```bash
npm run ios
```

```bash
npm start
```

Then scan the QR code with Expo Go. The phone and the Mac must share a network.

## Build the Android APK

```bash
npm run build:apk
```

Builds run on EAS Cloud. This Mac has no JDK and no Android SDK, so a local
Gradle build is not possible. See `AGENTS.md`.

## Testing without the hardware

Serve any page on the Mac and point the app at it:

```bash
python3 -m http.server 8099 --bind 0.0.0.0
```

Set the address in Settings to `<your-mac-ip>:8099`.
