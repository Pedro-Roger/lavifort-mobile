import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/core/theme';
import { Cliente } from '@/types';
import { Avatar } from '@/components/ui';
import { ClientStatusBadge } from './ClientStatusBadge';

export interface ClientDetailProps {
  client: Cliente;
  testID?: string;
}

function getFullName(client: Cliente): string {
  return `${client.firstName} ${client.lastName}`.trim();
}

function formatBoolean(value: boolean): string {
  return value ? 'Sí' : 'No';
}

function LabeledRow({ label, value }: { label: string; value?: string | null }): React.ReactElement | null {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }): React.ReactElement {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export function ClientDetail({ client, testID }: ClientDetailProps) {
  const cityUf = [client.cidade, client.uf].filter(Boolean).join(', ');
  const fullName = getFullName(client);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Avatar name={fullName} size={56} testID="client-detail-avatar" backgroundColor="#0284c7" />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{fullName || 'Cliente sin nombre'}</Text>
          {client.pais && <Text style={styles.subtitle}>{client.pais}</Text>}
          {client.statusLead && (
            <ClientStatusBadge status={client.statusLead} size="md" testID="client-detail-badge" />
          )}
        </View>
      </View>

      <SectionTitle title="Contacto" />
      {LabeledRow({ label: 'Email', value: client.email })}
      {LabeledRow({ label: 'Teléfono', value: client.phone })}
      {LabeledRow({ label: 'Documento', value: client.cpfCnpj })}
      {LabeledRow({ label: 'Origen', value: client.origem })}

      <SectionTitle title="Ubicación" />
      {cityUf ? LabeledRow({ label: 'Ciudad / Estado', value: cityUf }) : null}
      {LabeledRow({ label: 'País', value: client.pais })}
      {LabeledRow({ label: 'Dirección', value: client.endereco })}

      <SectionTitle title="Perfil acuícola" />
      {client.laminaAgua > 0
        ? LabeledRow({ label: 'Lámina de agua (ha)', value: String(client.laminaAgua) })
        : null}
      {client.qtdViveiros > 0
        ? LabeledRow({ label: 'Viveiros', value: String(client.qtdViveiros) })
        : null}
      {client.densidade > 0
        ? LabeledRow({ label: 'Densidad', value: String(client.densidade) })
        : null}
      {client.producaoMedia > 0
        ? LabeledRow({ label: 'Producción media', value: String(client.producaoMedia) })
        : null}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Bercario</Text>
        <Text style={styles.rowValue}>{formatBoolean(client.temBercario)}</Text>
      </View>
      {client.qtdBercarios > 0
        ? LabeledRow({ label: 'Bercarios', value: String(client.qtdBercarios) })
        : null}
      {client.volumeBercarios > 0
        ? LabeledRow({ label: 'Volumen bercarios', value: String(client.volumeBercarios) })
        : null}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Alimentador automático</Text>
        <Text style={styles.rowValue}>{formatBoolean(client.alimentadorAutomatico)}</Text>
      </View>

      {client.observacoes ? (
        <>
          <SectionTitle title="Observaciones" />
          <Text style={styles.notes}>{client.observacoes}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  name: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowLabel: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textPrimary,
  },
  notes: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.base,
    color: colors.neutral.textPrimary,
  },
});