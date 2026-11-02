import { orderedSetores, toneForColumn } from '../trackingMeta';

describe('trackingMeta', () => {
  it('orderedSetores ordena e completa', () => {
    const r = orderedSetores([{ setor: 'Logística' as const, coluna: 'Em Rota', projetoId: null, columnId: null, taskId: null, desde: null }]);
    expect(r.map((x) => x.setor)).toEqual(['Comercial', 'Financeiro', 'Logística']);
  });
  it('toneForColumn', () => {
    expect(toneForColumn('Aprovado').dot).toBe('#10b981');
    expect(toneForColumn('Em Rota').dot).toBe('#0284c7');
    expect(toneForColumn('Pendente').dot).toBe('#f59e0b');
    expect(toneForColumn(null).dot).toBe('#94a3b8');
  });
});
