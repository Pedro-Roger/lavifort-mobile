import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radii, minTouchTarget } from '@/core/theme';
import { useAuthStore } from '@/stores/auth.store';
import { Button, Input, Card } from '@/components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleLogin = async () => {
    clearError();
    setValidationError(null);

    if (!email.trim()) {
      setValidationError('Por favor, informe seu e-mail.');
      return;
    }

    if (!password) {
      setValidationError('Por favor, informe sua senha.');
      return;
    }

    const success = await login({
      email: email.trim(),
      password,
    });

    if (success) {
      router.replace('/');
    }
  };

  const displayedError = validationError || error;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Card variant="elevated" style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>LF</Text>
            </View>
            <Text style={styles.brandTitle}>LarviFort</Text>
            <Text style={styles.appSubtitle}>CRM Mobile &amp; Operações de Campo</Text>
          </View>

          {/* Error Banner */}
          {displayedError ? (
            <View style={styles.errorBanner} testID="error-banner">
              <Text style={styles.errorBannerText}>{displayedError}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <Input
            testID="email-input"
            label="E-mail"
            placeholder="seu.email@larvifort.com.br"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (displayedError) {
                clearError();
                setValidationError(null);
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
            required
          />

          <Input
            testID="password-input"
            label="Senha"
            placeholder="Sua senha de acesso"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (displayedError) {
                clearError();
                setValidationError(null);
              }
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
            required
            rightIcon={
              <TouchableOpacity
                testID="toggle-password-button"
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
                accessibilityLabel={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                <Text style={styles.passwordToggleText}>
                  {showPassword ? 'Ocultar' : 'Exibir'}
                </Text>
              </TouchableOpacity>
            }
          />

          {/* Submit Button */}
          <Button
            testID="login-button"
            title="Entrar no Sistema"
            variant="primary"
            size="md"
            fullWidth
            onPress={handleLogin}
            isLoading={isLoading}
            style={styles.submitButton}
          />

          {/* Offline Hint */}
          <View style={styles.offlineHintCard}>
            <Text style={styles.offlineHintTitle}>Modo Offline-First</Text>
            <Text style={styles.offlineHintText}>
              Após realizar o primeiro login online, você poderá usar o aplicativo em viveiros e fazendas sem sinal de internet.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.brand[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoBadgeText: {
    color: '#ffffff',
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
  },
  brandTitle: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
  },
  appSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    color: '#b91c1c',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    textAlign: 'center',
  },
  passwordToggle: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
  },
  passwordToggleText: {
    color: colors.brand[600],
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  offlineHintCard: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.brand[50],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  offlineHintTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand[700],
    marginBottom: 2,
  },
  offlineHintText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand[900],
    lineHeight: 16,
  },
});
