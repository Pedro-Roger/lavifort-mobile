jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock')
);

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  cacheDirectory: 'file:///mock/cache/',
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1024 * 150 }),
  readAsStringAsync: jest.fn().mockResolvedValue('mock-content'),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: {
    Images: 'Images',
    Videos: 'Videos',
    All: 'All',
  },
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted', granted: true }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted', granted: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [
      {
        uri: 'file:///mock/camera/photo.jpg',
        fileName: 'photo.jpg',
        fileSize: 1024 * 200,
        mimeType: 'image/jpeg',
      },
    ],
  }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [
      {
        uri: 'file:///mock/gallery/evidence.jpg',
        fileName: 'evidence.jpg',
        fileSize: 1024 * 350,
        mimeType: 'image/jpeg',
      },
    ],
  }),
}));

