import React from 'react';
import renderer from 'react-test-renderer';
import { ProjectSelector } from '../ProjectSelector';
import { Project } from '../../../types';

describe('ProjectSelector Component', () => {
  const mockProjects: Project[] = [
    { id: 'comercial', nome: 'Comercial', setor: 'Comercial', cor: '#0284c7', tarefasCount: 4 },
    { id: 'operacoes', nome: 'Operações', setor: 'Operações', cor: '#0ea5e9', tarefasCount: 2 },
  ];

  it('renders all projects and default Todos chip', () => {
    const onSelectMock = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <ProjectSelector
          projects={mockProjects}
          selectedProjectId="comercial"
          onSelectProject={onSelectMock}
          showAllOption
        />
      );
    });

    expect(tree).toBeDefined();
    const root = tree!.root;

    expect(root.findByProps({ testID: 'project-chip-all' })).toBeDefined();
    expect(root.findByProps({ testID: 'project-chip-comercial' })).toBeDefined();
    expect(root.findByProps({ testID: 'project-chip-operacoes' })).toBeDefined();
  });

  it('triggers onSelectProject when selecting a project or Todos', () => {
    const onSelectMock = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <ProjectSelector
          projects={mockProjects}
          selectedProjectId="comercial"
          onSelectProject={onSelectMock}
          showAllOption
        />
      );
    });

    const root = tree!.root;
    const operacoesChip = root.findByProps({ testID: 'project-chip-operacoes' });
    const allChip = root.findByProps({ testID: 'project-chip-all' });

    renderer.act(() => {
      operacoesChip.props.onPress();
    });
    expect(onSelectMock).toHaveBeenCalledWith('operacoes');

    renderer.act(() => {
      allChip.props.onPress();
    });
    expect(onSelectMock).toHaveBeenCalledWith(null);
  });
});
