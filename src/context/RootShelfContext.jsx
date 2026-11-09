
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initialStories,
  initialFolders,
  initialCharacters,
  initialPlaces,
  initialObjects,
} from '../data/mockData';
import {
  supabase,
  isSupabaseConfigured,
  isUUID,
  formatProfile,
  toDbProfile,
  formatStory,
  toDbStory,
  formatChapter,
  toDbChapter,
  formatCharacter,
  toDbCharacter,
  formatPlace,
  toDbPlace,
  formatObject,
  toDbObject,
} from '../lib/supabase';

const RootShelfContext = createContext(null);

const DEFAULT_NOTES = [
  'Investigar sobre los dialectos de las tribus del este para el capítulo 5.',
  'Revisar la coherencia temporal de la dinastía Vance.',
  'Diseñar el mapa de las cuevas de raíz antes de publicar.',
];

export function RootShelfProvider({ children }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [dbLoading, setDbLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Collections state
  const [stories, setStories] = useState(initialStories);
  const [characters, setCharacters] = useState(initialCharacters);
  const [places, setPlaces] = useState(initialPlaces);
  const [objects, setObjects] = useState(initialObjects);
  const [folders, setFolders] = useState(initialFolders);
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [favorites, setFavorites] = useState([]);
  const [readingProgress, setReadingProgress] = useState({});

  // 1. Initial LocalStorage Restoration (prevents hydration mismatch)
  useEffect(() => {
    try {
      // Si Supabase no está configurado (modo offline), restauramos sesión local
      if (!isSupabaseConfigured()) {
        const activeSession = localStorage.getItem('rootshelf_session_active') === 'true';
        setIsAuthenticated(activeSession);

        if (activeSession) {
          const savedUserId = localStorage.getItem('rootshelf_user_id');
          const savedUsername = localStorage.getItem('rootshelf_username') || 'Usuario';
          const savedEmail = localStorage.getItem('rootshelf_useremail') || '';
          const savedBio = localStorage.getItem('rootshelf_userbio') || 'Lector y creador de historias en RootShelf.';
          const savedStatus = localStorage.getItem('rootshelf_userstatus') || 'Disponible';
          const savedAvatar = localStorage.getItem('rootshelf_useravatar') || '';

          if (savedUserId) {
            setCurrentUser({
              id: savedUserId,
              username: savedUsername,
              email: savedEmail,
              avatar: savedAvatar,
              bio: savedBio,
              status: savedStatus,
            });
          }
        }
      }

      // Stories preservation & authorId normalization
      const savedStoriesRaw = localStorage.getItem('rootshelf_stories_data');
      if (savedStoriesRaw) {
        try {
          const parsed = JSON.parse(savedStoriesRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const normalized = parsed.map((s) => {
              if (!s.authorId) {
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

      // Favorites
      // Solo se restauran desde LocalStorage si Supabase no está configurado.
      if (!isSupabaseConfigured()) {
        const savedFavorites = localStorage.getItem('rootshelf_favorites_data');
        if (savedFavorites) {
          try {
            const parsed = JSON.parse(savedFavorites);
            if (Array.isArray(parsed)) setFavorites(parsed);
          } catch (e) {}
        }
      }

      // Reading Progress
      // Solo se restaura desde LocalStorage si Supabase no está configurado.
      if (!isSupabaseConfigured()) {
        const savedProgress = localStorage.getItem('rootshelf_progress_data');
        if (savedProgress) {
          try {
            const parsed = JSON.parse(savedProgress);
            if (parsed && typeof parsed === 'object') {
              setReadingProgress(parsed);
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('LocalStorage error in initialization', e);
    } finally {
      setIsMounted(true);
    }
  }, []);

  // Function to load all content from Supabase as PRIMARY source of truth
  // Carga el contenido desde Supabase como fuente principal de datos.
  const refreshFromSupabase = useCallback(async (activeUserId = null) => {
    if (!isSupabaseConfigured() || !supabase) return;

    setDbLoading(true);

    try {
      const isUserAuthenticated = Boolean(activeUserId && isUUID(activeUserId));

      // 1. Historias y capítulos
      let storiesQuery = supabase
        .from('stories')
        .select('*, chapters(*), profiles(username)')
        .order('created_at', { ascending: false });

      // Los invitados solamente pueden consultar historias publicadas.
      // Los usuarios autenticados reciben las historias permitidas por RLS:
      // publicadas y sus propios borradores.
      if (!isUserAuthenticated) {
        storiesQuery = storiesQuery.eq('status', 'published');
      }

      const { data: dbStories, error: storiesErr } = await storiesQuery;

      if (storiesErr) {
        console.error('Error loading stories from Supabase:', storiesErr);
      } else {
        const formattedStories = (dbStories || []).map((story) =>
          formatStory(story, story.chapters || [], story.profiles)
        );

        // También actualizamos cuando la consulta devuelve [].
        // Así no quedan historias ficticias de mockData o datos antiguos.
        setStories(formattedStories);

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'rootshelf_stories_data',
            JSON.stringify(formattedStories)
          );
        }
      }

      // 2. Personajes
      const { data: dbChars, error: charsErr } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false });

      if (charsErr) {
        console.error('Error loading characters from Supabase:', charsErr);
      } else {
        const formattedCharacters = (dbChars || []).map(formatCharacter);

        setCharacters(formattedCharacters);

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'rootshelf_characters_data',
            JSON.stringify(formattedCharacters)
          );
        }
      }

      // 3. Lugares
      const { data: dbPlaces, error: placesErr } = await supabase
        .from('places')
        .select('*')
        .order('created_at', { ascending: false });

      if (placesErr) {
        console.error('Error loading places from Supabase:', placesErr);
      } else {
        const formattedPlaces = (dbPlaces || []).map(formatPlace);

        setPlaces(formattedPlaces);

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'rootshelf_places_data',
            JSON.stringify(formattedPlaces)
          );
        }
      }

      // 4. Objetos
      const { data: dbObjects, error: objectsErr } = await supabase
        .from('objects')
        .select('*')
        .order('created_at', { ascending: false });

      if (objectsErr) {
        console.error('Error loading objects from Supabase:', objectsErr);
      } else {
        const formattedObjects = (dbObjects || []).map(formatObject);

        setObjects(formattedObjects);

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'rootshelf_objects_data',
            JSON.stringify(formattedObjects)
          );
        }
      }

      // 5. Favoritos y progreso de lectura
      // Solo se consultan cuando hay una sesión autenticada.
      if (isUserAuthenticated) {
        const { data: favs, error: favoritesErr } = await supabase
          .from('favorites')
          .select('story_id')
          .eq('user_id', activeUserId);

        if (favoritesErr) {
          console.error('Error loading favorites from Supabase:', favoritesErr);
        } else {
          const favoriteIds = (favs || []).map((favorite) =>
            String(favorite.story_id)
          );

          setFavorites(favoriteIds);

          if (typeof window !== 'undefined') {
            localStorage.setItem(
              'rootshelf_favorites_data',
              JSON.stringify(favoriteIds)
            );
          }
        }

        const { data: progressRows, error: progressErr } = await supabase
          .from('reading_progress')
          .select('*')
          .eq('user_id', activeUserId);

        if (progressErr) {
          console.error('Error loading reading progress from Supabase:', progressErr);
        } else {
          const progressMap = {};

          (progressRows || []).forEach((row) => {
            progressMap[String(row.story_id)] = {
              chapterId: row.chapter_id ? String(row.chapter_id) : null,
              lastReadAt: row.last_read_at || row.updated_at,
            };
          });

          setReadingProgress(progressMap);

          if (typeof window !== 'undefined') {
            localStorage.setItem(
              'rootshelf_progress_data',
              JSON.stringify(progressMap)
            );
          }
        }
      } else {
        // Evita que un invitado vea los favoritos o el progreso
        // que quedaron guardados de una sesión anterior.
        setFavorites([]);
        setReadingProgress({});

        if (typeof window !== 'undefined') {
          localStorage.setItem('rootshelf_favorites_data', JSON.stringify([]));
          localStorage.setItem('rootshelf_progress_data', JSON.stringify({}));
        }
      }
    } catch (err) {
      console.error('Error refreshing data from Supabase:', err);
    } finally {
      setDbLoading(false);
    }
  }, []);

  // 2. Supabase Auth Session
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    let isSubscribed = true;

    async function handleUserSession(user) {
      if (!user || !isSubscribed) return;

      try {
        // Fetch profile
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        const formatted = formatProfile(dbProfile, user);
        if (formatted && isSubscribed) {
          setCurrentUser(formatted);
          setIsAuthenticated(true);

          if (typeof window !== 'undefined') {
            localStorage.setItem('rootshelf_session_active', 'true');
            localStorage.setItem('rootshelf_user_id', formatted.id);
            localStorage.setItem('rootshelf_username', formatted.username);
            localStorage.setItem('rootshelf_useremail', formatted.email);
            localStorage.setItem('rootshelf_userbio', formatted.bio);
            localStorage.setItem('rootshelf_userstatus', formatted.status);
            localStorage.setItem('rootshelf_useravatar', formatted.avatar || '');
          }

          // Refresh all data from Supabase as primary source
          await refreshFromSupabase(user.id);
        }
      } catch (err) {
        console.warn('Notice handling user session with Supabase:', err);
      }
    }

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && isSubscribed) {
        handleUserSession(session.user);
      } else {
        // Guest mode: load public content from Supabase
        refreshFromSupabase(null);
      }
    });

    // Listen to Auth State Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        handleUserSession(session.user);
      } else if (event === 'SIGNED_OUT') {
        if (isSubscribed) {
          setIsAuthenticated(false);
          setCurrentUser(null);
          if (typeof window !== 'undefined') {
            localStorage.setItem('rootshelf_session_active', 'false');
            localStorage.removeItem('rootshelf_user_id');
            localStorage.removeItem('rootshelf_username');
            localStorage.removeItem('rootshelf_useremail');
            localStorage.removeItem('rootshelf_userbio');
            localStorage.removeItem('rootshelf_userstatus');
            localStorage.removeItem('rootshelf_useravatar');
          }
          refreshFromSupabase(null);
        }
      }
    });

    return () => {
      isSubscribed = false;
      subscription?.unsubscribe();
    };
  }, [refreshFromSupabase]);

  // Reliable story owner check
  const isStoryOwner = useCallback(
    (story) => {
      if (!isAuthenticated || !story || !currentUser?.id) return false;
      if (story.authorId && String(story.authorId) === String(currentUser.id)) return true;
      if (
        currentUser.username &&
        story.author &&
        currentUser.username.trim().toLowerCase() === story.author.trim().toLowerCase()
      ) {
        return true;
      }
      return false;
    },
    [isAuthenticated, currentUser]
  );

  // PRIMARY SUPABASE WRITES: Stories
  const saveStories = useCallback(
    async (newStories) => {
      // 1. Immediate optimistic UI update
      setStories(newStories);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('rootshelf_stories_data', JSON.stringify(newStories));
        } catch (e) {}
      }

      // 2. Primary Write to Supabase if authenticated
      if (isSupabaseConfigured() && supabase && isAuthenticated && isUUID(currentUser?.id)) {
        try {
          for (const s of newStories) {
            // Only persist stories authored by current user
            if (s.authorId === currentUser.id || s.author === currentUser.username || !s.authorId) {
              const dbStory = toDbStory(s, currentUser.id);

              if (isUUID(s.id)) {
                // Update existing story in Supabase
                const { error: storyErr } = await supabase
                  .from('stories')
                  .upsert(dbStory)
                  .eq('id', s.id);

                if (!storyErr && Array.isArray(s.chapters)) {
                  for (let i = 0; i < s.chapters.length; i++) {
                    const ch = s.chapters[i];
                    const dbChapter = toDbChapter(ch, s.id, i);
                    await supabase.from('chapters').upsert(dbChapter);
                  }
                }
              } else {
                // Insert new story into Supabase
                delete dbStory.id;
                const { data: createdStory, error: insertErr } = await supabase
                  .from('stories')
                  .insert(dbStory)
                  .select()
                  .single();

                if (!insertErr && createdStory?.id) {
                  s.id = createdStory.id;
                  s.authorId = currentUser.id;

                  if (Array.isArray(s.chapters)) {
                    for (let i = 0; i < s.chapters.length; i++) {
                      const ch = s.chapters[i];
                      const dbChapter = toDbChapter(ch, createdStory.id, i);
                      delete dbChapter.id;
                      const { data: createdCh } = await supabase
                        .from('chapters')
                        .insert(dbChapter)
                        .select()
                        .single();
                      if (createdCh?.id) ch.id = createdCh.id;
                    }
                  }
                }
              }
            }
          }

          // Update local state and backup with verified Supabase IDs
          setStories([...newStories]);
          if (typeof window !== 'undefined') {
            localStorage.setItem('rootshelf_stories_data', JSON.stringify(newStories));
          }
        } catch (err) {
          console.warn('Error saving story to Supabase:', err);
        }
      }
    },
    [isAuthenticated, currentUser]
  );

  // DELETE Story
  const deleteStory = useCallback(
    async (storyId) => {
      const updated = stories.filter((s) => String(s.id) !== String(storyId));
      setStories(updated);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('rootshelf_stories_data', JSON.stringify(updated));
        } catch (e) {}
      }

      if (isSupabaseConfigured() && supabase && isUUID(storyId)) {
        try {
          await supabase.from('chapters').delete().eq('story_id', storyId);
          await supabase.from('stories').delete().eq('id', storyId);
        } catch (e) {
          console.warn('Error deleting story in Supabase:', e);
        }
      }
    },
    [stories]
  );

  // PRIMARY SUPABASE WRITES: Characters
  const saveCharacters = useCallback(
    async (newChars) => {
      setCharacters(newChars);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('rootshelf_characters_data', JSON.stringify(newChars));
        } catch (e) {}
      }

      if (isSupabaseConfigured() && supabase && isAuthenticated && isUUID(currentUser?.id)) {
        try {
          for (const c of newChars) {
            const dbChar = toDbCharacter(c, currentUser.id);
            if (isUUID(c.id)) {
              await supabase.from('characters').upsert(dbChar);
            } else {
              delete dbChar.id;
              const { data: created } = await supabase
                .from('characters')
                .insert(dbChar)
                .select()
                .single();
              if (created?.id) c.id = created.id;
            }
          }
          setCharacters([...newChars]);
          if (typeof window !== 'undefined') {
            localStorage.setItem('rootshelf_characters_data', JSON.stringify(newChars));
          }
        } catch (err) {
          console.warn('Error saving character to Supabase:', err);
        }
      }
    },
    [isAuthenticated, currentUser]
  );

  // DELETE Character
  const deleteCharacter = useCallback(
    async (charId) => {
      const updated = characters.filter((c) => String(c.id) !== String(charId));
      setCharacters(updated);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('rootshelf_characters_data', JSON.stringify(updated));
        } catch (e) {}
      }

      if (isSupabaseConfigured() && supabase && isUUID(charId)) {
        try {
          await supabase.from('characters').delete().eq('id', charId);
        } catch (e) {
          console.warn('Error deleting character in Supabase:', e);
        }
      }
    },
    [characters]
  );

  // PRIMARY SUPABASE WRITES: Places
  const savePlaces = useCallback(
    async (newPlaces) => {
      setPlaces(newPlaces);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('rootshelf_places_data', JSON.stringify(newPlaces));
        } catch (e) {}
      }

      if (isSupabaseConfigured() && supabase && isAuthenticated && isUUID(currentUser?.id)) {
        try {
          for (const p of newPlaces) {
            const dbPlace = toDbPlace(p, currentUser.id);
            if (isUUID(p.id)) {
              await supabase.from('places').upsert(dbPlace);
            } else {
              delete dbPlace.id;
              const { data: created } = await supabase
                .from('places')
                .insert(dbPlace)
                .select()
                .single();
              if (created?.id) p.id = created.id;
            }
          }
          setPlaces([...newPlaces]);
          if (typeof window !== 'undefined') {
            localStorage.setItem('rootshelf_places_data', JSON.stringify(newPlaces));
          }
        } catch (err) {
          console.warn('Error saving place to Supabase:', err);
        }
      }
    },
    [isAuthenticated, currentUser]
  );

  // DELETE Place
  const deletePlace = useCallback(
    async (placeId) => {
      const updated = places.filter((p) => String(p.id) !== String(placeId));
      setPlaces(updated);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('rootshelf_places_data', JSON.stringify(updated));
        } catch (e) {}
      }

      if (isSupabaseConfigured() && supabase && isUUID(placeId)) {
        try {
          await supabase.from('places').delete().eq('id', placeId);
        } catch (e) {
          console.warn('Error deleting place in Supabase:', e);
        }
      }
    },
    [places]
  );

  // PRIMARY SUPABASE WRITES: Objects
  const saveObjects = useCallback(
    async (newObjects) => {
      setObjects(newObjects);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('rootshelf_objects_data', JSON.stringify(newObjects));
        } catch (e) {}
      }

      if (isSupabaseConfigured() && supabase && isAuthenticated && isUUID(currentUser?.id)) {
        try {
          for (const o of newObjects) {
            const dbObj = toDbObject(o, currentUser.id);
            if (isUUID(o.id)) {
              await supabase.from('objects').upsert(dbObj);
            } else {
              delete dbObj.id;
              const { data: created } = await supabase
                .from('objects')
                .insert(dbObj)
                .select()
                .single();
              if (created?.id) o.id = created.id;
            }
          }
          setObjects([...newObjects]);
          if (typeof window !== 'undefined') {
            localStorage.setItem('rootshelf_objects_data', JSON.stringify(newObjects));
          }
        } catch (err) {
          console.warn('Error saving object to Supabase:', err);
        }
      }
    },
    [isAuthenticated, currentUser]
  );

  // DELETE Object
  const deleteObject = useCallback(
    async (objId) => {
      const updated = objects.filter((o) => String(o.id) !== String(objId));
      setObjects(updated);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('rootshelf_objects_data', JSON.stringify(updated));
        } catch (e) {}
      }

      if (isSupabaseConfigured() && supabase && isUUID(objId)) {
        try {
          await supabase.from('objects').delete().eq('id', objId);
        } catch (e) {
          console.warn('Error deleting object in Supabase:', e);
        }
      }
    },
    [objects]
  );

  // Save Notes (Workspace scratchpad)
  const saveNotes = useCallback((newNotes) => {
    setNotes(newNotes);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rootshelf_notes_data', JSON.stringify(newNotes));
      } catch (e) {}
    }
  }, []);

  // Favorites handling
  const toggleFavorite = useCallback(
    async (storyId) => {
      const idStr = String(storyId);
      const isFav = favorites.includes(idStr);
      const newFavorites = isFav
        ? favorites.filter((id) => id !== idStr)
        : [...favorites, idStr];

      setFavorites(newFavorites);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('rootshelf_favorites_data', JSON.stringify(newFavorites));
        } catch (e) {}
      }

      if (isSupabaseConfigured() && supabase && isAuthenticated && isUUID(currentUser?.id) && isUUID(idStr)) {
        try {
          if (isFav) {
            await supabase
              .from('favorites')
              .delete()
              .eq('user_id', currentUser.id)
              .eq('story_id', idStr);
          } else {
            await supabase.from('favorites').insert({
              user_id: currentUser.id,
              story_id: idStr,
            });
          }
        } catch (e) {
          console.warn('Supabase toggleFavorite notice:', e);
        }
      }
    },
    [favorites, isAuthenticated, currentUser]
  );

  const isFavorite = useCallback(
    (storyId) => {
      return favorites.includes(String(storyId));
    },
    [favorites]
  );

  // Reading Progress handling
  const updateReadingProgress = useCallback(
    async (storyId, chapterId) => {
      const sId = String(storyId);
      const cId = chapterId ? String(chapterId) : null;
      const now = new Date().toISOString();

      const updatedMap = {
        ...readingProgress,
        [sId]: {
          chapterId: cId,
          lastReadAt: now,
        },
      };

      setReadingProgress(updatedMap);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('rootshelf_progress_data', JSON.stringify(updatedMap));
        } catch (e) {}
      }

      if (isSupabaseConfigured() && supabase && isAuthenticated && isUUID(currentUser?.id) && isUUID(sId)) {
        try {
          await supabase.from('reading_progress').upsert({
            user_id: currentUser.id,
            story_id: sId,
            chapter_id: isUUID(cId) ? cId : null,
            last_read_at: now,
            updated_at: now,
          });
        } catch (e) {
          console.warn('Supabase updateReadingProgress notice:', e);
        }
      }
    },
    [readingProgress, isAuthenticated, currentUser]
  );

  const getReadingProgress = useCallback(
    (storyId) => {
      return readingProgress[String(storyId)] || null;
    },
    [readingProgress]
  );

  // Log In: supports email or username + password
  const login = useCallback(
    async (identifier, password) => {
      setAuthLoading(true);
      setAuthError(null);
      const trimmed = (identifier || '').trim();

      // If Supabase is configured, authenticate via Supabase Auth
      if (isSupabaseConfigured() && supabase) {
        try {
          if (!trimmed) {
            setAuthError('Por favor ingresá tu correo electrónico.');
            setAuthLoading(false);
            return { success: false, error: 'Por favor ingresá tu correo electrónico.' };
          }

          // Para preservar privacidad y evitar consultas inválidas a columnas inexistentes,
          // el inicio de sesión se realiza con el correo electrónico registrado.
          if (!trimmed.includes('@')) {
            const msg = 'Por favor ingresá tu correo electrónico registrado para iniciar sesión.';
            setAuthError(msg);
            setAuthLoading(false);
            return { success: false, error: msg };
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email: trimmed,
            password,
          });

          if (error) {
            let msg = error.message;
            if (msg.includes('Invalid login credentials')) {
              msg = 'Correo electrónico o contraseña incorrectos.';
            } else if (msg.includes('Email not confirmed')) {
              msg = 'Por favor confirmá tu correo electrónico antes de ingresar. Revisá tu casilla de correo.';
            }
            setAuthError(msg);
            setAuthLoading(false);
            return { success: false, error: msg };
          }

          // Fetch profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          const formatted = formatProfile(profile, data.user);
          setCurrentUser(formatted);
          setIsAuthenticated(true);

          if (typeof window !== 'undefined') {
            localStorage.setItem('rootshelf_session_active', 'true');
            localStorage.setItem('rootshelf_user_id', formatted.id);
            localStorage.setItem('rootshelf_username', formatted.username);
            localStorage.setItem('rootshelf_useremail', formatted.email);
            localStorage.setItem('rootshelf_userbio', formatted.bio);
            localStorage.setItem('rootshelf_userstatus', formatted.status);
          }

          // Refresh all data from Supabase
          await refreshFromSupabase(data.user.id);

          setAuthLoading(false);
          return { success: true, user: data.user };
        } catch (err) {
          const message = err.message || 'Error al iniciar sesión.';
          setAuthError(message);
          setAuthLoading(false);
          return { success: false, error: message };
        }
      }

      // Offline / LocalStorage fallback
      const finalId = 'user_' + trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const finalUsername = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;

      const updatedUser = {
        id: finalId,
        username: finalUsername,
        email: trimmed.includes('@') ? trimmed : '',
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
      }

      setAuthLoading(false);
      return { success: true };
    },
    [refreshFromSupabase]
  );

  // Register: creates user in Supabase Auth with email confirmation support
  const register = useCallback(
    async (userData) => {
      setAuthLoading(true);
      setAuthError(null);

      // If Supabase is configured, register via Supabase Auth
      if (isSupabaseConfigured() && supabase) {
        try {
          const emailRedirectTo =
            typeof window !== 'undefined'
              ? `${window.location.origin}/auth/confirm`
              : undefined;

          const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
              emailRedirectTo,
              data: {
                username: userData.username,
                first_name: userData.firstName,
                last_name: userData.lastName,
                birth_day: userData.birthDay,
                birth_month: userData.birthMonth,
                birth_year: userData.birthYear,
              },
            },
          });

          if (error) {
            let msg = error.message;
            if (msg.includes('User already registered')) {
              msg = 'Ya existe una cuenta registrada con este correo.';
            } else if (msg.includes('Password should be at least')) {
              msg = 'La contraseña debe tener al menos 6 caracteres.';
            }
            setAuthError(msg);
            setAuthLoading(false);
            return { success: false, error: msg };
          }

          // Case A: User registered with confirmed session (auto-confirm or local)
          if (data?.session && data?.user) {
            const profilePayload = toDbProfile({
              id: data.user.id,
              username: userData.username || userData.email.split('@')[0],
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              bio: 'Lector y creador de historias en RootShelf.',
              status: 'Disponible',
            });

            await supabase.from('profiles').upsert(profilePayload);

            const formatted = formatProfile(profilePayload, data.user);
            setCurrentUser(formatted);
            setIsAuthenticated(true);

            if (typeof window !== 'undefined') {
              localStorage.setItem('rootshelf_session_active', 'true');
              localStorage.setItem('rootshelf_user_id', formatted.id);
              localStorage.setItem('rootshelf_username', formatted.username);
              localStorage.setItem('rootshelf_useremail', formatted.email);
              localStorage.setItem('rootshelf_userbio', formatted.bio);
              localStorage.setItem('rootshelf_userstatus', formatted.status);
            }

            await refreshFromSupabase(data.user.id);
            setAuthLoading(false);
            return { success: true, needsConfirmation: false, user: data.user };
          }

          // Case B: User registered and REQUIRES email confirmation
          // No creamos sesión falsa en cliente ni intentamos insertar con rol anónimo.
          // El perfil se creará vía Trigger al crearse el usuario o al confirmar.
          setAuthLoading(false);
          return {
            success: true,
            needsConfirmation: true,
            user: data.user,
            email: userData.email,
          };
        } catch (err) {
          const message = err.message || 'Error al registrar usuario.';
          setAuthError(message);
          setAuthLoading(false);
          return { success: false, error: message };
        }
      }

      // Offline / LocalStorage fallback
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
        localStorage.setItem('rootshelf_useremail', updatedUser.email);
        localStorage.setItem('rootshelf_userbio', updatedUser.bio);
        localStorage.setItem('rootshelf_userstatus', updatedUser.status);
        localStorage.setItem('rootshelf_user_profile', JSON.stringify(userData));
      }

      setAuthLoading(false);
      return { success: true, needsConfirmation: false };
    },
    [refreshFromSupabase]
  );

  // Password Reset / Recovery via Supabase
  const resetPassword = useCallback(async (email) => {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Servicio de autenticación no disponible.' };
    }
    try {
      const emailRedirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/confirm?type=recovery`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: emailRedirectTo,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Error al enviar enlace de recuperación.' };
    }
  }, []);

  // Logout - strictly resets auth session and localStorage
  const logout = useCallback(async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Error signing out of Supabase:', err);
      }
    }

    setIsAuthenticated(false);
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rootshelf_session_active', 'false');
      localStorage.removeItem('rootshelf_user_id');
      localStorage.removeItem('rootshelf_username');
      localStorage.removeItem('rootshelf_useremail');
      localStorage.removeItem('rootshelf_userbio');
      localStorage.removeItem('rootshelf_userstatus');
      localStorage.removeItem('rootshelf_useravatar');
    }
    refreshFromSupabase(null);
  }, [refreshFromSupabase]);

  // Update Profile
  const updateProfile = useCallback(
    async (fields) => {
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

      if (isSupabaseConfigured() && supabase && isUUID(currentUser?.id)) {
        try {
          const profilePayload = toDbProfile({
            ...currentUser,
            ...fields,
          });

          await supabase
            .from('profiles')
            .update(profilePayload)
            .eq('id', currentUser.id);
        } catch (err) {
          console.warn('Error updating profile in Supabase:', err);
        }
      }
    },
    [currentUser]
  );

  return (
    <RootShelfContext.Provider
      value={{
        isMounted,
        isAuthenticated,
        authLoading,
        authError,
        setAuthError,
        dbLoading,
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
        favorites,
        toggleFavorite,
        isFavorite,
        readingProgress,
        updateReadingProgress,
        getReadingProgress,
        isStoryOwner,
        login,
        register,
        logout,
        updateProfile,
        saveStories,
        deleteStory,
        saveCharacters,
        deleteCharacter,
        savePlaces,
        deletePlace,
        saveObjects,
        deleteObject,
        saveNotes,
        refreshFromSupabase,
        resetPassword,
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
