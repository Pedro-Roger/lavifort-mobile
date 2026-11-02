import React from 'react';
import renderer from 'react-test-renderer';
import { Text } from 'react-native';
import { ClientCard } from '../ClientCard';
import { Cliente } from '@/types';

const mockClient = (overrides: Partial<Cliente> = {}): Cliente => ({
  id: 'c-1',
  firstName: 'Ana',
  lastName: 'Pérez',
  email: 'ana@example.com',
  phone: '+55 85 90000-0000',
  birthdate: null,
  cpfCnpj: null,
  statusLead: 'CLIENTE_ATIVO',
  status: 'ativo',
  regiaoId: 'reg-litoral',
  origem: null,
  pais: 'Brasil',
  cidade: 'Aracati',
  uf: 'CE',
  endereco: null,
  observacoes: null,
  empresaId: null,
  laminaAgua: 1.5,
  qtdViveiros: 4,
  densidade: 120,
  producaoMedia: 300,
  temBercario: false,
  qtdBercarios: 0,
  volumeBercarios: 0,
  alimentadorAutomatico: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

function textsOf(tree: renderer.ReactTestRenderer): string {
  const root = tree.root;
  return root
    .findAllByType(Text)
    .map((n) => n.props.children)
    .flat()
    .filter((c): c is string => typeof c === 'string')
    .join('|');
}

describe('ClientCard (Task 1.2 - carteira de clientes)', () => {
  it('renders full name, location and phone of the client', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<ClientCard client={mockClient()} />);
    });
    const texts = textsOf(tree!);
    expect(texts).toContain('Ana Pérez');
    expect(texts).toContain('Aracati, CE');
    expect(texts).toContain('+55 85 90000-0000');
  });

  it('shows "Sem localização" when cidade/uf are absent', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(
        <ClientCard client={mockClient({ cidade: null, uf: null })} />
      );
    });
    expect(textsOf(tree!)).toContain('Sem localização');
  });

  it('does not render phone row when phone is falsy', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<ClientCard client={mockClient({ phone: null })} />);
    });
    expect(textsOf(tree!)).not.toContain('+55 85 90000-0000');
  });

  it('renders avatar initials from the client name', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<ClientCard client={mockClient({ firstName: 'João', lastName: 'Silva' })} />);
    });
    const initials = tree!.root.findByProps({ testID: 'avatar-initials' });
    expect(initials.props.children.join ? initials.props.children.join('') : initials.props.children).toBe('JS');
  });

  it('renders the status badge when statusLead is present', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<ClientCard client={mockClient({ statusLead: 'CLIENTE_ATIVO' })} />);
    });
    expect(tree!.root.findByProps({ testID: 'client-card-badge' })).toBeDefined();
  });

  it('honors a custom testID', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(<ClientCard client={mockClient()} testID="carteira-client-c-1" />);
    });
    expect(tree!.root.findByProps({ testID: 'carteira-client-c-1' })).toBeDefined();
  });
});