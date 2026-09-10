# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Project notes

Personal hobby app by Fakhri. It has no link to any client folder under `~/Documents`.
Launch Claude Code from this folder so it gets its own memory scope.

### Stack on 3 Sep 2026

| Part | Version |
|---|---|
| Expo SDK | 57 (`expo` 57.0.19) |
| React Native | 0.86.3 |
| React | 19.2.3 |
| TypeScript | 6.0 |
| Router | expo-router, file routes in `src/app` |
| React Compiler | on (`experiments.reactCompiler`) |

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
- Android package is `com.fakhri626.mobileapp`, set in `app.json`.
  Change it before any Play Store upload. It cannot change after the first upload.
- EAS creates and stores the signing keystore on Expo servers on the first build.
  Back it up with `eas credentials`. A lost keystore blocks all future Play Store updates.
- `versionCode` starts at 1 in `app.json`. The production profile increments it automatically.
- Install the APK on the phone by opening the EAS build link on the phone itself.
  `adb install` needs platform-tools, which are not installed.

### Git

- Identity is the personal GitHub account `fakhri626`, set per repo:
  `10796327+fakhri626@users.noreply.github.com`. Never the SATU work account.
- No global git identity exists on this Mac. Check `git config user.email` after a clone.
