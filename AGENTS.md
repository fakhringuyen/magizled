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

### Git

- Identity is the personal GitHub account `fakhri626`, set per repo:
  `10796327+fakhri626@users.noreply.github.com`. Never the SATU work account.
- No global git identity exists on this Mac. Check `git config user.email` after a clone.
