import { colors, spacing, radii, typography, minTouchTarget } from '../tokens';

describe('Design Tokens', () => {
  it('defines the required LarviFort brand colors', () => {
    expect(colors.brand[600]).toBe('#0284c7');
    expect(colors.brand[500]).toBe('#0ea5e9');
    expect(colors.brand[700]).toBe('#0369a1');
  });

  it('defines typography tokens', () => {
    expect(typography.fontSizes.base).toBe(15);
    expect(typography.fontWeights.bold).toBe('700');
  });

  it('defines the neutral surface and background colors', () => {
    expect(colors.neutral.background).toBe('#fcfcfd');
    expect(colors.neutral.surface).toBe('#ffffff');
    expect(colors.neutral.border).toBe('#e5e7eb');
  });

  it('defines status badge colors matching SPEC.md and ARCHITECTURE.md', () => {
    expect(colors.status.BACKLOG.bg).toBe('#f1f5f9');
    expect(colors.status.BACKLOG.text).toBe('#475569');

    expect(colors.status.EM_ANDAMENTO.bg).toBe('#e0f2fe');
    expect(colors.status.EM_ANDAMENTO.text).toBe('#0369a1');

    expect(colors.status.EM_REVISAO.bg).toBe('#fef3c7');
    expect(colors.status.EM_REVISAO.text).toBe('#b45309');

    expect(colors.status.CONCLUIDO.bg).toBe('#d1fae5');
    expect(colors.status.CONCLUIDO.text).toBe('#047857');
  });

  it('enforces min touch target of 44dp for field usability', () => {
    expect(minTouchTarget).toBe(44);
  });

  it('provides spacing and radii tokens', () => {
    expect(spacing.md).toBe(12);
    expect(spacing.lg).toBe(16);
    expect(radii.md).toBe(8);
  });
});
