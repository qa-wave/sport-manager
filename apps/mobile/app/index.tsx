import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { StyleSheet, Text, View } from 'react-native';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3100/api/v1';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Club App</Text>
      <Text style={styles.subtitle}>Player & Parent (mobile)</Text>
      <Text style={styles.meta}>API: {apiUrl}</Text>
      <Text style={styles.meta}>Expo SDK: {Constants.expoConfig?.sdkVersion}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0d10',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#f4f4f5',
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    color: '#a1a1aa',
    fontSize: 16,
    marginTop: 4,
  },
  meta: {
    color: '#71717a',
    fontSize: 12,
    marginTop: 12,
    fontFamily: 'Courier',
  },
});
