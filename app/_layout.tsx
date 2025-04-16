import { Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import { Text as RNText, View } from 'react-native';
import { useEffect } from 'react';

export default function Layout() {
  const [fontsLoaded] = useFonts({
    StreetSoul: require('../assets/fonts/SuperShiny-0v0rG.ttf'),
  });

  useEffect(() => {
    const oldRender = RNText.render;
    RNText.render = function (...args) {
      const origin = oldRender.call(this, ...args);
      return {
        ...origin,
        props: {
          ...origin.props,
          style: [{ fontFamily: 'StreetSoul' }, origin.props.style],
        },
      };
    };
  }, []);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <Slot />
    </View>
  );
}