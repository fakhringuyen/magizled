import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Palette } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Palette.bg,
    card: Palette.bgElevated,
    border: Palette.border,
    primary: Palette.magenta,
    text: Palette.text,
    notification: Palette.magenta,
  },
};

export default function RootLayout() {
  useEffect(() => {
    // Paint the window behind the React tree so rotation and modals never flash white.
    SystemUI.setBackgroundColorAsync(Palette.bg).catch(() => {});
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Palette.bg }}>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: Palette.bg },
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="control" />
          <Stack.Screen name="classic" />
          <Stack.Screen
            name="about"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="api-log"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="settings"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
