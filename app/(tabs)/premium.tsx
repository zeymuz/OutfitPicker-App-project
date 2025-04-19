import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePremium } from '../hooks/usePremium';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PremiumScreen() {
  const { isPremium, unlockPremium, lockPremium } = usePremium();
  const router = useRouter();

  const features = [
    "Unlimited albums",
    "Unlimited photos per album",
    "Unlimited background removals",
    "Priority support"
  ];

  const handlePurchase = async () => {
    // In a real app, you would implement actual payment processing here
    // For testing, we'll just unlock premium immediately
    await unlockPremium();
    Alert.alert("Premium Unlocked", "Thank you for going premium!");
  };

  const handleRestore = async () => {
    // In a real app, you would implement purchase restoration here
    Alert.alert("Restore Purchase", "This would restore purchases in a real app");
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1E1E1E', '#121212']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>GO PREMIUM</Text>
      </View>

      <View style={styles.content}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark" size={20} color="white" />
            </View>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}

        {!isPremium ? (
          <>
            <TouchableOpacity 
              style={styles.purchaseButton}
              onPress={handlePurchase}
            >
              <Text style={styles.purchaseButtonText}>UNLOCK PREMIUM - $4.99</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.restoreButton}
              onPress={handleRestore}
            >
              <Text style={styles.restoreButtonText}>Restore Purchase</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.premiumActiveContainer}>
            <Text style={styles.premiumActiveText}>PREMIUM ACTIVE</Text>
          </View>
        )}

        {/* TESTING SECTION - REMOVE BEFORE PRODUCTION */}
        {__DEV__ && (
          <View style={styles.testingSection}>
            <Text style={styles.testingHeader}>DEVELOPER TESTING</Text>
            
            <TouchableOpacity 
              style={styles.testingButton}
              onPress={lockPremium}
            >
              <Text style={styles.testingButtonText}>Reset Premium Status</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.testingButton}
              onPress={unlockPremium}
            >
              <Text style={styles.testingButtonText}>Force Premium ON</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FF0000',
    fontFamily: 'StreetSoul',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureText: {
    fontSize: 18,
    color: 'white',
    flex: 1,
  },
  purchaseButton: {
    backgroundColor: '#FF0000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  restoreButtonText: {
    color: '#888',
    fontSize: 16,
  },
  premiumActiveContainer: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#00FF00',
  },
  premiumActiveText: {
    color: '#00FF00',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Testing section styles - REMOVE BEFORE PRODUCTION
  testingSection: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 20,
  },
  testingHeader: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  testingButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FF0000',
  },
  testingButtonText: {
    color: '#FF0000',
    textAlign: 'center',
  },
});