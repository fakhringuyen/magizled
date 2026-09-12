# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Project notes

Personal hobby app by Fakhri. It has no link to any client folder under `~/Documents`.
Launch Claude Code from this folder so it gets its own memory scope.

The app is **MagizLED**, rebuilt on 10 Sep 2026 from `~/Downloads/Programs/MagizLED.apk`.
That APK was MIT App Inventor (`appinventor.ai_zamzamy_ig.MagizAutos`, v1.0). It wrapped the
LED controller's own web page at `http://192.168.2.2` in a WebViewer, behind a generic
connectivity check. The rebuild keeps that job and fixes the gate, the back button, the exit
dialog, and the missing error states. `README.md` holds the before and after table.
The decoded original is described there; the APK itself is not in this repo.

### Stack on 3 Sep 2026

| Part | Version |
|---|---|
| Expo SDK | 57 (`expo` 57.0.21) |
| React Native | 0.86.3 |
| React | 19.2.3 |
| TypeScript | 6.0 |
| Router | expo-router, file routes in `src/app` |
| React Compiler | on (`experiments.reactCompiler`) |
| WebView | `react-native-webview` 13.16.1 |
| Storage | `@react-native-async-storage/async-storage` 2.2.0 |
| Icons | `react-native-svg` 15.15.4, hand drawn in `src/components/icons.tsx` |

### Run it

- `npm run ios` opens the app in Expo Go on the booted iOS Simulator.
  Boot one first: `xcrun simctl boot "iPhone 17 Pro"; open -a Simulator`.
- `npm start`, then scan the QR code with the Expo Go app on the Android phone.
  Phone and Mac must be on the same Wi-Fi. If the QR fails, run `npx expo start --tunnel`.
- `npm run web` serves the web build at http://localhost:8081.
- `npx expo run:ios` builds a development build with Xcode and CocoaPods.
  Use it once a library is not inside Expo Go.
- `npm run android` fails until Android Studio and the SDK are installed. They are not yet.

### Node

- Node 20.20.2 is the nvm default and it works here. RN 0.86 accepts `^20.19.4`. `.nvmrc` says 20.
- Node 24.20.0 is installed via nvm for the next SDK. RN 0.87 needs Node 22.13+ or 24.3+.
  Run `nvm use 24` only when upgrading. Keep the nvm default at 20, because the global
  npm tools for other projects live in the Node 20 prefix.
- After any SDK upgrade, read `node_modules/react-native/package.json` engines.
  The registry's latest React Native is not the one Expo pins.

### Rules

- UI text is English.
- Simulator screenshots: `xcrun simctl io booted screenshot out.png`.
  The Claude simulator tool's screenshot action crashes on this Mac. Its tap and text actions work.
- 8 GB RAM. Run one simulator or emulator at a time. Close the Android emulator before the iOS one.
- Read the versioned Expo docs linked at the top before writing native or config code.
- `StyleSheet.absoluteFillObject` is GONE in React Native 0.86. Use `StyleSheet.absoluteFill`,
  which is now the plain frozen object, so both `style={StyleSheet.absoluteFill}` and
  `{ ...StyleSheet.absoluteFill }` work.
- `android.usesCleartextTraffic` is NOT a valid `app.json` key in SDK 57. It lives in the
  `expo-build-properties` plugin. `android.edgeToEdgeEnabled` is gone too, since edge to edge
  is always on. `npx expo-doctor` catches both.
- `useKeepAwake(undefined)` still holds the default lock, so it cannot be used to turn the
  lock off. Drive `activateKeepAwakeAsync` and `deactivateKeepAwake` from an effect instead.

### Testing without the LED hardware

Serve a page from the Mac and point the app's Settings address at `<mac-ip>:8099`:

```
python3 -m http.server 8099 --bind 0.0.0.0
```

Real firmware pages ship no viewport tag and assume a desktop width, so test with a fixed
width page. `src/app/control.tsx` injects a viewport tag only when the page has none.

### Android APK

Builds run on EAS Cloud. This Mac has no JDK, no Android SDK, and no Android Studio.
A local Gradle build is not possible until those are installed.

| Command | Profile | Output |
|---|---|---|
| `npm run build:apk` | preview | APK for direct install on the phone |
| `npm run build:dev` | development | APK with the dev client, for `expo start --dev-client` |
| `npm run build:prod` | production | AAB for the Play Store |

- `eas-cli` 24.0.0 is installed GLOBALLY in the Node 20 prefix, next to `vercel` and
  `lark-cli`. Call it as `eas`.
- Never add `eas-cli` to the project dependencies. EAS installs the project dependencies
  on the build machine, so a local `eas-cli` gets installed there too. It adds 386 packages
  and pulls `dtrace-provider`, which needs a node-gyp compile. That broke build
  `e6b00374` in the Install dependencies phase on 10 Sep 2026.
- Log in once with `eas login`, then `eas init` to create the project on Expo.
- Android package is `com.fakhri626.magizled`, set in `app.json`. It was
  `com.fakhri626.mobileapp` until 10 Sep 2026. A package change makes EAS create a NEW
  keystore, and an installed build of the old package will not upgrade in place. Uninstall
  the old one on the phone first. It cannot change after a Play Store upload.
- EAS creates and stores the signing keystore on Expo servers on the first build.
  Back it up with `eas credentials`. A lost keystore blocks all future Play Store updates.
- `versionCode` starts at 1 in `app.json`. The production profile increments it automatically.
- Install the APK on the phone by opening the EAS build link on the phone itself.
  `adb install` needs platform-tools, which are not installed.

### Building the APK

- Build locally: `eas build -p android --profile preview --local --output MagizLED-<version>.apk`.
  Gradle runs on this Mac. The keystore still comes from the Expo server, so the first build of
  a session needs internet. A local APK and a cloud APK carry the same signature.
- **NEVER start a second build before the first one has finished.** Hit 12 Sep 2026: two local
  builds ran at once on this 8 GB machine, both writing to `MagizLED-preview.apk`. One took
  **41m 54s** instead of the usual 9 to 17 minutes, and the older build overwrote the newer
  artifact. Check `pgrep -f "eas-cli-local-build|gradlew"` before starting one.
- **Put the version in the output filename**, so a stale build cannot masquerade as the current
  one. Verify the artifact after every build:
  `apkanalyzer manifest print <file>.apk | grep -E "versionCode|versionName"`.
- Cloud builds (`eas build` without `--local`) sat in the free queue for 75 minutes without
  starting on 10 Sep 2026. Prefer local.

- **KSP runs out of metaspace on this machine and fails the build.** Adding `expo-updates` pulled
  in KSP, and the build died with `e: [ksp] java.lang.OutOfMemoryError: Metaspace` plus
  `Execution failed for BuildToolsApiClasspathEntrySnapshotTransform ... > Metaspace`. Neither
  message names memory in the headline, so it reads like a code fault. The fix lives in
  `~/.gradle/gradle.properties`, NOT in `android/gradle.properties`, because prebuild regenerates
  that file and Gradle reads the user one afterwards so it wins:

  ```
  org.gradle.jvmargs=-Xmx3072m -XX:MaxMetaspaceSize=1536m -Dfile.encoding=UTF-8
  kotlin.daemon.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=1024m
  org.gradle.parallel=false
  org.gradle.workers.max=2
  ```

  `kotlin.daemon.jvmargs` is the one that matters, because KSP runs inside the Kotlin daemon,
  a separate JVM from Gradle. Build time went from a 9m 44s failure to a 9m 37s success.

### Over the air updates

- Updates ship with `eas update --branch preview`. CodePush is not an option; Microsoft shut the
  hosted service down on 31 March 2025.
- `runtimeVersion` uses the **fingerprint** policy. `eas update:configure` picks `appVersion` by
  default, which breaks every update here because each release bumps the version.
- Only JavaScript and assets travel this way. A new native module, a permission change, an SDK
  upgrade or a package rename still needs a fresh APK.
- **The board broadcasts its own Wi-Fi with no internet**, so the automatic check on launch fails
  whenever the phone is on the board. About carries a manual Check for updates button for that.

### Testing without the board

`src/lib/magiz-api.ts` holds the firmware contract, so it can be tested without hardware. The
mock board and the 39 assertion suite live in the session scratchpad, not in the repo. To rebuild
them, serve `GET /data` as `key=value&...` and accept `POST /message`, then log every request and
assert on the exact payload. The case that matters most: mode 7 must carry all three messages,
`parameter4` and every checked animation, because an HTML form omits unchecked boxes and the
board reads a missing one as off.

### Git

- Identity is the personal GitHub account `fakhri626`, set per repo:
  `10796327+fakhri626@users.noreply.github.com`. Never the SATU work account.
- No global git identity exists on this Mac. Check `git config user.email` after a clone.
