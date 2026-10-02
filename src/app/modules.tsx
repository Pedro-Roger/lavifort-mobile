import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/core/theme';
import { ModuleGrid, ModuleEntry } from '@/components/modules/ModuleGrid';

/**
 * Launcher de módulos del CRM. Inventario honesto: los módulos ya
 * implementados navegan a su ruta; el resto marca estado "Próximamente"
 * (sem UI inventada nem decoração).
 */
export default function ModulesScreen() {
  const router = useRouter();

  const modules: ModuleEntry[] = [
    { route: '/', label: 'Dashboard', shortLabel: 'DB', description: 'Tarefas e painel do operador' },
    { route: '/', label: 'Quadro / Kanban', shortLabel: 'QB', description: 'Colunas e cards por status' },
    { route: '/pedidos', label: 'Pedidos', shortLabel: 'PD', description: 'Consulta e criação de pedidos' },
    { route: '/entregas', label: 'Entregas', shortLabel: 'EN', description: 'Estado e confirmação de entregas' },
    { route: '/clientes', label: 'Clientes', shortLabel: 'CL', description: 'Lista e detalhe de clientes' },
    { route: '/estoque', label: 'Estoque', shortLabel: 'ES', description: 'Disponibilidade de produtos' },
    { route: '/atividades', label: 'Atividades', shortLabel: 'AT', description: 'Concluir atividades de campo' },
    { route: '/sync-status', label: 'Sincronização', shortLabel: 'SY', description: 'Estado da rede e fila Outbox' },
    { route: '/agenda', label: 'Agenda', shortLabel: 'AG', description: 'Visitas e reuniões' },
    { route: '/carteira', label: 'Carteira', shortLabel: 'CA', description: 'Clientes por região da vendedora' },
    { route: '/pesquisas', label: 'Pesquisa de Campo', shortLabel: 'PC', description: 'Questionário de pós-larvas em campo' },
    { route: '/checkin', label: 'Check-in GPS', shortLabel: 'CK', description: 'Marcar presença nas fazendas' },
    { route: null, label: 'Empresas', shortLabel: 'EM', description: 'Empresas e entidades' },
    { route: null, label: 'Laboratório', shortLabel: 'LB', description: 'Análises e ensaios' },
    { route: null, label: 'Separação', shortLabel: 'SP', description: 'Separação e picking' },
    { route: null, label: 'Logística', shortLabel: 'LG', description: 'Rotas e planejamento' },
    { route: null, label: 'Pós-venda', shortLabel: 'PV', description: 'Acompanhamento pós-venda' },
    { route: null, label: 'Fiscal', shortLabel: 'FC', description: 'Documentos e cobranças' },
    { route: null, label: 'Métricas', shortLabel: 'MT', description: 'Indicadores e gráficos' },
    { route: null, label: 'Pesquisa', shortLabel: 'PS', description: 'Busca global' },
    { route: null, label: 'Equipe', shortLabel: 'EQ', description: 'Membros da equipe' },
    { route: null, label: 'Produtos / Unidades', shortLabel: 'PR', description: 'Catálogo e unidades' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="modules-back-button"
          accessibilityRole="button"
          accessibilityLabel="Voltar ao painel"
          style={styles.headerBack}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.headerBackText}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Módulos</Text>
      </View>

      <View style={styles.subheader}>
        <Text style={styles.subtitle}>
          Todos os módulos da LarviFort. Os disponíveis abrem a tela.
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