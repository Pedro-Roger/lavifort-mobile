import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radii } from '@/core/theme';
import { LayoutDashboard, Columns, Package, Truck, Users, Archive, RefreshCw, CheckSquare, Calendar } from 'lucide-react-native';

export interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

const MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/modules' },
  { id: 'kanban', label: 'Quadro / Kanban', icon: Columns, route: '/' },
  { id: 'atividades', label: 'Atividades', icon: CheckSquare, route: '/atividades' },
  { id: 'agenda', label: 'Agenda', icon: Calendar, route: '/agenda' },
  { id: 'pedidos', label: 'Pedidos', icon: Package, route: '/pedidos' },
  { id: 'entregas', label: 'Entregas', icon: Truck, route: '/entregas' },
  { id: 'clientes', label: 'Clientes', icon: Users, route: '/clientes' },
  { id: 'estoque', label: 'Estoque', icon: Archive, route: '/estoque' },
  { id: 'sync', label: 'Sincronização', icon: RefreshCw, route: '/sync-status' },
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
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>LF</Text>
            </View>
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
  brandBadge: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.brand[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  brandBadgeText: {
    color: '#ffffff',
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
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
