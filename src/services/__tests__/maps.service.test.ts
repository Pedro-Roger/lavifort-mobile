import { Linking, ActionSheetIOS, Platform, Alert } from 'react-native';
import { mapsService } from '../maps.service';

describe('mapsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNavigationUrls', () => {
    it('builds valid deep link and web URLs for Waze, Google Maps and Apple Maps', () => {
      const address = 'Avenida Beira Mar, 1000, Fortaleza - CE';
      const urls = mapsService.getNavigationUrls(address);

      expect(urls.wazeApp).toContain('waze://?q=');
      expect(urls.wazeApp).toContain(encodeURIComponent(address));
      expect(urls.wazeWeb).toContain('https://waze.com/ul?q=');
      expect(urls.googleMapsWeb).toContain('https://www.google.com/maps/search/?api=1&query=');
      expect(urls.appleMapsApp).toContain('maps://?q=');
    });

    it('handles empty or whitespace address gracefully', () => {
      const urls = mapsService.getNavigationUrls('');
      expect(urls.wazeWeb).toContain('https://waze.com/ul');
      expect(urls.googleMapsWeb).toContain('https://www.google.com/maps');
    });
  });

  describe('openApp', () => {
    it('opens native Waze URL when canOpenURL returns true', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);

      const success = await mapsService.openApp('waze', 'Fazenda Real');

      expect(success).toBe(true);
      expect(openURLSpy).toHaveBeenCalledWith(expect.stringContaining('waze://'));
    });

    it('falls back to web URL when native Waze app cannot be opened', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);

      const success = await mapsService.openApp('waze', 'Fazenda Real');

      expect(success).toBe(true);
      expect(openURLSpy).toHaveBeenCalledWith(expect.stringContaining('https://waze.com/ul'));
    });

    it('opens Google Maps app schema on iOS when available, or web on Android', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);

      await mapsService.openApp('google_maps', 'Fazenda Real');

      expect(openURLSpy).toHaveBeenCalled();
    });

    it('opens Apple Maps schema when apple_maps is requested', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);

      await mapsService.openApp('apple_maps', 'Fazenda Real');

      expect(openURLSpy).toHaveBeenCalledWith(expect.stringContaining('maps://'));
    });
  });

  describe('openAddressSelector', () => {
    it('invokes ActionSheetIOS on iOS platform', () => {
      const originalOS = Platform.OS;
      Platform.OS = 'ios';
      const actionSheetSpy = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation(jest.fn());

      mapsService.openAddressSelector('Rodovia CE-040');

      expect(actionSheetSpy).toHaveBeenCalled();
      Platform.OS = originalOS;
    });

    it('invokes Alert.alert on Android platform', () => {
      const originalOS = Platform.OS;
      Platform.OS = 'android';
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

      mapsService.openAddressSelector('Rodovia CE-040');

      expect(alertSpy).toHaveBeenCalledWith(
        'Navegar até o local',
        'Rodovia CE-040',
        expect.any(Array)
      );
      Platform.OS = originalOS;
    });
  });
});
