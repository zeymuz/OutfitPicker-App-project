import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View, Animated, Easing, Alert } from 'react-native';
import { useOutfitStore } from '../hooks/useOutfitStore';
import { useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
  const randomize = useOutfitStore(state => state.randomize);
  const animValue = useRef(new Animated.Value(0)).current;

  const handlePress = async () => {
    animValue.setValue(0);
    Animated.timing(animValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.elastic(1.5),
      useNativeDriver: true,
    }).start();

    const result = await randomize();
    if (result?.error) {
      Alert.alert('No Photos Found', result.error);
    }
  };

  const jelloAnimation = {
    transform: [
      {
        scale: animValue.interpolate({
          inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
          outputRange: [1, 0.9, 1.1, 0.95, 1.05, 1]
        })
      },
      {
        rotate: animValue.interpolate({
          inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
          outputRange: ['0deg', '-5deg', '3deg', '-3deg', '2deg', '0deg']
        })
      }
    ]
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs 
        screenOptions={{
          tabBarShowLabel: false,
          headerShadowVisible: false,
          tabBarBackground: () => (
            <LinearGradient
              colors={['#000000', '#1E1E1E', '#121212']}
              start={{ x: 1, y: 0 }}
              end={{ x: 1, y: 1 }}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
            />
          ),
          tabBarStyle: {
            height: 60, // Reduced from 80 to make space for button
            borderTopWidth: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => (
              <Ionicons 
                name="shirt" 
                size={24} 
                color={focused ? 'red' : 'darkred'} 
              />
            ),
            headerTitle: 'Outfit',
            headerBackground: () => (
              <LinearGradient
                colors={['#000000', '#1E1E1E', '#121212']}
                start={{ x: 1, y: 0 }}
                end={{ x: 1, y: 1 }}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
            ),
            headerTitleStyle: {
              fontFamily: 'StreetSoul',
              top: 1,
              fontSize: 70,
              textAlign: 'center',
              color: 'white',
            },
          }}
        />

        <Tabs.Screen
          name="gallery"
          options={{
            tabBarIcon: ({ focused }) => (
              <Ionicons 
                name="images" 
                size={24} 
                color={focused ? 'red' : 'darkred'} 
              />
            ),
            headerTitle: 'Gallery',
            headerBackground: () => (
              <LinearGradient
                colors={['#000000', '#1E1E1E', '#121212']}
                start={{ x: 1, y: 0 }}
                end={{ x: 1, y: 1 }}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
            ),
            headerTitleStyle: {
              fontFamily: 'StreetSoul',
              fontSize: 70,
              color: 'white',
            },
          }}
        />

        <Tabs.Screen
          name="premium"
          options={{
            tabBarIcon: ({ focused }) => (
              <Ionicons 
                name="diamond" 
                size={24} 
                color={focused ? 'red' : 'darkred'} 
              />
            ),
            headerTitle: 'Premium',
            headerBackground: () => (
              <LinearGradient
                colors={['#000000', '#1E1E1E', '#121212']}
                start={{ x: 1, y: 0 }}
                end={{ x: 1, y: 1 }}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
            ),
            headerTitleStyle: {
              fontFamily: 'StreetSoul',
              fontSize: 70,
              color: 'white',
            },
          }}
        />
      </Tabs>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handlePress} activeOpacity={1}>
          <Animated.View style={[styles.randomizeButton, jelloAnimation]}>
            <Ionicons name="shuffle" size={28} color="white" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    left: '50%',
    bottom: 30, // Adjusted from 40 to account for smaller tab bar
    marginLeft: -35,
    zIndex: 100,
  },
  randomizeButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 10,
  },
});