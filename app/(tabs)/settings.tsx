import { View, Text, Button, StyleSheet } from 'react-native';
import { usePremium } from '../hooks/usePremium';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { isPremium, resetForTesting, unlockPremium, lockPremium } = usePremium();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DEBUG SETTINGS</Text>
      
      <Text style={styles.status}>
        Premium Status: {isPremium ? 'ACTIVE' : 'INACTIVE'}
      </Text>

      <Button 
        title="Reset Premium Status" 
        onPress={resetForTesting}
        color="red"
      />

      <View style={styles.spacer} />

      <Button 
        title="Force Premium OFF" 
        onPress={lockPremium}
      />

      <View style={styles.spacer} />

      <Button 
        title="Force Premium ON" 
        onPress={unlockPremium}
        color="green"
      />

      <View style={styles.spacer} />

      <Button
        title="CLEAR ALL STORAGE (Danger!)"
        onPress={async () => {
          await AsyncStorage.clear();
          alert('Storage cleared!');
        }}
        color="red"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  status: {
    fontSize: 18,
    color: 'white',
    marginBottom: 20,
  },
  spacer: {
    height: 15,
  },
});