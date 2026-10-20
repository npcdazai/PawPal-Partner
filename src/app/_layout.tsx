import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { MascotProvider } from '../mascot/MascotProvider';
import { PartnerProvider } from '../partner/PartnerProvider';
import { colors } from '../theme/colors';

/**
 * Splash → KYC → Care Profile slide in a stack; the Earnings and Profile &
 * Bank tabs sit in one '(tabs)' screen of it. Barnaby lives inside each
 * screen's <MascotDockSlot />, and MascotProvider sends his actions to the
 * focused screen's slot.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <MascotProvider>
      <PartnerProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: colors.canvas },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Pawsome Partner' }} />
          <Stack.Screen name="register-kyc" options={{ title: 'Identity & Trust' }} />
          <Stack.Screen name="register-profile" options={{ title: 'Care Profile' }} />
          <Stack.Screen name="(tabs)" options={{ title: 'Partner Hub', gestureEnabled: false }} />
        </Stack>
      </PartnerProvider>
    </MascotProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
});
