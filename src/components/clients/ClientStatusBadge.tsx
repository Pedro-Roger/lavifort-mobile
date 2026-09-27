import React from 'react';
import { Badge } from '@/components/ui';
import { ClienteStatus } from '@/types';
import { CLIENT_STATUS_CONFIG } from './status';

export interface ClientStatusBadgeProps {
  status: ClienteStatus;
  size?: 'sm' | 'md';
  testID?: string;
}

export function ClientStatusBadge({ status, size = 'sm', testID }: ClientStatusBadgeProps) {
  const config = CLIENT_STATUS_CONFIG[status];
  return (
    <Badge
      label={config.label}
      size={size}
      backgroundColor={config.bg}
      textColor={config.text}
      borderColor={config.border}
      testID={testID || `client-status-${status}`}
    />
  );
}