import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

type Album = {
  name: string;
  images: string[];
};

export const useAlbumStorage = (category: string) => {
  const [albums, setAlbums] = useState<Record<string, Album>>({});
  const [currentAlbum, setCurrentAlbum] = useState<string>('');

  useEffect(() => {
    const loadAlbums = async () => {
      try {
        const stored = await AsyncStorage.getItem(`albums_${category}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setAlbums(parsed.albums || {});
          setCurrentAlbum(parsed.currentAlbum || '');
        } else {
          setAlbums({});
          setCurrentAlbum('');
        }
      } catch (error) {
        console.error('Failed to load albums', error);
        setAlbums({});
        setCurrentAlbum('');
      }
    };
    loadAlbums();
  }, [category]);

  const updateAlbums = async (newAlbums: Record<string, Album>, selectedAlbum?: string) => {
    try {
      const toStore = {
        albums: newAlbums,
        currentAlbum: selectedAlbum !== undefined ? selectedAlbum : currentAlbum
      };
      await AsyncStorage.setItem(`albums_${category}`, JSON.stringify(toStore));
      setAlbums(newAlbums);
      if (selectedAlbum !== undefined) {
        setCurrentAlbum(selectedAlbum);
      }
    } catch (error) {
      console.error('Failed to save albums', error);
    }
  };

  const addImageToAlbum = async (albumName: string, imageUri: string) => {
    const updated = { ...albums };
    if (!updated[albumName]) {
      updated[albumName] = { name: albumName, images: [] };
    }
    updated[albumName] = {
      ...updated[albumName],
      images: [...updated[albumName].images, imageUri]
    };
    await updateAlbums(updated);
  };

  const addMultipleImagesToAlbum = async (albumName: string, imageUris: string[]) => {
    const updated = { ...albums };
    if (!updated[albumName]) {
      updated[albumName] = { name: albumName, images: [] };
    }
    updated[albumName] = {
      ...updated[albumName],
      images: [...updated[albumName].images, ...imageUris]
    };
    await updateAlbums(updated);
  };

  const createNewAlbum = async (albumName: string) => {
    if (albumName.trim()) {
      const updated = { 
        ...albums,
        [albumName]: { name: albumName, images: [] }
      };
      await updateAlbums(updated, albumName);
    }
  };

  const deleteAlbum = async (albumName: string) => {
    const updated = { ...albums };
    delete updated[albumName];
    await updateAlbums(updated, currentAlbum === albumName ? '' : currentAlbum);
  };

  const deleteImageFromAlbum = async (albumName: string, imageUri: string) => {
    const updated = { ...albums };
    if (updated[albumName]) {
      updated[albumName] = {
        ...updated[albumName],
        images: updated[albumName].images.filter(img => img !== imageUri)
      };
      await updateAlbums(updated);
    }
  };

  return {
    albums,
    currentAlbum,
    setCurrentAlbum: (name: string) => updateAlbums(albums, name),
    addImageToAlbum,
    addMultipleImagesToAlbum,
    createNewAlbum,
    deleteAlbum,
    deleteImageFromAlbum,
    updateAlbums
  };
};

export default useAlbumStorage;