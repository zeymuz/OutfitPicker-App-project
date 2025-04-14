// app/services/imageService.ts
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

// Configuration
const API_KEY = 'HkLkqVmw4CuTqprC96eHJvbJ';
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_PIXELS = 2000 * 2000;
const TARGET_PIXELS = 1200 * 1200;
const QUALITY = 0.85;

export const imageService = {
  async processImage(originalUri: string) {
    try {
      const prepared = await this.prepareImage(originalUri);
      const result = await this.removeBackground(prepared.uri);
      
      if (result.error) throw new Error(result.error);

      return {
        original: originalUri,
        processed: result.transparent,
        wasResized: prepared.wasResized,
        width: prepared.width,
        height: prepared.height
      };
    } catch (error) {
      return {
        original: originalUri,
        processed: originalUri,
        error: error.message
      };
    }
  },

  async prepareImage(uri: string) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) throw new Error('Image file not found');
      if (fileInfo.size > MAX_FILE_SIZE) {
        throw new Error(`Image too large (${(fileInfo.size / (1024 * 1024)).toFixed(1)}MB)`);
      }

      const { width, height } = await this.getImageSize(uri);
      let needsResize = width * height > MAX_PIXELS;

      if (!needsResize) {
        return { uri, wasResized: false, width, height };
      }

      const ratio = Math.sqrt(TARGET_PIXELS / (width * height));
      const newWidth = Math.floor(width * ratio);
      const newHeight = Math.floor(height * ratio);

      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: newWidth, height: newHeight } }],
        { compress: QUALITY, format: ImageManipulator.SaveFormat.JPEG }
      );

      return {
        uri: manipResult.uri,
        wasResized: true,
        width: newWidth,
        height: newHeight
      };
    } catch (error) {
      throw error;
    }
  },

  async getImageSize(uri: string) {
    return new Promise<{width: number, height: number}>((resolve) => {
      Image.getSize(uri, 
        (w, h) => resolve({width: w, height: h}),
        () => resolve({width: 1000, height: 1000})
      );
    });
  },

  async removeBackground(uri: string) {
    try {
      // Create form data
      const formData = new FormData();
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      // Get the file extension
      const fileExt = uri.split('.').pop();
      const fileName = `image.${fileExt || 'jpg'}`;
      const fileType = `image/${fileExt || 'jpeg'}`;
      
      // Add the file to form data
      formData.append('image_file', {
        uri,
        name: fileName,
        type: fileType,
      } as any);
      formData.append('size', 'auto');

      // Make the API request
      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': API_KEY,
          'Accept': 'image/png',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      // Get the response as blob
      const blob = await response.blob();
      
      // Convert blob to base64
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Extract the base64 part (remove data:image/png;base64, prefix)
      const base64Image = base64data.split(',')[1];

      // Save the image
      const outputUri = `${FileSystem.cacheDirectory}bgremoved_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(
        outputUri,
        base64Image,
        { encoding: FileSystem.EncodingType.Base64 }
      );

      // Verify the file was created
      const fileInfoOut = await FileSystem.getInfoAsync(outputUri);
      if (!fileInfoOut.exists || fileInfoOut.size === 0) {
        throw new Error('Failed to save processed image');
      }

      return {
        original: uri,
        transparent: outputUri
      };
    } catch (error) {
      console.error('Background removal error:', error);
      return {
        original: uri,
        transparent: uri,
        error: error.message
      };
    }
  },

  async clearCache() {
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory);
      await Promise.all(
        files.filter(f => f.startsWith('bgremoved_'))
             .map(f => FileSystem.deleteAsync(`${FileSystem.cacheDirectory}${f}`))
      );
    } catch (error) {
      console.error('Cache clear failed:', error);
    }
  }
};

export default imageService;