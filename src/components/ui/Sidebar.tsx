import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Animated, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/core/theme';
import larvifortLogo from '@/assets/larvifort-logo.png';
import { LayoutDashboard, Columns, Package, Users, RefreshCw, Calendar } from 'lucide-react-native';

export interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

const MODULES = [
  { id: 'home', label: 'Início', icon: LayoutDashboard, route: '/' },
  { id: 'pedidos', label: 'Pedidos', icon: Package, route: '/pedidos' },
  { id: 'agenda', label: 'Visitas', icon: Calendar, route: '/agenda' },
  { id: 'clientes', label: 'Clientes', icon: Users, route: '/clientes' },
  { id: 'sync', label: 'Sincronização', icon: RefreshCw, route: '/sync-status' },
  { id: 'mais', label: 'Mais módulos', icon: Columns, route: '/modules' },
];

export function Sidebar({ visible, onClose }: SidebarProps) {
  const router = useRouter();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <Animated.View style={styles.sidebar}>
          <View style={styles.header}>
            <Image
              source={larvifortLogo}
              style={styles.headerLogo}
              resizeMode="contain"
              testID="sidebar-logo"
            />
            <Text style={styles.headerTitle}>Menu Módulos</Text>
          </View>

          <ScrollView style={styles.scroll}>
            {MODULES.map((mod) => (
              <TouchableOpacity
                key={mod.id}
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  router.push(mod.route as any);
                }}
              >
                <mod.icon size={22} color={colors.neutral.textSecondary} />
                <Text style={styles.menuItemText}>{mod.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sidebar: {
    width: Math.min(width * 0.75, 300),
    backgroundColor: colors.neutral.surface,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    backgroundColor: colors.brand[50],
  },
  headerLogo: {
    width: 96,
    height: 29,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand[900],
  },
  scroll: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  menuItemText: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral.textPrimary,
    fontWeight: typography.fontWeights.medium,
  },
});
