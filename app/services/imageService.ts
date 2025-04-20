import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

const API_KEY = '72db4130a2mshd521bcce1256977p1887fdjsn97aa67f82554';
const API_URL = 'https://background-removal4.p.rapidapi.com/v1/results';
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const OPTIMAL_WIDTH = 1200;
const TIMEOUT_DURATION = 30000; // 30 seconds

const getCacheDirectory = () => {
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) throw new Error('Cache directory not available');
  return cacheDir;
};

export const imageService = {
  async processImage(originalUri: string) {
    try {
      const prepared = await this.prepareImage(originalUri);
      const result = await this.removeBackgroundAPI4AI(prepared.uri);
      
      if (!result.success) throw new Error(result.error || 'Background removal failed');
      
      return {
        original: originalUri,
        processed: result.uri,
        wasResized: prepared.wasResized,
        width: prepared.width,
        height: prepared.height
      };
    } catch (error) {
      console.error('Process error:', error);
      return {
        original: originalUri,
        processed: originalUri,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  async prepareImage(uri: string) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) throw new Error('File not found');
      if (fileInfo.size > MAX_FILE_SIZE) {
        throw new Error(`Image too large (${Math.round(fileInfo.size / (1024 * 1024))}MB). Max 15MB.`);
      }

      const { width, height } = await this.getImageSize(uri);
      
      if (width <= OPTIMAL_WIDTH) {
        return { uri, wasResized: false, width, height };
      }

      const ratio = OPTIMAL_WIDTH / width;
      const newHeight = Math.floor(height * ratio);

      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: OPTIMAL_WIDTH, height: newHeight } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );

      return {
        uri: manipResult.uri,
        wasResized: true,
        width: OPTIMAL_WIDTH,
        height: newHeight
      };
    } catch (error) {
      console.error('Preparation error:', error);
      throw error;
    }
  },

  async getImageSize(uri: string): Promise<{width: number, height: number}> {
    return new Promise((resolve) => {
      Image.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        () => resolve({ width: 1000, height: 1000 })
      );
    });
  },

  async removeBackgroundAPI4AI(uri: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_DURATION);

    try {
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const formData = new FormData();
      formData.append('image', {
        uri,
        name: `photo.${fileExt}`,
        type: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`
      } as any);

      console.log('Sending request to API4AI...');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'X-RapidAPI-Key': API_KEY,
          'X-RapidAPI-Host': 'background-removal4.p.rapidapi.com',
        },
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeout);

      console.log('Received response status:', response.status);
      const result = await response.json();
      console.log('API Response Structure:', Object.keys(result));

      // Enhanced response parsing with multiple fallbacks
      const base64Image = this.extractImageFromResponse(result);
      
      if (!base64Image) {
        console.error('No image found in response. Full response:', JSON.stringify(result, null, 2));
        throw new Error('API response did not contain valid image data');
      }

      const outputUri = `${getCacheDirectory()}bgremoved_${Date.now()}.png`;
      await this.saveBase64Image(base64Image, outputUri);
      
      return { success: true, uri: outputUri };
      
    } catch (error) {
      clearTimeout(timeout);
      console.error('API4AI Error Details:', error);
      return { 
        success: false,
        error: 'Background removal failed. ' + (error instanceof Error ? error.message : 'Please try again.')
      };
    }
  },

  extractImageFromResponse(response: any): string | null {
    // Check all possible paths where the image might be
    const possiblePaths = [
      response?.results?.[0]?.entities?.[0]?.image, // Primary path
      response?.results?.[0]?.image,                // Alternative path 1
      response?.image,                              // Alternative path 2
      this.deepScanForImage(response)               // Deep scan as fallback
    ];

    for (const imageData of possiblePaths) {
      if (imageData && typeof imageData === 'string') {
        return imageData.startsWith('data:image') ? imageData : `data:image/png;base64,${imageData}`;
      }
    }
    return null;
  },

  deepScanForImage(obj: any): string | null {
    if (typeof obj === 'string') {
      if (obj.startsWith('data:image')) return obj;
      if (obj.length > 1000 && /^[A-Za-z0-9+/=]+$/.test(obj)) {
        return obj; // Raw base64 without prefix
      }
    }
    
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        const found = this.deepScanForImage(obj[key]);
        if (found) return found;
      }
    }
    
    return null;
  },

  async saveBase64Image(base64Data: string, outputUri: string) {
    const pureBase64 = base64Data.split(',')[1] || base64Data;
    await FileSystem.writeAsStringAsync(
      outputUri,
      pureBase64,
      { encoding: FileSystem.EncodingType.Base64 }
    );
    
    const fileInfo = await FileSystem.getInfoAsync(outputUri);
    if (!fileInfo.exists || fileInfo.size === 0) {
      throw new Error('Failed to save processed image');
    }
  },

  async clearCache() {
    try {
      const cacheDir = getCacheDirectory();
      const files = await FileSystem.readDirectoryAsync(cacheDir);
      await Promise.all(
        files.filter(f => f.startsWith('bgremoved_'))
             .map(f => FileSystem.deleteAsync(`${cacheDir}${f}`))
      );
    } catch (error) {
      console.error('Cache clear failed:', error);
    }
  }
};

export default imageService;