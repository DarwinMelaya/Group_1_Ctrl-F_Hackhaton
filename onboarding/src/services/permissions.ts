import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type PermissionResult = 'granted' | 'denied';

export const SEA_ALERTS_CHANNEL_ID = 'sea-alerts';

export async function requestLocationPermission(): Promise<PermissionResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

export async function requestNotificationPermission(): Promise<PermissionResult> {
  try {
    // Android 13+ won't show the prompt until at least one channel exists.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(SEA_ALERTS_CHANNEL_ID, {
        name: 'Weather and sea alerts',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}
