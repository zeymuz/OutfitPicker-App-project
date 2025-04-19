import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

export const usePremium = () => {
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      const status = await AsyncStorage.getItem('premium_status');
      setIsPremium(status === 'true');
    };
    checkPremiumStatus();
  }, []);

  const unlockPremium = async () => {
    await AsyncStorage.setItem('premium_status', 'true');
    setIsPremium(true);
  };

  const lockPremium = async () => {
    await AsyncStorage.setItem('premium_status', 'false');
    setIsPremium(false);
  };

  const resetForTesting = async () => {
    await AsyncStorage.removeItem('premium_status');
    setIsPremium(false);
  };

  return {
    isPremium,
    unlockPremium,
    lockPremium,
    resetForTesting
  };
};

export default usePremium;