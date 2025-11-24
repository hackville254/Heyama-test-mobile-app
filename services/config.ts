import { Platform } from 'react-native';
import Constants from 'expo-constants';

export async function getApiBase(): Promise<string> {
  const env = process.env.EXPO_PUBLIC_API_BASE;
  if (env) return env;

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.hostUri;
  if (hostUri) {
    const afterScheme = hostUri.includes('://') ? hostUri.split('://')[1] : hostUri;
    const host = afterScheme.split(':')[0];
    if (host) return `http://${host}:3000`;
  }

  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'https://63c0c57f8fd7.ngrok-free.app';
}
