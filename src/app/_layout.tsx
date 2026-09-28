import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/core/theme';
import { useAuthStore } from '@/stores/auth.store';

function RootLayoutNav() {
  const { isAuthenticated, isRestoringSession, restoreSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (isRestoringSession) return;
    if (!navigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthenticated, isRestoringSession, segments, router, navigationState?.key]);

  if (isRestoringSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.neutral.surface,
        },
        headerTintColor: colors.neutral.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: colors.neutral.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="sync-status"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="modules"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="pedidos"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="entregas"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="clientes"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="estoque"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="atividades"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="agenda"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(auth)/login"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={colors.neutral.background} />
      <RootLayoutNav />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.background,
  },
});
