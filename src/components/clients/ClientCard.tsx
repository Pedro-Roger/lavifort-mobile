import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radii } from '@/core/theme';
import { Cliente } from '@/types';
import { Avatar } from '@/components/ui';
import { ClientStatusBadge } from './ClientStatusBadge';

export interface ClientCardProps {
  client: Cliente;
  testID?: string;
}

function getFullName(client: Cliente): string {
  return `${client.firstName} ${client.lastName}`.trim();
}

function getLocationLabel(client: Cliente): string {
  const parts = [client.cidade, client.uf].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Sem localização';
}

export function ClientCard({ client, testID }: ClientCardProps) {
  const name = getFullName(client);

  return (
    <View style={styles.card} testID={testID}>
      <Avatar name={name} size={48} testID="client-card-avatar" backgroundColor="#0284c7" />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {client.statusLead && (
            <ClientStatusBadge status={client.statusLead} testID="client-card-badge" />
          )}
        </View>
        <Text style={styles.location}>{getLocationLabel(client)}</Text>
        {client.phone && <Text style={styles.phone}>{client.phone}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.neutral.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: spacing.lg,
  },
  info: {
    flex: 1,
    gap: spacing.xxs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral.textPrimary,
  },
  location: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral.textSecondary,
  },
  phone: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand[700],
  },
});