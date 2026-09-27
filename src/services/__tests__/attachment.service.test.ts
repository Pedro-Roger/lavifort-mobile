import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../api';
import { DefaultAttachmentService } from '../attachment.service';
import { TaskAttachment } from '../../types';

jest.mock('../api', () => ({
  apiClient: {
    post: jest.fn(),
    delete: jest.fn(),
  },
  normalizeApiResponse: jest.fn((val) => (val && val.data ? val.data : val)),
}));

describe('DefaultAttachmentService', () => {
  let service: DefaultAttachmentService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DefaultAttachmentService();
  });

  describe('Permissions', () => {
    it('requests camera permission successfully', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      const granted = await service.requestCameraPermissions();
      expect(granted).toBe(true);
    });

    it('handles camera permission denied', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
      });
      const granted = await service.requestCameraPermissions();
      expect(granted).toBe(false);
    });

    it('requests media library permission successfully', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      const granted = await service.requestMediaLibraryPermissions();
      expect(granted).toBe(true);
    });
  });

  describe('Image Picking', () => {
    it('captures photo from camera', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            uri: 'file:///temp/camera_shot.jpg',
            fileName: 'camera_shot.jpg',
            fileSize: 50000,
            mimeType: 'image/jpeg',
            width: 1080,
            height: 1920,
          },
        ],
      });

      const result = await service.pickImageFromCamera();
      expect(result).not.toBeNull();
      expect(result?.uri).toBe('file:///temp/camera_shot.jpg');
      expect(result?.nome).toBe('camera_shot.jpg');
      expect(result?.tamanho).toBe(50000);
    });

    it('throws error when camera permission is denied', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
      });

      await expect(service.pickImageFromCamera()).rejects.toThrow(
        'Permissão da câmera necessária para capturar fotos'
      );
    });

    it('returns null when camera capture is canceled', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValueOnce({
        canceled: true,
        assets: [],
      });

      const result = await service.pickImageFromCamera();
      expect(result).toBeNull();
    });

    it('picks photo from image library', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            uri: 'file:///temp/gallery_pick.jpg',
            fileName: 'gallery_pick.jpg',
            fileSize: 75000,
            mimeType: 'image/jpeg',
          },
        ],
      });

      const result = await service.pickImageFromLibrary();
      expect(result).not.toBeNull();
      expect(result?.uri).toBe('file:///temp/gallery_pick.jpg');
      expect(result?.nome).toBe('gallery_pick.jpg');
    });

    it('throws error when media library permission is denied', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
      });

      await expect(service.pickImageFromLibrary()).rejects.toThrow(
        'Permissão da galeria necessária para selecionar fotos'
      );
    });
  });

  describe('Local File Persistence', () => {
    it('saves local attachment copying file to attachments dir', async () => {
      (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValueOnce(undefined);
      (FileSystem.copyAsync as jest.Mock).mockResolvedValueOnce(undefined);
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
        exists: true,
        size: 80000,
      });

      const saved = await service.saveLocalAttachment('file:///temp/image.jpg', 'laudo_foto.jpg');
      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalled();
      expect(FileSystem.copyAsync).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'file:///temp/image.jpg' })
      );
      expect(saved.nome).toBe('laudo_foto.jpg');
      expect(saved.tamanho).toBe(80000);
      expect(saved.uri).toContain('file:///mock/documents/attachments/');
    });

    it('deletes local attachment', async () => {
      (FileSystem.deleteAsync as jest.Mock).mockResolvedValueOnce(undefined);
      const deleted = await service.deleteLocalAttachment('file:///mock/doc/anexo.jpg');
      expect(deleted).toBe(true);
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///mock/doc/anexo.jpg', {
        idempotent: true,
      });
    });
  });

  describe('Remote API Integration', () => {
    it('uploads attachment to API endpoint', async () => {
      const mockAttachment: TaskAttachment = {
        id: 'att-123',
        taskId: 'task-abc',
        uri: 'file:///mock/documents/attachments/anexo.jpg',
        nome: 'evidencia.jpg',
        tamanho: 45000,
        mimeType: 'image/jpeg',
        createdAt: '2026-09-09T12:00:00.000Z',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: {
          id: 'att-123',
          taskId: 'task-abc',
          nome: 'evidencia.jpg',
          uri: 'https://cdn.larvifort.com/evidencia.jpg',
        },
      });

      const uploaded = await service.uploadAttachment('task-abc', mockAttachment);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/tasks/task-abc/attachments',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(uploaded.syncStatus).toBe('SYNCED');
    });

    it('deletes remote attachment', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

      await service.deleteRemoteAttachment('task-abc', 'att-123');
      expect(apiClient.delete).toHaveBeenCalledWith('/tasks/task-abc/attachments/att-123');
    });
  });
});
