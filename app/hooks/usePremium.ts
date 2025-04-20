import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

// Simple global state management
let globalPremium = false;
const listeners = new Set<() => void>(); // ← Change to void return type

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const usePremium = () => {
  const [isPremium, setIsPremium] = useState(globalPremium);

  useEffect(() => {
    const listener = () => {
      setIsPremium(globalPremium); 
      return undefined; // ← Explicitly return undefined
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setPremiumStatus = async (status: boolean) => {
    globalPremium = status;
    await AsyncStorage.setItem('premium_status', String(status));
    notifyListeners();
  };

  const unlockPremium = async () => {
    await setPremiumStatus(true);
    console.log('Premium unlocked - global status:', globalPremium);
  };

  const lockPremium = async () => {
    await setPremiumStatus(false);
  };

  const resetForTesting = async () => {
    await AsyncStorage.removeItem('premium_status');
    await setPremiumStatus(false);
  };

  // Initialize on first load
  useEffect(() => {
    const init = async () => {
      const status = await AsyncStorage.getItem('premium_status');
      globalPremium = status === 'true';
      setIsPremium(globalPremium);
    };
    init();
  }, []);

  return {
    isPremium,
    unlockPremium,
    lockPremium,
    resetForTesting
  };
};

export default usePremium;