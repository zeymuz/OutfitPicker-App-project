import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Album {
  name: string;
  images: string[];
}

interface OutfitState {
  hat: string | null;
  top: string | null;
  bottom: string | null;
  shoes: string | null;
  setItem: (category: keyof Omit<OutfitState, 'setItem' | 'randomize'>, uri: string) => void;
  randomize: () => Promise<{ success?: boolean; error?: string }>;
}

export const useOutfitStore = create<OutfitState>((set, get) => ({
  hat: null,
  top: null,
  bottom: null,
  shoes: null,
  
  setItem: (category, uri) => {
    const newState = { [category]: uri } as Pick<OutfitState, typeof category>;
    set(newState);
    AsyncStorage.setItem('outfit', JSON.stringify({ ...get(), ...newState }));
  },
  
  randomize: async () => {
    const categories: Array<keyof Omit<OutfitState, 'setItem' | 'randomize'>> = ['hat', 'top', 'bottom', 'shoes'];
    const newOutfit: Partial<OutfitState> = {};
    let hasImages = false;
    
    try {
      for (const category of categories) {
        const storedAlbums = await AsyncStorage.getItem(`albums_${category}`);
        if (!storedAlbums) continue;

        const parsedData = JSON.parse(storedAlbums);
        const albums: Record<string, Album> = parsedData.albums || parsedData;

        const allImages: string[] = [];
        Object.values(albums).forEach((album: any) => {
          if (album?.images && Array.isArray(album.images)) {
            allImages.push(...album.images);
          }
        });

        if (allImages.length > 0) {
          hasImages = true;
          const randomIndex = Math.floor(Math.random() * allImages.length);
          newOutfit[category] = allImages[randomIndex];
        }
      }

      if (!hasImages) {
        return { error: 'No images found in any albums. Please add photos to your collections first.' };
      }

      set(newOutfit);
      await AsyncStorage.setItem('outfit', JSON.stringify({ ...get(), ...newOutfit }));
      return { success: true };
    } catch (error) {
      console.error("Randomization failed:", error);
      return { error: error.message };
    }
  },
}));

export default useOutfitStore;