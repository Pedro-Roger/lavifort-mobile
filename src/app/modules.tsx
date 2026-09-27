import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/core/theme';
import { ModuleGrid, ModuleEntry } from '@/components/modules/ModuleGrid';

/**
 * Launcher de módulos del CRM. Inventario honesto: los módulos ya
 * implementados navegan a su ruta; el resto marca estado "Próximamente"
 * (sin UI inventada ni decoración).
 */
export default function ModulesScreen() {
  const router = useRouter();

  const modules: ModuleEntry[] = [
    { route: '/', label: 'Dashboard', shortLabel: 'DB', description: 'Tareas y tablero del operador' },
    { route: '/', label: 'Quadro / Kanban', shortLabel: 'QB', description: 'Columnas y cards por estado' },
    { route: '/pedidos', label: 'Pedidos', shortLabel: 'PD', description: 'Consulta y creación de pedidos' },
    { route: '/entregas', label: 'Entregas', shortLabel: 'EN', description: 'Estado y confirmación de entregas' },
    { route: '/clientes', label: 'Clientes', shortLabel: 'CL', description: 'Lista y detalle de clientes' },
    { route: '/estoque', label: 'Estoque', shortLabel: 'ES', description: 'Disponibilidad de productos' },
    { route: '/sync-status', label: 'Sincronización', shortLabel: 'SY', description: 'Estado de red y fila Outbox' },
    { route: null, label: 'Agenda', shortLabel: 'AG', description: 'Visitas y reuniones' },
    { route: null, label: 'Empresas', shortLabel: 'EM', description: 'Empresas y entidades' },
    { route: null, label: 'Laboratório', shortLabel: 'LB', description: 'Análisis y ensayos' },
    { route: null, label: 'Separação', shortLabel: 'SP', description: 'Armado y picking' },
    { route: null, label: 'Logística', shortLabel: 'LG', description: 'Rutas y planificación' },
    { route: null, label: 'Pós-venda', shortLabel: 'PV', description: 'Seguimiento post venta' },
    { route: null, label: 'Fiscal', shortLabel: 'FC', description: 'Documentos y cobros' },
    { route: null, label: 'Métricas', shortLabel: 'MT', description: 'Indicadores y gráficas' },
    { route: null, label: 'Pesquisa', shortLabel: 'PS', description: 'Búsqueda global' },
    { route: null, label: 'Equipe', shortLabel: 'EQ', description: 'Miembros del equipo' },
    { route: null, label: 'Produtos / Unidades', shortLabel: 'PR', description: 'Catálogo y unidades' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="modules-back-button"
          accessibilityRole="button"
          accessibilityLabel="Volver al panel"
          style={styles.headerBack}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.headerBackText}>‹ Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Módulos</Text>
      </View>

      <View style={styles.subheader}>
        <Text style={styles.subtitle}>
          Todos los módulos de LarviFort. Los ya disponibles abren su pantalla.
        </Text>
      </View>

      <ModuleGrid
        modules={modules}
        onNavigate={(route) =>
          router.push(route as Parameters<typeof router.push>[0])
        }
        testID="modules-grid"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerBack: {
    minHeight: 44,
    justifyContent: 'center',
  },
  headerBackText: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral.textSecondary,
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
  },
  subheader: {
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.base,
    color: colors.neutral.textSecondary,
  },
});