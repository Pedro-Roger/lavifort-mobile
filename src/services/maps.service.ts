import { Linking, ActionSheetIOS, Platform, Alert } from 'react-native';

export type NavigationAppId = 'waze' | 'google_maps' | 'apple_maps';

export interface NavigationUrls {
  wazeApp: string;
  wazeWeb: string;
  googleMapsApp: string;
  googleMapsWeb: string;
  appleMapsApp: string;
  appleMapsWeb: string;
}

export const mapsService = {
  getNavigationUrls(address: string): NavigationUrls {
    const encoded = encodeURIComponent(address.trim());
    return {
      wazeApp: `waze://?q=${encoded}&navigate=yes`,
      wazeWeb: `https://waze.com/ul?q=${encoded}&navigate=yes`,
      googleMapsApp:
        Platform.OS === 'ios'
          ? `comgooglemaps://?q=${encoded}`
          : `geo:0,0?q=${encoded}`,
      googleMapsWeb: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
      appleMapsApp: `maps://?q=${encoded}`,
      appleMapsWeb: `https://maps.apple.com/?q=${encoded}`,
    };
  },

  async openApp(appId: NavigationAppId, address: string): Promise<boolean> {
    const urls = this.getNavigationUrls(address);

    let appUrl = '';
    let fallbackWebUrl = '';

    switch (appId) {
      case 'waze':
        appUrl = urls.wazeApp;
        fallbackWebUrl = urls.wazeWeb;
        break;
      case 'google_maps':
        appUrl = urls.googleMapsApp;
        fallbackWebUrl = urls.googleMapsWeb;
        break;
      case 'apple_maps':
        appUrl = urls.appleMapsApp;
        fallbackWebUrl = urls.appleMapsWeb;
        break;
    }

    try {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
        return true;
      }
    } catch {
      // Fallback below
    }

    try {
      await Linking.openURL(fallbackWebUrl);
      return true;
    } catch {
      return false;
    }
  },

  openAddressSelector(address: string, onCopyAddress?: (address: string) => void): void {
    const cleanAddress = address.trim();
    if (!cleanAddress) return;

    if (Platform.OS === 'ios' && typeof ActionSheetIOS?.showActionSheetWithOptions === 'function') {
      const options = ['Cancelar', 'Waze', 'Google Maps', 'Apple Maps'];
      if (onCopyAddress) {
        options.push('Copiar Endereço');
      }

      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Navegar até o local',
          message: cleanAddress,
          options,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            this.openApp('waze', cleanAddress);
          } else if (buttonIndex === 2) {
            this.openApp('google_maps', cleanAddress);
          } else if (buttonIndex === 3) {
            this.openApp('apple_maps', cleanAddress);
          } else if (buttonIndex === 4 && onCopyAddress) {
            onCopyAddress(cleanAddress);
          }
        }
      );
    } else {
      const buttons: Array<{ text: string; style?: 'cancel' | 'default' | 'destructive'; onPress?: () => void }> = [
        {
          text: 'Waze',
          onPress: () => this.openApp('waze', cleanAddress),
        },
        {
          text: 'Google Maps',
          onPress: () => this.openApp('google_maps', cleanAddress),
        },
      ];

      if (onCopyAddress) {
        buttons.push({
          text: 'Copiar Endereço',
          onPress: () => onCopyAddress(cleanAddress),
        });
      }

      buttons.push({
        text: 'Cancelar',
        style: 'cancel',
      });

      Alert.alert('Navegar até o local', cleanAddress, buttons);
    }
  },
};
