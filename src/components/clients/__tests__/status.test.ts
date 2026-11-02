import { CLIENT_STATUSES, ClienteStatus } from '@/types';
import { CLIENT_STATUS_CONFIG } from '../status';

describe('CLIENT_STATUS_CONFIG (Task 1.2 - carteira/status de lead)', () => {
  it('defines a config entry for every ClienteStatus', () => {
    CLIENT_STATUSES.forEach((status: ClienteStatus) => {
      const config = CLIENT_STATUS_CONFIG[status];
      expect(config).toBeDefined();
      expect(typeof config.label).toBe('string');
      expect(config.label.length).toBeGreaterThan(0);
      // Cada status tem paleta coerente (bg/text/border).
      expect(config.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(config.text).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(config.border).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('exposes labels in pt-BR for the four operational statuses', () => {
    expect(CLIENT_STATUS_CONFIG.NOVO.label).toBeTruthy();
    expect(CLIENT_STATUS_CONFIG.SEM_CONTATO.label).toBeTruthy();
    expect(CLIENT_STATUS_CONFIG.EM_NEGOCIACAO.label).toBeTruthy();
    expect(CLIENT_STATUS_CONFIG.CLIENTE_ATIVO.label).toBeTruthy();
  });
});