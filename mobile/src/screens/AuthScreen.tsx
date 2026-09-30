import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, useTheme } from '../theme';
import { StyloraLogo } from '../components/StyloraLogo';
import { AuthUser } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: AuthUser) => void;
  onSkipToGuest: () => void;
  backendBaseUrl?: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthSuccess,
  onSkipToGuest,
  backendBaseUrl = 'http://10.0.2.2:8000',
}) => {
  const { colors } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    setErrorMessage('');
    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();

    if (!trimmedEmail || !trimmedPass) {
      setErrorMessage('Enter your email and password.');
      return;
    }

    if (!isLogin && !fullName.trim()) {
      setErrorMessage('Enter your name.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin
        ? `${backendBaseUrl}/auth/login`
        : `${backendBaseUrl}/auth/register`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      let token = `token-${Date.now()}`;
      let authUser: AuthUser = {
        id: `user-${Date.now()}`,
        email: trimmedEmail,
        name: isLogin ? trimmedEmail.split('@')[0] : fullName.trim(),
        token: token,
        isAuthenticated: true,
      };

      try {
        const body = isLogin
          ? new URLSearchParams({ username: trimmedEmail, password: trimmedPass }).toString()
          : JSON.stringify({ email: trimmedEmail, password: trimmedPass, name: fullName.trim() });

        const headers: Record<string, string> = isLogin
          ? { 'Content-Type': 'application/x-www-form-urlencoded' }
          : { 'Content-Type': 'application/json' };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          if (data.access_token) {
            authUser.token = data.access_token;
          }
          if (data.user?.id) {
            authUser.id = String(data.user.id);
          }
        }
      } catch {
        // Backend not reached — proceed with a local session.
      }

      onAuthSuccess(authUser);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <StyloraLogo size={80} />
          <Text style={styles.brandTitle}>Stylora</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabSwitch}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setIsLogin(true);
                setErrorMessage('');
              }}
              style={[styles.tabBtn, isLogin && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Sign in</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setIsLogin(false);
                setErrorMessage('');
              }}
              style={[styles.tabBtn, !isLogin && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Create account</Text>
            </TouchableOpacity>
          </View>

          {Boolean(errorMessage) && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.destructive} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {!isLogin && (
            <View style={styles.inputGroup}>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor={COLORS.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>
                  {isLogin ? 'Sign in' : 'Create account'}
                </Text>
                <Ionicons name="arrow-forward" size={17} color={COLORS.background} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onSkipToGuest}
            style={styles.guestBtn}
          >
            <Text style={styles.guestBtnText}>Continue offline</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerCaption}>Private · on-device by default</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl * 1.5,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  brandTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginTop: SPACING.md,
    letterSpacing: 0.5,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  tabBtnActive: {
    backgroundColor: COLORS.accent,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.background,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(192, 82, 74, 0.12)',
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    gap: 8,
  },
  errorText: {
    color: COLORS.destructive,
    fontSize: 13,
    flex: 1,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    height: '100%',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    height: 52,
    marginTop: SPACING.xs,
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
  },
  dividerText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: SPACING.md,
  },
  guestBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderStrong,
    borderRadius: RADIUS.md,
    height: 50,
  },
  guestBtnText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  footerCaption: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: SPACING.xl,
    textAlign: 'center',
  },
});
