import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../theme';

export type ToastType = 'success' | 'info' | 'warning' | 'error' | 'atelier';

export interface ToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number; // ms, default 3200
  icon?: keyof typeof Ionicons.glyphMap;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ToastContextValue {
  showToast: (options: ToastOptions | string, message?: string, type?: ToastType) => void;
  showConfirm: (options: ConfirmOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let globalShowToast: ((options: ToastOptions | string, message?: string, type?: ToastType) => void) | null = null;
let globalShowConfirm: ((options: ConfirmOptions) => void) | null = null;

/**
 * Universal imperative helper to show toast from anywhere in the app
 * Supports either showAtelierToast({ message, title, type }) or showAtelierToast(title, message, type)
 */
export function showAtelierToast(
  optionsOrTitle: ToastOptions | string,
  message?: string,
  type?: ToastType
) {
  let opts: ToastOptions;
  if (typeof optionsOrTitle === 'string') {
    if (message !== undefined) {
      opts = { title: optionsOrTitle, message, type: type || 'info' };
    } else {
      opts = { message: optionsOrTitle, type: type || 'info' };
    }
  } else {
    opts = optionsOrTitle;
  }

  if (globalShowToast) {
    globalShowToast(opts);
  } else if (__DEV__) {
    console.log('[AtelierToast]', opts);
  }
}

/**
 * Universal imperative helper to show high-fashion confirm dialog
 */
export function showAtelierConfirm(options: ConfirmOptions) {
  if (globalShowConfirm) {
    globalShowConfirm(options);
  } else if (__DEV__) {
    console.log('[AtelierConfirm]', options);
  }
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const contextInsets = useContext(SafeAreaInsetsContext);
  const insets = contextInsets ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const { colors } = useTheme();

  // Toast state
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const animY = useRef(new Animated.Value(-100)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Confirm dialog state
  const [confirmConfig, setConfirmConfig] = useState<ConfirmOptions | null>(null);

  const hideToast = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(animY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(animOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [animY, animOpacity]);

  const showToast = useCallback(
    (optionsOrTitle: ToastOptions | string, message?: string, type?: ToastType) => {
      let opts: ToastOptions;
      if (typeof optionsOrTitle === 'string') {
        if (message !== undefined) {
          opts = { title: optionsOrTitle, message, type: type || 'info' };
        } else {
          opts = { message: optionsOrTitle, type: type || 'info' };
        }
      } else {
        opts = { type: 'info', ...optionsOrTitle };
      }

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      setToast(opts);

      Animated.parallel([
        Animated.spring(animY, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(animOpacity, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = opts.duration ?? 3200;
      if (duration > 0) {
        hideTimerRef.current = setTimeout(() => {
          hideToast();
        }, duration);
      }
    },
    [animY, animOpacity, hideToast]
  );

  const showConfirm = useCallback((options: ConfirmOptions) => {
    setConfirmConfig(options);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmConfig(null);
  }, []);

  // Wire global functions
  globalShowToast = showToast;
  globalShowConfirm = showConfirm;

  // Icon mapping
  const getToastIcon = (type: ToastType = 'success', customIcon?: keyof typeof Ionicons.glyphMap) => {
    if (customIcon) return customIcon;
    switch (type) {
      case 'success':
        return 'sparkles';
      case 'info':
        return 'information-circle';
      case 'warning':
        return 'alert-circle';
      case 'error':
        return 'close-circle';
      case 'atelier':
        return 'diamond-outline';
    }
  };

  const getToastColor = (type: ToastType = 'success') => {
    switch (type) {
      case 'success':
        return colors.accent;
      case 'info':
        return colors.textPrimary;
      case 'warning':
        return '#D89622';
      case 'error':
        return colors.destructive;
      case 'atelier':
        return colors.accent;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm, hideToast }}>
      {children}

      {/* Floating Haute-Couture Notification Capsule */}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              top: Math.max(insets.top + 6, 44),
              transform: [{ translateY: animY }],
              opacity: animOpacity,
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={hideToast}
            style={[
              styles.toastCard,
              {
                backgroundColor: colors.surfaceRaised,
                borderColor: colors.surfaceBorderStrong,
                shadowColor: colors.accent,
              },
            ]}
          >
            <View
              style={[
                styles.iconOrb,
                {
                  backgroundColor: colors.accentMuted,
                  borderColor: getToastColor(toast.type),
                },
              ]}
            >
              <Ionicons
                name={getToastIcon(toast.type, toast.icon)}
                size={16}
                color={getToastColor(toast.type)}
              />
            </View>

            <View style={styles.toastTextContainer}>
              {toast.title ? (
                <Text
                  style={[
                    styles.toastTitle,
                    { color: getToastColor(toast.type) },
                  ]}
                  numberOfLines={1}
                >
                  {toast.title.toUpperCase()}
                </Text>
              ) : null}
              <Text
                style={[
                  styles.toastMessage,
                  { color: colors.textPrimary },
                ]}
                numberOfLines={2}
              >
                {toast.message}
              </Text>
            </View>

            <TouchableOpacity
              onPress={hideToast}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.toastCloseBtn}
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Editorial Confirmation Modal */}
      {confirmConfig && (
        <Modal
          visible={Boolean(confirmConfig)}
          transparent
          animationType="fade"
          onRequestClose={closeConfirm}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.confirmCard,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.surfaceBorderStrong,
                },
              ]}
            >
              <View
                style={[
                  styles.confirmIconOrb,
                  {
                    backgroundColor: confirmConfig.destructive
                      ? 'rgba(224, 90, 71, 0.12)'
                      : colors.accentMuted,
                  },
                ]}
              >
                <Ionicons
                  name={confirmConfig.icon || (confirmConfig.destructive ? 'trash-outline' : 'sparkles-outline')}
                  size={24}
                  color={confirmConfig.destructive ? colors.destructive : colors.accent}
                />
              </View>

              <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>
                {confirmConfig.title}
              </Text>
              <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
                {confirmConfig.message}
              </Text>

              <View style={styles.confirmActionRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    closeConfirm();
                    if (confirmConfig.onCancel) confirmConfig.onCancel();
                  }}
                  style={[
                    styles.confirmBtn,
                    styles.cancelBtn,
                    { borderColor: colors.surfaceBorder },
                  ]}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                    {confirmConfig.cancelText || 'Cancel'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    const action = confirmConfig.onConfirm;
                    closeConfirm();
                    action();
                  }}
                  style={[
                    styles.confirmBtn,
                    {
                      backgroundColor: confirmConfig.destructive
                        ? colors.destructive
                        : colors.accent,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.confirmBtnText,
                      { color: confirmConfig.destructive ? '#FFFFFF' : '#141312' },
                    ]}
                  >
                    {confirmConfig.confirmText || 'Confirm'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: showAtelierToast,
      showConfirm: showAtelierConfirm,
      hideToast: () => {},
    };
  }
  return ctx;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 99999,
    alignItems: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 440,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.float,
  },
  iconOrb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  toastCloseBtn: {
    marginLeft: 8,
    padding: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    ...SHADOWS.float,
  },
  confirmIconOrb: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  confirmMessage: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  confirmActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
