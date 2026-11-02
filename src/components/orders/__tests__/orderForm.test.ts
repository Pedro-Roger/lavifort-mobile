import {
  buildOrderInput,
  clientAddress,
  emptyDraft,
  maskDate,
  maskTime,
  orderTotal,
  parseBRDateToISO,
  validateStep,
  OrderDraft,
} from '../orderForm';
import { Cliente } from '@/types';

const client = {
  id: 'c1',
  firstName: 'Ana',
  lastName: 'Silva',
  endereco: 'Faz. Sol, km 3',
  cidade: 'Aracati',
  uf: 'CE',
  pais: 'Brasil',
} as Cliente;

const valid = (): OrderDraft => ({
  ...emptyDraft(),
  client,
  items: [{ productName: ' PL12 ', quantity: '2', unitPrice: '10,5', unit: 'MILHEIRO' }],
  deliveryDate: '05/11/2026',
  horaEntrega: '08:30',
  localEntrega: 'Fazenda Sol',
  endereco: 'Faz. Sol, km 3',
  paymentMethod: 'A prazo',
  notes: ' obs ',
});

describe('orderForm', () => {
  it('parseBRDateToISO valida data real', () => {
    expect(parseBRDateToISO('05/11/2026')).toBe('2026-11-05T12:00:00.000Z');
    expect(parseBRDateToISO('31/02/2026')).toBeNull();
    expect(parseBRDateToISO('5/11/2026')).toBeNull();
  });

  it('máscaras', () => {
    expect(maskDate('05112026')).toBe('05/11/2026');
    expect(maskDate('051')).toBe('05/1');
    expect(maskTime('0830')).toBe('08:30');
  });

  it('validateStep por passo', () => {
    const d = emptyDraft();
    expect(validateStep(0, d)).toMatch(/cliente/i);
    expect(validateStep(1, d)).toMatch(/produto/i);
    expect(validateStep(1, { ...d, items: [{ ...d.items[0], productName: 'PL', unitPrice: '' }] })).toMatch(/valor/);
    expect(validateStep(2, d)).toMatch(/data/i);
    expect(validateStep(2, { ...valid(), endereco: ' ' })).toMatch(/endereço/i);
    expect(validateStep(2, { ...valid(), horaEntrega: '25:00' })).toMatch(/hora/i);
    for (const s of [0, 1, 2, 3]) expect(validateStep(s, valid())).toBeNull();
  });

  it('orderTotal e unidade padrão MILHEIRO', () => {
    expect(orderTotal(valid())).toBe(21);
    expect(emptyDraft().items[0].unit).toBe('MILHEIRO');
  });

  it('buildOrderInput segue o contrato do CRM', () => {
    expect(buildOrderInput(valid())).toEqual({
      clientId: 'c1',
      ciclo: 'PEDIDO',
      deliveryDate: '2026-11-05T12:00:00.000Z',
      horaEntrega: '08:30',
      localEntrega: 'Fazenda Sol',
      paymentMethod: 'A prazo',
      deliveryInstructions: 'Faz. Sol, km 3',
      shippingAddress: { endereco: 'Faz. Sol, km 3', cidade: 'Aracati', uf: 'CE', pais: 'Brasil' },
      notes: 'obs',
      items: [{ productName: 'PL12', unit: 'MILHEIRO', quantity: 2, unitPrice: 10.5 }],
    });
  });

  it('clientAddress', () => {
    expect(clientAddress(client)).toBe('Faz. Sol, km 3, Aracati/CE');
    expect(clientAddress(null)).toBe('');
  });
});
