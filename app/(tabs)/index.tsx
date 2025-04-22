import { View, Image, TouchableOpacity, StyleSheet, Text, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useOutfitStore } from '../hooks/useOutfitStore';
import { LinearGradient } from 'expo-linear-gradient';

// Get screen dimensions
const { height } = Dimensions.get('window');
const isSmallDevice = height < 700; // iPhone SE height is 667

// Category-specific default images
const defaultImages = {
  hat: require('../../assets/images/hats.png'),
  top: require('../../assets/images/tops.png'),
  bottom: require('../../assets/images/bottoms.png'),
  shoes: require('../../assets/images/shoess.png'),
  fallback: require('../../assets/images/adaptive-icon.png'),
};

export default function HomeScreen() {
  const router = useRouter();
  
  const hat = useOutfitStore(state => state.hat);
  const top = useOutfitStore(state => state.top);
  const bottom = useOutfitStore(state => state.bottom);
  const shoes = useOutfitStore(state => state.shoes);

  const categories = [
    { key: 'hat', label: "Hats", value: hat },
    { key: 'top', label: 'Tops', value: top },
    { key: 'bottom', label: 'Bottoms', value: bottom },
    { key: 'shoes', label: 'Shoes', value: shoes }
  ];

  // Compact sizing for small devices
  const imageSize = isSmallDevice ? 110 : 170;
  const imageTop = isSmallDevice ? 8 : 20;
  const imageMargin = isSmallDevice ? 5 : 0;

  return (
    <View style={[styles.container, { padding: isSmallDevice ? 2 : 6 }]}>
      <LinearGradient
  colors={['floralwhite', 'floralwhite']}
  start={{ x: 1, y: 0 }}
  end={{ x: 1, y: 1 }}
  locations={[0.2, 1]}
  style={styles.gradientBackground}
/>
      {categories.map((category) => (
        <TouchableOpacity 
          key={category.key}
          onPress={() => router.push({
            pathname: '/(tabs)/gallery',
            params: { 
              category: category.key,
              _timestamp: Date.now() 
            }
          })}
          style={[styles.categoryContainer, { marginBottom: imageMargin }]}
        >
          <Image 
            source={category.value ? { uri: category.value } : (defaultImages[category.key] || defaultImages.fallback)}
            style={[
              styles.outfitImage, 
              { 
                width: imageSize, 
                height: imageSize,
                top: imageTop,
              }
            ]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  categoryContainer: {
    alignItems: 'center',
  },
  outfitImage: {
    borderRadius: 10,
    borderWidth: 0,
    objectFit:  'cover',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});