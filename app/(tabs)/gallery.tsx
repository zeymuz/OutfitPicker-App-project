import { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Button, 
  Alert, 
  ActivityIndicator, 
  TextInput, 
  Dimensions,
  Platform,
  PixelRatio 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOutfitStore } from '../hooks/useOutfitStore';
import { useAlbumStorage } from '../hooks/useAlbumStorage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { imageService } from '../services/imageService';
import CustomText from '../../components/CustomText';


// Responsive scaling setup
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_HEIGHT < 700; // iPhone SE height is 667
const BASE_WIDTH = 428; // iPhone 14 Plus width
const BASE_HEIGHT = 926; // iPhone 14 Plus height

// Calculate scale based on both width and height
const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;
const scale = Math.min(widthScale, heightScale) * (isSmallDevice ? 0.9 : 1);

function normalize(size: number) {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
}

const defaultImages = {
  fallback: require('../../assets/images/adaptive-icon.png'),
};

type Album = {
  name: string;
  images: string[];
};

const VALID_CATEGORIES = ['hat', 'top', 'bottom', 'shoes'] as const;
type Category = typeof VALID_CATEGORIES[number];

const IMAGE_GRID_COLUMNS = 3;

export default function GalleryScreen() {
  const { category: categoryParam } = useLocalSearchParams();
  const category = VALID_CATEGORIES.includes(categoryParam as Category) 
    ? categoryParam as Category 
    : null;
    
  const setItem = useOutfitStore((state) => state.setItem);
  const router = useRouter();
  
  const {
    albums,
    currentAlbum,
    setCurrentAlbum,
    addImageToAlbum,
    addMultipleImagesToAlbum,
    createNewAlbum,
    deleteAlbum,
    deleteImageFromAlbum,
    updateAlbums
  } = useAlbumStorage(category || 'hat');
  
  const [newAlbumName, setNewAlbumName] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingTotal, setProcessingTotal] = useState(0);

  const imageSize = (SCREEN_WIDTH / IMAGE_GRID_COLUMNS) - normalize(10);

  const goBack = useCallback(() => {
    if (currentAlbum) {
      setCurrentAlbum('');
    } else {
      router.back();
    }
  }, [currentAlbum, router, setCurrentAlbum]);

  const processMultipleImages = useCallback(async (imageUris: string[], removeBackground: boolean) => {
    setIsProcessing(true);
    setProcessingTotal(imageUris.length);
    setProcessingProgress(0);

    try {
      const processedUris: string[] = [];
      
      for (const uri of imageUris) {
        try {
          let processedUri = uri;
          
          if (removeBackground) {
            const result = await imageService.processImage(uri);
            processedUri = result.processed;
          }
          
          processedUris.push(processedUri);
        } catch (error) {
          console.error(`Failed to process image ${uri}:`, error);
          processedUris.push(uri);
        }
        
        setProcessingProgress(prev => prev + 1);
      }

      await addMultipleImagesToAlbum(currentAlbum, processedUris);
    } catch (error) {
      console.error('Failed to add images:', error);
      Alert.alert('Error', 'Failed to add photos to collection');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingTotal(0);
    }
  }, [currentAlbum, addMultipleImagesToAlbum]);

  const handleImageSelection = useCallback(async (albumName: string) => {
    if (!albumName || !category) return;

    Alert.alert(
      "Add Photos",
      "How would you like to add photos?",
      [
        {
          text: "Choose from Gallery",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              aspect: undefined,
              quality: 0.8,
              allowsMultipleSelection: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            if (result.assets.length === 1) {
              const imageUri = result.assets[0].uri;
              Alert.alert(
                "Add Photo",
                "Would you like to remove the background from this photo?",
                [
                  {
                    text: "Keep Original",
                    onPress: async () => {
                      try {
                        await addImageToAlbum(albumName, imageUri);
                      } catch (error) {
                        console.error('Failed to add image:', error);
                        Alert.alert('Error', 'Failed to add photo to collection');
                      }
                    }
                  },
                  {
                    text: "Remove Background",
                    onPress: async () => {
                      setIsProcessing(true);
                      try {
                        const processingResult = await imageService.processImage(imageUri);
                        await addImageToAlbum(albumName, processingResult.processed);
                      } catch (error) {
                        console.error('Background removal failed:', error);
                        Alert.alert('Error', 'Failed to process photo');
                      } finally {
                        setIsProcessing(false);
                      }
                    }
                  },
                  {
                    text: "Cancel",
                    style: "cancel"
                  }
                ]
              );
            } else {
              Alert.alert(
                "Add Multiple Photos",
                `Would you like to remove backgrounds from all ${result.assets.length} photos?`,
                [
                  {
                    text: "Cancel",
                    style: "cancel"
                  },
                  {
                    text: "Keep All Originals",
                    onPress: async () => {
                      const uris = result.assets.map(asset => asset.uri);
                      await processMultipleImages(uris, false);
                    }
                  },
                  {
                    text: "Remove All Backgrounds",
                    onPress: async () => {
                      const uris = result.assets.map(asset => asset.uri);
                      await processMultipleImages(uris, true);
                    }
                  }
                ]
              );
            }
          }
        },
        {
          text: "Take a Photo",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission required', 'Camera access is needed to take photos');
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              aspect: undefined,
              quality: 0.8,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            const imageUri = result.assets[0].uri;
            Alert.alert(
              "Add Photo",
              "Would you like to remove the background from this photo?",
              [
                {
                  text: "Keep Original",
                  onPress: async () => {
                    try {
                      await addImageToAlbum(albumName, imageUri);
                    } catch (error) {
                      console.error('Failed to add image:', error);
                      Alert.alert('Error', 'Failed to add photo to collection');
                    }
                  }
                },
                {
                  text: "Remove Background",
                  onPress: async () => {
                    setIsProcessing(true);
                    try {
                      const processingResult = await imageService.processImage(imageUri);
                      await addImageToAlbum(albumName, processingResult.processed);
                    } catch (error) {
                      console.error('Background removal failed:', error);
                      Alert.alert('Error', 'Failed to process photo');
                    } finally {
                      setIsProcessing(false);
                    }
                  }
                },
                {
                  text: "Cancel",
                  style: "cancel"
                }
              ]
            );
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  }, [category, addImageToAlbum, processMultipleImages]);

  const createAlbum = useCallback(async () => {
    if (!newAlbumName.trim() || !category) {
      Alert.alert('Error', 'Collection name cannot be empty');
      return;
    }

    if (albums[newAlbumName]) {
      Alert.alert('Error', 'Collection already exists');
      return;
    }

    await createNewAlbum(newAlbumName);
    setNewAlbumName('');
    setIsModalVisible(false);
  }, [newAlbumName, albums, createNewAlbum, category]);

  const handleDeleteAlbum = useCallback(async (name: string) => {
    Alert.alert(
      'Delete Collection',
      `Delete "${name}" and all its photos?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteAlbum(name);
              if (currentAlbum === name) {
                setCurrentAlbum('');
              }
            } catch (error) {
              console.error('Failed to delete album:', error);
              Alert.alert('Error', 'Failed to delete collection');
            }
          }
        }
      ]
    );
  }, [deleteAlbum, currentAlbum, setCurrentAlbum]);

  const handleDeleteImage = useCallback(async (imageUri: string) => {
    if (!currentAlbum) return;
    
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteImageFromAlbum(currentAlbum, imageUri);
            } catch (error) {
              console.error('Failed to delete image:', error);
              Alert.alert('Error', 'Failed to delete photo');
            }
          }
        }
      ]
    );
  }, [currentAlbum, deleteImageFromAlbum]);

  const renderAlbumItem = useCallback(({ item: [name, album] }: { item: [string, Album] }) => (
    <TouchableOpacity
      style={styles.albumCard}
      onPress={() => setCurrentAlbum(name)}
      onLongPress={() => handleDeleteAlbum(name)}
    >
      <Image 
        source={album.images?.[0] ? { uri: album.images[0] } : defaultImages.fallback}
        style={styles.albumThumbnail}
        resizeMode="cover"
      />
      <View style={styles.albumInfo}>
        <Text style={styles.albumName}>{name}</Text>
        <Text style={styles.albumCount}>{album.images?.length || 0} photos</Text>
      </View>
      <Ionicons name="chevron-forward" size={normalize(20)} color="#999" />
    </TouchableOpacity>
  ), [handleDeleteAlbum, setCurrentAlbum]);

  const renderImageItem = useCallback(({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.imageItem, { width: imageSize, height: imageSize }]}
      onPress={() => {
        if (category) setItem(category, item);
        router.back();
      }}
      onLongPress={() => handleDeleteImage(item)}
    >
      <Image source={{ uri: item }} style={styles.image} resizeMode="cover" />
      <TouchableOpacity 
        style={styles.deleteImageButton}
        onPress={() => handleDeleteImage(item)}
      >
        <Ionicons name="trash" size={normalize(16)} color="red" />
      </TouchableOpacity>
    </TouchableOpacity>
  ), [category, router, setItem, imageSize, handleDeleteImage]);

  const renderContent = useCallback(() => {
    if (currentAlbum) {
      const images = albums[currentAlbum]?.images || [];
      
      if (images.length === 0) {
        return (
          <View style={styles.emptyAlbum}>
            <Image 
              source={defaultImages.fallback} 
              style={{ width: normalize(100), height: normalize(100), marginBottom: normalize(20) }}
            />
            <Text style={styles.emptyText}>No photos yet</Text>
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={() => handleImageSelection(currentAlbum)}
            >
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <FlatList
          key={`image-grid-${currentAlbum}`}
          data={images}
          numColumns={IMAGE_GRID_COLUMNS}
          renderItem={renderImageItem}
          keyExtractor={(item, index) => `${item}-${index}`}
          contentContainerStyle={styles.imageGrid}
        />
      );
    }

    const albumEntries = Object.entries(albums || {});
    
    return (
      <FlatList
        key="album-list"
        data={albumEntries}
        renderItem={renderAlbumItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Image 
              source={defaultImages.fallback} 
              style={{ width: normalize(100), height: normalize(100), marginBottom: normalize(20) }}
            />
            <Text style={styles.emptyText}>No Albums yet</Text>
          </View>
        }
        ListFooterComponent={
          <TouchableOpacity
            style={styles.newAlbumButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Ionicons name="add-circle" size={normalize(24)} color="#007AFF" />
            <Text style={styles.newAlbumText}>Add New Album</Text>
          </TouchableOpacity>
        }
        contentContainerStyle={albumEntries.length === 0 ? styles.emptyListContainer : styles.albumList}
      />
    );
  }, [currentAlbum, albums, renderAlbumItem, renderImageItem, handleImageSelection]);

  if (!category) {
    return (
      <View style={styles.container}>
        <Text style={styles.categoryTitle}>Please select a valid category from home</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={normalize(50)} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {currentAlbum ? currentAlbum : `${category.charAt(0).toUpperCase() + category.slice(1)} Albums`}
        </Text>
        <View style={{ width: normalize(24) }} />
      </View>

      {renderContent()}

      {currentAlbum && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={[styles.fab, styles.fabSingle]}
            onPress={() => handleImageSelection(currentAlbum)}
          >
            <Ionicons name="add" size={normalize(24)} color="white" />
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New {category.charAt(0).toUpperCase() + category.slice(1)} Album</Text>
            <TextInput
              style={styles.input}
              placeholder="Collection name"
              value={newAlbumName}
              onChangeText={setNewAlbumName}
              autoFocus
              maxLength={30}
            />
            <View style={styles.modalButtons}>
              <Button 
                title="Cancel" 
                onPress={() => setIsModalVisible(false)} 
                color="red"
              />
              <Button 
                title="Create" 
                onPress={createAlbum} 
                disabled={!newAlbumName.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.processingText}>
            Processing {processingProgress} of {processingTotal} images...
          </Text>
          {processingTotal > 0 && (
            <Text style={styles.processingProgress}>
              {Math.round((processingProgress / processingTotal) * 100)}% complete
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: normalize(12),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
    height: isSmallDevice ? normalize(60) : normalize(70),
  },
  title: {
    fontSize: normalize(isSmallDevice ? 16 : 35),
    
    fontWeight: 'bold',
  },
  albumList: {
    padding: normalize(isSmallDevice ? 10 : 15),
  },
  albumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: normalize(isSmallDevice ? 10 : 15),
    marginBottom: normalize(isSmallDevice ? 8 : 10),
    backgroundColor: 'white',
    borderRadius: normalize(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: normalize(2) },
    shadowOpacity: 0.1,
    shadowRadius: normalize(4),
    elevation: 2,
  },
  albumThumbnail: {
    width: normalize(isSmallDevice ? 50 : 60),
    height: normalize(isSmallDevice ? 50 : 60),
    borderRadius: normalize(8),
    backgroundColor: '#eee',
  },
  albumInfo: {
    flex: 1,
    marginLeft: normalize(isSmallDevice ? 12 : 15),
  },
  albumName: {
    fontSize: normalize(isSmallDevice ? 14 : 35),
    fontWeight: '500',
  },
  albumCount: {
    fontSize: normalize(isSmallDevice ? 12 : 21),
    color: '#888',
    marginTop: normalize(2),
  },
  imageGrid: {
    padding: normalize(isSmallDevice ? 8 : 0),
  },
  imageItem: {
    margin: normalize(isSmallDevice ? 3 : 5),
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: normalize(8),
  },
  deleteImageButton: {
    position: 'absolute',
    top: normalize(isSmallDevice ? 3 : 5),
    right: normalize(isSmallDevice ? 3 : 5),
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: normalize(8),
    padding: normalize(3),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: normalize(isSmallDevice ? 30 : 40),
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: normalize(isSmallDevice ? 14 : 25),
    color: '#888',
    marginBottom: normalize(isSmallDevice ? 15 : 20),
  },
  emptyAlbum: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: normalize(isSmallDevice ? 30 : 40),
  },
  newAlbumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: normalize(isSmallDevice ? 15 : 20),
    margin: normalize(isSmallDevice ? 70 : 70),
    backgroundColor: 'white',
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  newAlbumText: {
    marginLeft: normalize(isSmallDevice ? 8 : 10),
    color: '#007AFF',
    fontWeight: '500',
    fontSize: normalize(isSmallDevice ? 14 : 25),
  },
  addPhotoButton: {
    marginTop: normalize(isSmallDevice ? 15 : 20),
    paddingVertical: normalize(isSmallDevice ? 8 : 10),
    paddingHorizontal: normalize(isSmallDevice ? 25 : 30),
    backgroundColor: '#007AFF',
    borderRadius: normalize(8),
  },
  addPhotoText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: normalize(isSmallDevice ? 14 : 30),
  },
  fabContainer: {
    position: 'absolute',
    bottom: normalize(isSmallDevice ? 20 : 30),
    right: normalize(isSmallDevice ? 20 : 30),
  },
  fab: {
    width: normalize(isSmallDevice ? 50 : 60),
    height: normalize(isSmallDevice ? 50 : 60),
    borderRadius: normalize(25),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabSingle: {
    backgroundColor: '#007AFF',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: isSmallDevice ? '90%' : '80%',
    backgroundColor: 'white',
    borderRadius: normalize(10),
    padding: normalize(isSmallDevice ? 15 : 20),
  },
  modalTitle: {
    fontSize: normalize(isSmallDevice ? 16 : 30),
    fontWeight: 'bold',
    marginBottom: normalize(isSmallDevice ? 12 : 15),
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: normalize(8),
    padding: normalize(isSmallDevice ? 8 : 10),
    marginBottom: normalize(isSmallDevice ? 12 : 15),
    fontSize: normalize(isSmallDevice ? 14 : 16),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: normalize(isSmallDevice ? 12 : 15),
    color: 'white',
    fontSize: normalize(isSmallDevice ? 14 : 16),
  },
  processingProgress: {
    marginTop: normalize(5),
    color: 'white',
    fontSize: normalize(isSmallDevice ? 12 : 14),
  },
  categoryTitle: {
    fontSize: normalize(isSmallDevice ? 18 : 27),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    top: "50%",
    bottom: "50%",
  },
});