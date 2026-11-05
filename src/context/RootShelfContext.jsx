'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initialStories,
  initialFolders,
  initialCharacters,
  initialPlaces,
  initialObjects,
} from '../data/mockData';

const RootShelfContext = createContext(null);

const DEFAULT_NOTES = [
  'Investigar sobre los dialectos de las tribus del este para el capítulo 5.',
  'Revisar la coherencia temporal de la dinastía Vance.',
  'Diseñar el mapa de las cuevas de raíz antes de publicar.',
];

export function RootShelfProvider({ children }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    id: 'user_martin_01',
    username: 'Martín Sueldo',
    email: 'martin@rootshelf.com',
    avatar: '',
    bio: 'Descripción de perfil: Creador de sagas de fantasía y ciencia ficción en RootShelf.',
    status: 'Escribiendo nuevo capítulo',
  });

  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Collections state
  const [stories, setStories] = useState(initialStories);
  const [characters, setCharacters] = useState(initialCharacters);
  const [places, setPlaces] = useState(initialPlaces);
  const [objects, setObjects] = useState(initialObjects);
  const [folders, setFolders] = useState(initialFolders);
  const [notes, setNotes] = useState(DEFAULT_NOTES);

  // Load from localStorage only after client mount to prevent hydration mismatch
  useEffect(() => {
    try {
      const activeSession = localStorage.getItem('rootshelf_session_active') === 'true';
      setIsAuthenticated(activeSession);

      const savedUserId = localStorage.getItem('rootshelf_user_id') || 'user_martin_01';
      const savedUsername = localStorage.getItem('rootshelf_username') || 'Martín Sueldo';
      const savedBio = localStorage.getItem('rootshelf_userbio') || 'Descripción de perfil: Creador de sagas de fantasía y ciencia ficción en RootShelf.';
      const savedStatus = localStorage.getItem('rootshelf_userstatus') || 'Escribiendo nuevo capítulo';
      const savedAvatar = localStorage.getItem('rootshelf_useravatar') || '';

      setCurrentUser({
        id: savedUserId,
        username: savedUsername,
        avatar: savedAvatar,
        bio: savedBio,
        status: savedStatus,
      });

      // Stories preservation & authorId normalization
      const savedStoriesRaw = localStorage.getItem('rootshelf_stories_data');
      if (savedStoriesRaw) {
        try {
          const parsed = JSON.parse(savedStoriesRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const normalized = parsed.map((s) => {
              if (!s.authorId) {
                if (s.isOwner || (s.author && s.author.toLowerCase().includes('martín'))) {
                  return { ...s, authorId: 'user_martin_01' };
                }
                return { ...s, authorId: 'author_' + (s.id || Math.random()) };
              }
              return s;
            });
            setStories(normalized);
          }
        } catch (e) {
          console.error('Error parsing stored stories', e);
        }
      }

      // Characters
      const savedChars = localStorage.getItem('rootshelf_characters_data');
      if (savedChars) {
        try {
          const parsed = JSON.parse(savedChars);
          if (Array.isArray(parsed)) setCharacters(parsed);
        } catch (e) {}
      }

      // Places
      const savedPlaces = localStorage.getItem('rootshelf_places_data');
      if (savedPlaces) {
        try {
          const parsed = JSON.parse(savedPlaces);
          if (Array.isArray(parsed)) setPlaces(parsed);
        } catch (e) {}
      }

      // Objects
      const savedObjects = localStorage.getItem('rootshelf_objects_data');
      if (savedObjects) {
        try {
          const parsed = JSON.parse(savedObjects);
          if (Array.isArray(parsed)) setObjects(parsed);
        } catch (e) {}
      }

      // Notes
      const savedNotes = localStorage.getItem('rootshelf_notes_data');
      if (savedNotes) {
        try {
          const parsed = JSON.parse(savedNotes);
          if (Array.isArray(parsed)) setNotes(parsed);
        } catch (e) {}
      }
    } catch (e) {
      console.warn('LocalStorage error in initialization', e);
    } finally {
      setIsMounted(true);
    }
  }, []);

  // Save stories when updated
  const saveStories = (newStories) => {
    setStories(newStories);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rootshelf_stories_data', JSON.stringify(newStories));
      } catch (e) {}
    }
  };

  const saveCharacters = (newChars) => {
    setCharacters(newChars);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rootshelf_characters_data', JSON.stringify(newChars));
      } catch (e) {}
    }
  };

  const savePlaces = (newPlaces) => {
    setPlaces(newPlaces);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rootshelf_places_data', JSON.stringify(newPlaces));
      } catch (e) {}
    }
  };

  const saveObjects = (newObjects) => {
    setObjects(newObjects);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rootshelf_objects_data', JSON.stringify(newObjects));
      } catch (e) {}
    }
  };

  const saveNotes = (newNotes) => {
    setNotes(newNotes);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rootshelf_notes_data', JSON.stringify(newNotes));
      } catch (e) {}
    }
  };

  // Reliable story owner check
  const isStoryOwner = (story) => {
    if (!isAuthenticated || !story || !currentUser?.id) return false;
    if (story.authorId && story.authorId === currentUser.id) return true;
    // Fallback if authorId was Martín and current user is Martín
    if (
      currentUser.username === 'Martín Sueldo' &&
      (story.author === 'Martín Sueldo' || story.authorId === 'user_martin_01')
    ) {
      return true;
    }
    return false;
  };

  // Log In existing user
  const login = (identifier, password) => {
    const trimmed = (identifier || '').trim();
    let finalId = 'user_martin_01';
    let finalUsername = trimmed;

    if (
      trimmed.toLowerCase() === 'martín sueldo' ||
      trimmed.toLowerCase() === 'martin sueldo' ||
      trimmed.toLowerCase() === 'martin'
    ) {
      finalId = 'user_martin_01';
      finalUsername = 'Martín Sueldo';
    } else {
      finalId = 'user_' + trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    const updatedUser = {
      ...currentUser,
      id: finalId,
      username: finalUsername,
    };

    setCurrentUser(updatedUser);
    setIsAuthenticated(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem('rootshelf_session_active', 'true');
      localStorage.setItem('rootshelf_user_id', finalId);
      localStorage.setItem('rootshelf_username', finalUsername);
    }
  };

  // Register new user
  const register = (userData) => {
    const finalId = 'user_' + Date.now();
    const finalUsername = (userData.username || userData.firstName || 'Usuario').trim();

    const updatedUser = {
      id: finalId,
      username: finalUsername,
      email: userData.email || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      avatar: '',
      bio: 'Lector y creador de historias en RootShelf.',
      status: 'Disponible',
    };

    setCurrentUser(updatedUser);
    setIsAuthenticated(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem('rootshelf_session_active', 'true');
      localStorage.setItem('rootshelf_user_id', finalId);
      localStorage.setItem('rootshelf_username', finalUsername);
      localStorage.setItem('rootshelf_userbio', updatedUser.bio);
      localStorage.setItem('rootshelf_userstatus', updatedUser.status);
      localStorage.setItem('rootshelf_user_profile', JSON.stringify(userData));
    }
  };

  // Logout - strictly redirects to '/' in guest mode
  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rootshelf_session_active', 'false');
    }
  };

  const updateProfile = (fields) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...fields };
      if (typeof window !== 'undefined') {
        if (fields.username) localStorage.setItem('rootshelf_username', fields.username);
        if (fields.bio) localStorage.setItem('rootshelf_userbio', fields.bio);
        if (fields.status) localStorage.setItem('rootshelf_userstatus', fields.status);
        if (fields.avatar) localStorage.setItem('rootshelf_useravatar', fields.avatar);
      }
      return updated;
    });
  };

  return (
    <RootShelfContext.Provider
      value={{
        isMounted,
        isAuthenticated,
        currentUser,
        showAuthPrompt,
        setShowAuthPrompt,
        searchQuery,
        setSearchQuery,
        stories,
        characters,
        places,
        objects,
        folders,
        notes,
        isStoryOwner,
        login,
        register,
        logout,
        updateProfile,
        saveStories,
        saveCharacters,
        savePlaces,
        saveObjects,
        saveNotes,
      }}
    >
      {children}
    </RootShelfContext.Provider>
  );
}

export function useRootShelf() {
  const ctx = useContext(RootShelfContext);
  if (!ctx) {
    throw new Error('useRootShelf must be used within a RootShelfProvider');
  }
  return ctx;
}
