import React from 'react';
import { Alert } from 'react-native';
import renderer from 'react-test-renderer';
import { AttachmentList, formatFileSize } from '../AttachmentList';
import { TaskAttachment } from '../../../types';

describe('formatFileSize', () => {
  it('formats bytes, kilobytes, and megabytes properly', () => {
    expect(formatFileSize(0)).toBe('');
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(1024 * 250)).toBe('250 KB');
    expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
  });
});

describe('AttachmentList Component', () => {
  const mockAttachments: TaskAttachment[] = [
    {
      id: 'att-1',
      taskId: 'task-1',
      uri: 'file:///mock/attachments/viveiro_oxigenio.jpg',
      nome: 'viveiro_oxigenio.jpg',
      tamanho: 1024 * 450,
      mimeType: 'image/jpeg',
      syncStatus: 'SYNCED',
      createdAt: '2026-09-09T10:00:00Z',
    },
    {
      id: 'att-2',
      taskId: 'task-1',
      uri: 'file:///mock/attachments/medicao_salinidade.jpg',
      nome: 'medicao_salinidade.jpg',
      tamanho: 1024 * 1024 * 2.1,
      mimeType: 'image/jpeg',
      syncStatus: 'PENDING',
      createdAt: '2026-09-09T10:15:00Z',
    },
  ];

  let currentTree: renderer.ReactTestRenderer | undefined;

  afterEach(() => {
    if (currentTree) {
      renderer.act(() => {
        currentTree?.unmount();
      });
      currentTree = undefined;
    }
  });

  it('renders empty message when there are no attachments', () => {
    renderer.act(() => {
      currentTree = renderer.create(
        <AttachmentList taskId="task-1" anexos={[]} />
      );
    });

    const root = currentTree!.root;
    expect(root.findByProps({ testID: 'attachment-empty-text' })).toBeDefined();
  });

  it('renders attachments list with thumbnails, names and counter', () => {
    renderer.act(() => {
      currentTree = renderer.create(
        <AttachmentList taskId="task-1" anexos={mockAttachments} />
      );
    });

    const root = currentTree!.root;
    expect(root.findByProps({ testID: 'attachment-counter' })).toBeDefined();
    expect(root.findByProps({ testID: 'attachment-item-att-1' })).toBeDefined();
    expect(root.findByProps({ testID: 'attachment-item-att-2' })).toBeDefined();
    expect(root.findByProps({ testID: 'attachment-name-att-1' })).toBeDefined();
    expect(root.findByProps({ testID: 'attachment-name-att-2' })).toBeDefined();
  });

  it('calls onCapturePhoto when Tirar Foto button is pressed', async () => {
    const mockCapture = jest.fn().mockResolvedValue({});
    await renderer.act(async () => {
      currentTree = renderer.create(
        <AttachmentList
          taskId="task-1"
          anexos={mockAttachments}
          onCapturePhoto={mockCapture}
        />
      );
    });

    const root = currentTree!.root;
    const button = root.findByProps({ testID: 'attachment-camera-button' });

    await renderer.act(async () => {
      button.props.onPress();
    });

    expect(mockCapture).toHaveBeenCalledWith('task-1');
  });

  it('calls onPickPhoto when Galeria button is pressed', async () => {
    const mockPick = jest.fn().mockResolvedValue({});
    await renderer.act(async () => {
      currentTree = renderer.create(
        <AttachmentList
          taskId="task-1"
          anexos={mockAttachments}
          onPickPhoto={mockPick}
        />
      );
    });

    const root = currentTree!.root;
    const button = root.findByProps({ testID: 'attachment-gallery-button' });

    await renderer.act(async () => {
      button.props.onPress();
    });

    expect(mockPick).toHaveBeenCalledWith('task-1');
  });

  it('opens and closes image preview modal when item is tapped', async () => {
    await renderer.act(async () => {
      currentTree = renderer.create(
        <AttachmentList taskId="task-1" anexos={mockAttachments} />
      );
    });

    const root = currentTree!.root;
    expect(root.findAllByProps({ testID: 'attachment-preview-modal' })).toHaveLength(0);

    const openBtn = root.findByProps({ testID: 'attachment-open-att-1' });
    await renderer.act(async () => {
      openBtn.props.onPress();
    });

    expect(root.findByProps({ testID: 'attachment-preview-modal' })).toBeDefined();
    expect(root.findByProps({ testID: 'attachment-preview-image' })).toBeDefined();

    const closeBtn = root.findByProps({ testID: 'attachment-preview-close' });
    await renderer.act(async () => {
      closeBtn.props.onPress();
    });

    expect(root.findAllByProps({ testID: 'attachment-preview-modal' })).toHaveLength(0);
  });

  it('calls onDeleteAttachment when delete button is pressed', async () => {
    const mockDelete = jest.fn().mockResolvedValue(true);
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      buttons?.[1]?.onPress?.();
    });

    await renderer.act(async () => {
      currentTree = renderer.create(
        <AttachmentList
          taskId="task-1"
          anexos={mockAttachments}
          onDeleteAttachment={mockDelete}
        />
      );
    });

    const root = currentTree!.root;
    const deleteBtn = root.findByProps({ testID: 'attachment-delete-att-1' });

    await renderer.act(async () => {
      deleteBtn.props.onPress();
    });

    expect(mockDelete).toHaveBeenCalledWith('task-1', 'att-1');
  });

  it('shows error banner when capture photo fails', async () => {
    const mockCapture = jest.fn().mockRejectedValue(new Error('Erro câmera'));
    await renderer.act(async () => {
      currentTree = renderer.create(
        <AttachmentList
          taskId="task-1"
          anexos={mockAttachments}
          onCapturePhoto={mockCapture}
        />
      );
    });

    const root = currentTree!.root;
    const button = root.findByProps({ testID: 'attachment-camera-button' });

    await renderer.act(async () => {
      button.props.onPress();
    });

    expect(root.findByProps({ testID: 'attachment-error-banner' })).toBeDefined();
  });
});
