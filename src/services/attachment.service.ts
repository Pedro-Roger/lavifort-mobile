import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { apiClient, normalizeApiResponse } from './api';
import { TaskAttachment } from '../types';
import { generateUUID } from '../utils/uuid';

export interface PickedImageResult {
  uri: string;
  nome: string;
  tamanho?: number;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface AttachmentService {
  requestCameraPermissions(): Promise<boolean>;
  requestMediaLibraryPermissions(): Promise<boolean>;
  pickImageFromCamera(): Promise<PickedImageResult | null>;
  pickImageFromLibrary(): Promise<PickedImageResult | null>;
  saveLocalAttachment(
    sourceUri: string,
    filename?: string,
    mimeType?: string,
    fileSize?: number
  ): Promise<{ uri: string; nome: string; tamanho?: number; mimeType: string }>;
  deleteLocalAttachment(uri: string): Promise<boolean>;
  uploadAttachment(taskId: string, attachment: TaskAttachment): Promise<TaskAttachment>;
  deleteRemoteAttachment(taskId: string, attachmentId: string): Promise<void>;
}

export class DefaultAttachmentService implements AttachmentService {
  async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  async pickImageFromCamera(): Promise<PickedImageResult | null> {
    const hasPermission = await this.requestCameraPermissions();
    if (!hasPermission) {
      throw new Error('Permissão da câmera necessária para capturar fotos');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const generatedName = `foto_${Date.now()}_${generateUUID().slice(0, 8)}.jpg`;

    return {
      uri: asset.uri,
      nome: asset.fileName || generatedName,
      tamanho: asset.fileSize,
      mimeType: asset.mimeType || 'image/jpeg',
      width: asset.width,
      height: asset.height,
    };
  }

  async pickImageFromLibrary(): Promise<PickedImageResult | null> {
    const hasPermission = await this.requestMediaLibraryPermissions();
    if (!hasPermission) {
      throw new Error('Permissão da galeria necessária para selecionar fotos');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const generatedName = `imagem_${Date.now()}_${generateUUID().slice(0, 8)}.jpg`;

    return {
      uri: asset.uri,
      nome: asset.fileName || generatedName,
      tamanho: asset.fileSize,
      mimeType: asset.mimeType || 'image/jpeg',
      width: asset.width,
      height: asset.height,
    };
  }

  async saveLocalAttachment(
    sourceUri: string,
    filename?: string,
    mimeType = 'image/jpeg',
    fileSize?: number
  ): Promise<{ uri: string; nome: string; tamanho?: number; mimeType: string }> {
    const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || 'file:///data/';
    const attachmentsDir = `${baseDir}attachments/`;
    const targetFilename = filename || `anexo_${Date.now()}_${generateUUID().slice(0, 8)}.jpg`;
    const targetUri = `${attachmentsDir}${targetFilename}`;

    try {
      await FileSystem.makeDirectoryAsync(attachmentsDir, { intermediates: true });
    } catch {
      // Ignore if directory exists
    }

    try {
      await FileSystem.copyAsync({
        from: sourceUri,
        to: targetUri,
      });
    } catch {
      // If copy fails (e.g. web or source is already in destination), use sourceUri
      return {
        uri: sourceUri,
        nome: targetFilename,
        tamanho: fileSize,
        mimeType,
      };
    }

    let resolvedSize = fileSize;
    if (!resolvedSize) {
      try {
        const info = await FileSystem.getInfoAsync(targetUri);
        if (info.exists && 'size' in info) {
          resolvedSize = info.size;
        }
      } catch {
        // Ignore info failure
      }
    }

    return {
      uri: targetUri,
      nome: targetFilename,
      tamanho: resolvedSize,
      mimeType,
    };
  }

  async deleteLocalAttachment(uri: string): Promise<boolean> {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      return true;
    } catch {
      return false;
    }
  }

  async uploadAttachment(taskId: string, attachment: TaskAttachment): Promise<TaskAttachment> {
    const formData = new FormData();
    
    // In React Native / mobile, file format for FormData is { uri, name, type }
    const filePayload = {
      uri: attachment.uri,
      name: attachment.nome || 'attachment.jpg',
      type: attachment.mimeType || 'image/jpeg',
    };

    // Append file to form data
    formData.append('file', filePayload as unknown as Blob);
    formData.append('taskId', taskId);
    if (attachment.nome) {
      formData.append('nome', attachment.nome);
    }

    const response = await apiClient.post<TaskAttachment | { data: TaskAttachment }>(
      `/tasks/${taskId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const data = normalizeApiResponse<TaskAttachment>(response.data);
    return {
      ...attachment,
      ...data,
      syncStatus: 'SYNCED',
    };
  }

  async deleteRemoteAttachment(taskId: string, attachmentId: string): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
  }
}

export const attachmentService = new DefaultAttachmentService();
