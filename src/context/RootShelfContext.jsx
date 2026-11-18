
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

const OFFLINE_FALLBACK_LIMITS = {
  free: {
    stories: 2,
    characters: 5,
    places: 3,
    objects: 5,
    notes: 10,
    folders: 3,
  },
  premium: {
    stories: 20,
    characters: 100,
    places: 50,
    objects: 100,
    notes: 500,
    folders: 30,
  },
};

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

  // Subscription and Freemium state (single source of truth)
  const supabaseEnabled = isSupabaseConfigured();
  const [subscription, setSubscription] = useState(null);
  const [hasLoadedSubscription, setHasLoadedSubscription] = useState(!supabaseEnabled);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(supabaseEnabled);
  const [isRefreshingSubscription, setIsRefreshingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(null);

  const [allPlanLimits, setAllPlanLimits] = useState(() =>
    supabaseEnabled ? { free: {}, premium: {} } : OFFLINE_FALLBACK_LIMITS
  );
  const [limitsLoading, setLimitsLoading] = useState(supabaseEnabled);
  const [limitsError, setLimitsError] = useState(null);

  const [userUsage, setUserUsage] = useState({
    stories: 0,
    characters: 0,
    places: 0,
    objects: 0,
    notes: 0,
    folders: 0,
  });

  // Refs to prevent stale async responses from overwriting newer user sessions
  const activeUserIdRef = useRef(null);
  const subRequestSeqRef = useRef(0);
  const dataRequestSeqRef = useRef(0);
  const lastAutoRefreshRef = useRef(0);

  const [planLimitModal, setPlanLimitModal] = useState({
    isOpen: false,
    resourceKey: 'stories',
  });

  const openPlanLimitModal = useCallback((resourceKey = 'stories') => {
    setPlanLimitModal({ isOpen: true, resourceKey });
  }, []);

  const closePlanLimitModal = useCallback(() => {
    setPlanLimitModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Derived subscription state (single source of truth)
  const planTier = useMemo(() => {
    if (!isAuthenticated || !currentUser?.id) return null;
    if (isLoadingSubscription && !hasLoadedSubscription) return null;
    if (subscriptionError) return null;
    if (!subscription) {
      return hasLoadedSubscription ? 'free' : null;
    }
    return subscription.plan_tier === 'premium' ? 'premium' : 'free';
  }, [
    isAuthenticated,
    currentUser?.id,
    isLoadingSubscription,
    hasLoadedSubscription,
    subscriptionError,
    subscription,
  ]);

  const subscriptionStatus = useMemo(() => {
    if (!isAuthenticated || !currentUser?.id) return null;
    if (isLoadingSubscription && !hasLoadedSubscription) return null;
    if (subscriptionError) return null;
    if (!subscription) {
      return hasLoadedSubscription ? 'active' : null;
    }
    return subscription.status || 'active';
  }, [
    isAuthenticated,
    currentUser?.id,
    isLoadingSubscription,
    hasLoadedSubscription,
    subscriptionError,
    subscription,
  ]);

  const isPremium = useMemo(() => {
    return Boolean(
      isAuthenticated &&
        !subscriptionError &&
        planTier === 'premium' &&
        subscriptionStatus === 'active'
    );
  }, [isAuthenticated, subscriptionError, planTier, subscriptionStatus]);

  const planLimits = useMemo(() => {
    if (!isAuthenticated || !planTier) return {};
    const tierKey = isPremium ? 'premium' : 'free';
    return allPlanLimits[tierKey] || {};
  }, [isAuthenticated, planTier, isPremium, allPlanLimits]);

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
      let initialNotesCount = DEFAULT_NOTES.length;
      const savedNotes = localStorage.getItem('rootshelf_notes_data');
      if (savedNotes) {
        try {
          const parsed = JSON.parse(savedNotes);
          if (Array.isArray(parsed)) {
            setNotes(parsed);
            initialNotesCount = parsed.length;
          }
        } catch (e) {}
      }

      // Custom Folders (if stored)
      let initialCustomFoldersCount = 0;
      const savedFolders = localStorage.getItem('rootshelf_folders_data');
      if (savedFolders) {
        try {
          const parsed = JSON.parse(savedFolders);
          if (Array.isArray(parsed)) {
            setFolders(parsed);
            initialCustomFoldersCount = Math.max(0, parsed.length - initialFolders.length);
          }
        } catch (e) {}
      }

      setUserUsage((prev) => ({
        ...prev,
        notes: initialNotesCount,
        folders: initialCustomFoldersCount,
      }));

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

  // Single source of truth for subscription + plan limits + usage counts
  const refreshSubscription = useCallback(
    async ({ userId, silent = false, forceLoading = false } = {}) => {
      if (!isSupabaseConfigured() || !supabase) {
        setAllPlanLimits(OFFLINE_FALLBACK_LIMITS);
        setLimitsLoading(false);
        setLimitsError(null);
        setIsLoadingSubscription(false);
        setIsRefreshingSubscription(false);
        setHasLoadedSubscription(true);
        return;
      }

      const targetUserId = userId !== undefined ? userId : activeUserIdRef.current;
      const hasValidUser = Boolean(targetUserId && isUUID(targetUserId));
      const reqSeq = ++subRequestSeqRef.current;

      if (!silent) {
        setLimitsLoading(true);
      }

      if (hasValidUser) {
        if (!silent || forceLoading || !hasLoadedSubscription) {
          setIsLoadingSubscription(true);
        } else {
          setIsRefreshingSubscription(true);
        }
        setSubscriptionError(null);
      } else {
        setSubscription(null);
        setSubscriptionError(null);
        setHasLoadedSubscription(false);
        setIsLoadingSubscription(false);
        setIsRefreshingSubscription(false);
      }

      try {
        // 1. Consultar siempre límites oficiales de subscription_plan_limits (para invitados y autenticados)
        const limitsPromise = supabase.from('subscription_plan_limits').select('*');

        if (!hasValidUser) {
          const { data: limitsData, error: limitsErr } = await limitsPromise;
          if (reqSeq !== subRequestSeqRef.current) return;

          if (limitsErr) {
            console.error('Error loading subscription plan limits:', limitsErr);
            setLimitsError('No se pudieron cargar los límites de los planes.');
          } else if (Array.isArray(limitsData)) {
            const parsedLimits = { free: {}, premium: {} };
            limitsData.forEach((row) => {
              if (parsedLimits[row.plan_tier]) {
                parsedLimits[row.plan_tier][row.resource_key] = row.resource_limit;
              }
            });
            setAllPlanLimits(parsedLimits);
            setLimitsError(null);
          }
          setLimitsLoading(false);
          return;
        }

        // 2. Para usuarios autenticados, consultar límites + suscripción + conteos exactos en paralelo
        const [limitsResult, subResult, stCount, chCount, plCount, obCount] = await Promise.all([
          limitsPromise,
          supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', targetUserId)
            .maybeSingle(),
          supabase
            .from('stories')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', targetUserId),
          supabase
            .from('characters')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', targetUserId),
          supabase
            .from('places')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', targetUserId),
          supabase
            .from('objects')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', targetUserId),
        ]);

        // Descartar respuesta si cambió el usuario activo o llegó una consulta más reciente
        if (reqSeq !== subRequestSeqRef.current || activeUserIdRef.current !== targetUserId) {
          return;
        }

        const { data: limitsData, error: limitsErr } = limitsResult;
        if (limitsErr) {
          console.error('Error loading subscription plan limits:', limitsErr);
          setLimitsError('No se pudieron cargar los límites de los planes.');
        } else if (Array.isArray(limitsData)) {
          const parsedLimits = { free: {}, premium: {} };
          limitsData.forEach((row) => {
            if (parsedLimits[row.plan_tier]) {
              parsedLimits[row.plan_tier][row.resource_key] = row.resource_limit;
            }
          });
          setAllPlanLimits(parsedLimits);
          setLimitsError(null);
        }
        setLimitsLoading(false);

        const { data: subData, error: subErr } = subResult;
        if (subErr) {
          console.error('Error loading user subscription:', subErr);
          setSubscription(null);
          setSubscriptionError(
            subErr.message || 'No se pudo verificar el estado de tu suscripción.'
          );
          setHasLoadedSubscription(false);
        } else {
          setSubscription(subData || null);
          setSubscriptionError(null);
          setHasLoadedSubscription(true);
        }

        setUserUsage((prev) => ({
          stories: !stCount.error && typeof stCount.count === 'number' ? stCount.count : prev.stories,
          characters:
            !chCount.error && typeof chCount.count === 'number' ? chCount.count : prev.characters,
          places: !plCount.error && typeof plCount.count === 'number' ? plCount.count : prev.places,
          objects: !obCount.error && typeof obCount.count === 'number' ? obCount.count : prev.objects,
          notes: prev.notes,
          folders: prev.folders,
        }));
      } catch (err) {
        if (reqSeq !== subRequestSeqRef.current) return;
        console.error('Error fetching subscription details:', err);
        setLimitsLoading(false);
        if (hasValidUser && activeUserIdRef.current === targetUserId) {
          setSubscription(null);
          setSubscriptionError(err?.message || 'Error al cargar datos del plan.');
          setHasLoadedSubscription(false);
        }
      } finally {
        if (reqSeq === subRequestSeqRef.current) {
          setIsLoadingSubscription(false);
          setIsRefreshingSubscription(false);
          setLimitsLoading(false);
        }
      }
    },
    [hasLoadedSubscription]
  );

  // Function to load all content from Supabase as PRIMARY source of truth
  const refreshFromSupabase = useCallback(
    async (activeUserId = null) => {
      if (!isSupabaseConfigured() || !supabase) return;

      const isUserAuthenticated = Boolean(activeUserId && isUUID(activeUserId));
      const normalizedUserId = isUserAuthenticated ? activeUserId : null;
      const dataReqSeq = ++dataRequestSeqRef.current;

      activeUserIdRef.current = normalizedUserId;
      setDbLoading(true);

      // Iniciar la carga de suscripción y límites inmediatamente en paralelo
      const subscriptionPromise = refreshSubscription({
        userId: normalizedUserId,
        forceLoading: isUserAuthenticated && !hasLoadedSubscription,
      });

      try {
        // 1. Historias y capítulos
        let storiesQuery = supabase
          .from('stories')
          .select('*, chapters(*), profiles(username)')
          .order('created_at', { ascending: false });

        if (!isUserAuthenticated) {
          storiesQuery = storiesQuery.eq('status', 'published');
        }

        const { data: dbStories, error: storiesErr } = await storiesQuery;
        if (dataReqSeq !== dataRequestSeqRef.current) return;

        if (storiesErr) {
          console.error('Error loading stories from Supabase:', storiesErr);
        } else {
          const formattedStories = (dbStories || []).map((story) =>
            formatStory(story, story.chapters || [], story.profiles)
          );
          setStories(formattedStories);

          if (typeof window !== 'undefined') {
            localStorage.setItem('rootshelf_stories_data', JSON.stringify(formattedStories));
          }
        }

        // 2. Personajes
        const { data: dbChars, error: charsErr } = await supabase
          .from('characters')
          .select('*')
          .order('created_at', { ascending: false });
        if (dataReqSeq !== dataRequestSeqRef.current) return;

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
        if (dataReqSeq !== dataRequestSeqRef.current) return;

        if (placesErr) {
          console.error('Error loading places from Supabase:', placesErr);
        } else {
          const formattedPlaces = (dbPlaces || []).map(formatPlace);
          setPlaces(formattedPlaces);

          if (typeof window !== 'undefined') {
            localStorage.setItem('rootshelf_places_data', JSON.stringify(formattedPlaces));
          }
        }

        // 4. Objetos
        const { data: dbObjects, error: objectsErr } = await supabase
          .from('objects')
          .select('*')
          .order('created_at', { ascending: false });
        if (dataReqSeq !== dataRequestSeqRef.current) return;

        if (objectsErr) {
          console.error('Error loading objects from Supabase:', objectsErr);
        } else {
          const formattedObjects = (dbObjects || []).map(formatObject);
          setObjects(formattedObjects);

          if (typeof window !== 'undefined') {
            localStorage.setItem('rootshelf_objects_data', JSON.stringify(formattedObjects));
          }
        }

        // 5. Favoritos y progreso de lectura (solo autenticados)
        if (isUserAuthenticated) {
          const [favResult, progressResult] = await Promise.all([
            supabase.from('favorites').select('story_id').eq('user_id', normalizedUserId),
            supabase.from('reading_progress').select('*').eq('user_id', normalizedUserId),
          ]);
          if (dataReqSeq !== dataRequestSeqRef.current) return;

          if (favResult.error) {
            console.error('Error loading favorites from Supabase:', favResult.error);
          } else {
            const favoriteIds = (favResult.data || []).map((favorite) =>
              String(favorite.story_id)
            );
            setFavorites(favoriteIds);

            if (typeof window !== 'undefined') {
              localStorage.setItem('rootshelf_favorites_data', JSON.stringify(favoriteIds));
            }
          }

          if (progressResult.error) {
            console.error('Error loading reading progress from Supabase:', progressResult.error);
          } else {
            const progressMap = {};
            (progressResult.data || []).forEach((row) => {
              progressMap[String(row.story_id)] = {
                chapterId: row.chapter_id ? String(row.chapter_id) : null,
                lastReadAt: row.last_read_at || row.updated_at,
              };
            });
            setReadingProgress(progressMap);

            if (typeof window !== 'undefined') {
              localStorage.setItem('rootshelf_progress_data', JSON.stringify(progressMap));
            }
          }
        } else {
          // Modo Invitado: limpiar datos privados
          setFavorites([]);
          setReadingProgress({});
          setUserUsage((prev) => ({
            stories: 0,
            characters: 0,
            places: 0,
            objects: 0,
            notes: prev.notes,
            folders: prev.folders,
          }));

          if (typeof window !== 'undefined') {
            localStorage.setItem('rootshelf_favorites_data', JSON.stringify([]));
            localStorage.setItem('rootshelf_progress_data', JSON.stringify({}));
          }
        }

        await subscriptionPromise;
      } catch (err) {
        console.error('Error refreshing data from Supabase:', err);
      } finally {
        if (dataReqSeq === dataRequestSeqRef.current) {
          setDbLoading(false);
        }
      }
    },
    [refreshSubscription, hasLoadedSubscription]
  );

  // Helper para refrescar los conteos exactos de recursos propios
  const refreshUsageCounts = useCallback(async (activeUserId) => {
    if (!isSupabaseConfigured() || !supabase || !activeUserId || !isUUID(activeUserId)) {
      return;
    }
    try {
      const [stCount, chCount, plCount, obCount] = await Promise.all([
        supabase
          .from('stories')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', activeUserId),
        supabase
          .from('characters')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', activeUserId),
        supabase
          .from('places')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', activeUserId),
        supabase
          .from('objects')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', activeUserId),
      ]);

      if (activeUserIdRef.current !== activeUserId) return;

      setUserUsage((prev) => ({
        stories: !stCount.error && typeof stCount.count === 'number' ? stCount.count : prev.stories,
        characters:
          !chCount.error && typeof chCount.count === 'number' ? chCount.count : prev.characters,
        places: !plCount.error && typeof plCount.count === 'number' ? plCount.count : prev.places,
        objects: !obCount.error && typeof obCount.count === 'number' ? obCount.count : prev.objects,
        notes: prev.notes,
        folders: prev.folders,
      }));
    } catch (e) {
      console.warn('Notice refreshing usage counts:', e);
    }
  }, []);

  // Comprobar disponibilidad antes de crear un recurso
  const checkResourceLimit = useCallback(
    (resourceKey) => {
      if (!isAuthenticated || !currentUser?.id) {
        return {
          canCreate: false,
          currentUsage: 0,
          limit: 0,
          remaining: 0,
          isAtLimit: true,
          isNearLimit: false,
          planTier: null,
          subscriptionStatus: null,
          isPremium: false,
          isLoading: false,
          hasError: false,
          reason: 'unauthenticated',
        };
      }

      if (isLoadingSubscription && !hasLoadedSubscription) {
        return {
          canCreate: false,
          currentUsage: userUsage[resourceKey] ?? 0,
          limit: null,
          remaining: null,
          isAtLimit: false,
          isNearLimit: false,
          planTier: null,
          subscriptionStatus: null,
          isPremium: false,
          isLoading: true,
          hasError: false,
          reason: 'loading',
        };
      }

      if (subscriptionError) {
        return {
          canCreate: false,
          currentUsage: userUsage[resourceKey] ?? 0,
          limit: null,
          remaining: null,
          isAtLimit: false,
          isNearLimit: false,
          planTier: null,
          subscriptionStatus: null,
          isPremium: false,
          isLoading: false,
          hasError: true,
          reason: 'subscription_error',
        };
      }

      const rawLimit = planLimits?.[resourceKey];
      const hasLimit = typeof rawLimit === 'number';
      const limit = hasLimit ? rawLimit : null;
      const currentUsage = userUsage[resourceKey] ?? 0;
      const isAtLimit = hasLimit ? currentUsage >= limit : false;
      const isNearLimit = hasLimit && limit > 0 ? currentUsage >= Math.max(1, limit - 1) : false;
      const remaining = hasLimit ? Math.max(0, limit - currentUsage) : null;

      return {
        canCreate: hasLimit ? !isAtLimit : false,
        currentUsage,
        limit,
        remaining,
        isAtLimit,
        isNearLimit,
        planTier,
        subscriptionStatus,
        isPremium,
        isLoading: false,
        hasError: Boolean(limitsError),
        reason: !hasLimit ? 'limits_unavailable' : isAtLimit ? 'limit_reached' : 'ok',
      };
    },
    [
      isAuthenticated,
      currentUser,
      isLoadingSubscription,
      hasLoadedSubscription,
      subscriptionError,
      limitsError,
      planLimits,
      userUsage,
      planTier,
      subscriptionStatus,
      isPremium,
    ]
  );

  // Reintento manual de carga de suscripción
  const retrySubscription = useCallback(async () => {
    await refreshSubscription({
      userId: currentUser?.id || null,
      forceLoading: true,
    });
  }, [currentUser?.id, refreshSubscription]);

  // 2. Supabase Auth Session
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    let isSubscribed = true;
    let initialSyncStarted = false;

    async function handleUserSession(user) {
      if (!user || !isSubscribed) return;

      const userChanged = activeUserIdRef.current !== user.id;
      if (userChanged) {
        activeUserIdRef.current = user.id;
        setSubscription(null);
        setHasLoadedSubscription(false);
        setSubscriptionError(null);
        setIsLoadingSubscription(true);
      }

      try {
        // Fetch profile
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        const formatted = formatProfile(dbProfile, user);
        if (formatted && isSubscribed && activeUserIdRef.current === user.id) {
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
      if (!isSubscribed) return;
      if (session?.user) {
        if (!initialSyncStarted || activeUserIdRef.current !== session.user.id) {
          initialSyncStarted = true;
          handleUserSession(session.user);
        }
      } else if (!initialSyncStarted) {
        initialSyncStarted = true;
        activeUserIdRef.current = null;
        setIsLoadingSubscription(false);
        refreshFromSupabase(null);
      }
    });

    // Listen to Auth State Changes
    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isSubscribed) return;

      if (session?.user) {
        // Evitar doble disparo inicial si getSession() ya lo inició para el mismo usuario
        if (
          event === 'INITIAL_SESSION' &&
          initialSyncStarted &&
          activeUserIdRef.current === session.user.id
        ) {
          return;
        }
        initialSyncStarted = true;
        handleUserSession(session.user);
      } else if (event === 'SIGNED_OUT') {
        initialSyncStarted = true;
        activeUserIdRef.current = null;
        subRequestSeqRef.current++;
        setIsAuthenticated(false);
        setCurrentUser(null);
        setSubscription(null);
        setHasLoadedSubscription(false);
        setSubscriptionError(null);
        setIsLoadingSubscription(false);
        setIsRefreshingSubscription(false);
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
    });

    return () => {
      isSubscribed = false;
      authListener?.unsubscribe();
    };
  }, [refreshFromSupabase]);

  // 3. Revalidación automática de suscripción al volver a la pestaña / enfocar ventana
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const handleRevalidate = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      const now = Date.now();
      if (now - lastAutoRefreshRef.current < 4000) return;
      lastAutoRefreshRef.current = now;

      if (isAuthenticated && isUUID(currentUser?.id)) {
        refreshSubscription({ userId: currentUser.id, silent: true });
      } else {
        refreshSubscription({ userId: null, silent: true });
      }
    };

    window.addEventListener('focus', handleRevalidate);
    window.addEventListener('online', handleRevalidate);
    document.addEventListener('visibilitychange', handleRevalidate);

    return () => {
      window.removeEventListener('focus', handleRevalidate);
      window.removeEventListener('online', handleRevalidate);
      document.removeEventListener('visibilitychange', handleRevalidate);
    };
  }, [isAuthenticated, currentUser?.id, refreshSubscription]);

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
      const isCreatingNew = newStories.some((s) => !isUUID(s.id));
      if (isCreatingNew) {
        const check = checkResourceLimit('stories');
        if (!check.canCreate) {
          if (check.reason === 'limit_reached') {
            openPlanLimitModal('stories');
            return {
              success: false,
              limitReached: true,
              error: `Alcanzaste el límite de ${check.limit} historias de tu plan.`,
            };
          }
          return {
            success: false,
            limitReached: false,
            error: check.isLoading
              ? 'Verificando el estado de tu plan. Intentá de nuevo en un instante.'
              : 'No pudimos verificar los límites de tu plan.',
          };
        }
      }

      const previousStories = stories;
      setStories(newStories);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('rootshelf_stories_data', JSON.stringify(newStories));
        } catch (e) {}
      }

      if (isSupabaseConfigured() && supabase && isAuthenticated && isUUID(currentUser?.id)) {
        try {
          for (const s of newStories) {
            if (s.authorId === currentUser.id || s.author === currentUser.username || !s.authorId) {
              const dbStory = toDbStory(s, currentUser.id);

              if (isUUID(s.id)) {
                // Update existing story in Supabase (editing is never blocked by limits)
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

                if (insertErr) {
                  const isLimitError =
                    insertErr.code === 'P0001' ||
                    insertErr.message?.toLowerCase().includes('límite') ||
                    insertErr.message?.toLowerCase().includes('limit');

                  if (isLimitError) {
                    setStories(previousStories);
                    openPlanLimitModal('stories');
                    await refreshUsageCounts(currentUser.id);
                    return {
                      success: false,
                      limitReached: true,
                      error: 'Límite de historias alcanzado en la base de datos.',
                    };
                  }
                  return { success: false, error: insertErr.message };
                }

                if (createdStory?.id) {
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

          setStories([...newStories]);
          if (typeof window !== 'undefined') {
            localStorage.setItem('rootshelf_stories_data', JSON.stringify(newStories));
          }
          await refreshUsageCounts(currentUser.id);
          return { success: true };
        } catch (err) {
          console.warn('Error saving story to Supabase:', err);
          return { success: false, error: err.message };
        }
      }
      return { success: true };
    },
    [stories, isAuthenticated, currentUser, checkResourceLimit, openPlanLimitModal, refreshUsageCounts]
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
          if (currentUser?.id) {
            await refreshUsageCounts(currentUser.id);
          }
        } catch (e) {
          console.warn('Error deleting story in Supabase:', e);
        }
      }
    },
    [stories, currentUser, refreshUsageCounts]
  );

  // PRIMARY SUPABASE WRITES: Characters
  const saveCharacters = useCallback(
    async (newChars) => {
      const isCreatingNew = newChars.some((c) => !isUUID(c.id));
      if (isCreatingNew) {
        const check = checkResourceLimit('characters');
        if (!check.canCreate) {
          if (check.reason === 'limit_reached') {
            openPlanLimitModal('characters');
            return {
              success: false,
              limitReached: true,
              error: `Alcanzaste el límite de ${check.limit} personajes de tu plan.`,
            };
          }
          return {
            success: false,
            limitReached: false,
            error: check.isLoading
              ? 'Verificando el estado de tu plan. Intentá de nuevo en un instante.'
              : 'No pudimos verificar los límites de tu plan.',
          };
        }
      }

      const previousChars = characters;
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
              const { data: created, error: insertErr } = await supabase
                .from('characters')
                .insert(dbChar)
                .select()
                .single();

              if (insertErr) {
                const isLimitError =
                  insertErr.code === 'P0001' ||
                  insertErr.message?.toLowerCase().includes('límite') ||
                  insertErr.message?.toLowerCase().includes('limit');

                if (isLimitError) {
                  setCharacters(previousChars);
                  openPlanLimitModal('characters');
                  await refreshUsageCounts(currentUser.id);
                  return {
                    success: false,
                    limitReached: true,
                    error: 'Límite de personajes alcanzado en la base de datos.',
                  };
                }
                return { success: false, error: insertErr.message };
              }

              if (created?.id) c.id = created.id;
            }
          }
          setCharacters([...newChars]);
          if (typeof window !== 'undefined') {
            localStorage.setItem('rootshelf_characters_data', JSON.stringify(newChars));
          }
          await refreshUsageCounts(currentUser.id);
          return { success: true };
        } catch (err) {
          console.warn('Error saving character to Supabase:', err);
          return { success: false, error: err.message };
        }
      }
      return { success: true };
    },
    [characters, isAuthenticated, currentUser, checkResourceLimit, openPlanLimitModal, refreshUsageCounts]
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
          if (currentUser?.id) {
            await refreshUsageCounts(currentUser.id);
          }
        } catch (e) {
          console.warn('Error deleting character in Supabase:', e);
        }
      }
    },
    [characters, currentUser, refreshUsageCounts]
  );

  // PRIMARY SUPABASE WRITES: Places
  const savePlaces = useCallback(
    async (newPlaces) => {
      const isCreatingNew = newPlaces.some((p) => !isUUID(p.id));
      if (isCreatingNew) {
        const check = checkResourceLimit('places');
        if (!check.canCreate) {
          if (check.reason === 'limit_reached') {
            openPlanLimitModal('places');
            return {
              success: false,
              limitReached: true,
              error: `Alcanzaste el límite de ${check.limit} lugares de tu plan.`,
            };
          }
          return {
            success: false,
            limitReached: false,
            error: check.isLoading
              ? 'Verificando el estado de tu plan. Intentá de nuevo en un instante.'
              : 'No pudimos verificar los límites de tu plan.',
          };
        }
      }

      const previousPlaces = places;
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
              const { data: created, error: insertErr } = await supabase
                .from('places')
                .insert(dbPlace)
                .select()
                .single();

              if (insertErr) {
                const isLimitError =
                  insertErr.code === 'P0001' ||
                  insertErr.message?.toLowerCase().includes('límite') ||
                  insertErr.message?.toLowerCase().includes('limit');

                if (isLimitError) {
                  setPlaces(previousPlaces);
                  openPlanLimitModal('places');
                  await refreshUsageCounts(currentUser.id);
                  return {
                    success: false,
                    limitReached: true,
                    error: 'Límite de lugares alcanzado en la base de datos.',
                  };
                }
                return { success: false, error: insertErr.message };
              }

              if (created?.id) p.id = created.id;
            }
          }
          setPlaces([...newPlaces]);
          if (typeof window !== 'undefined') {
            localStorage.setItem('rootshelf_places_data', JSON.stringify(newPlaces));
          }
          await refreshUsageCounts(currentUser.id);
          return { success: true };
        } catch (err) {
          console.warn('Error saving place to Supabase:', err);
          return { success: false, error: err.message };
        }
      }
      return { success: true };
    },
    [places, isAuthenticated, currentUser, checkResourceLimit, openPlanLimitModal, refreshUsageCounts]
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
          if (currentUser?.id) {
            await refreshUsageCounts(currentUser.id);
          }
        } catch (e) {
          console.warn('Error deleting place in Supabase:', e);
        }
      }
    },
    [places, currentUser, refreshUsageCounts]
  );

  // PRIMARY SUPABASE WRITES: Objects
  const saveObjects = useCallback(
    async (newObjects) => {
      const isCreatingNew = newObjects.some((o) => !isUUID(o.id));
      if (isCreatingNew) {
        const check = checkResourceLimit('objects');
        if (!check.canCreate) {
          if (check.reason === 'limit_reached') {
            openPlanLimitModal('objects');
            return {
              success: false,
              limitReached: true,
              error: `Alcanzaste el límite de ${check.limit} objetos de tu plan.`,
            };
          }
          return {
            success: false,
            limitReached: false,
            error: check.isLoading
              ? 'Verificando el estado de tu plan. Intentá de nuevo en un instante.'
              : 'No pudimos verificar los límites de tu plan.',
          };
        }
      }

      const previousObjects = objects;
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
              const { data: created, error: insertErr } = await supabase
                .from('objects')
                .insert(dbObj)
                .select()
                .single();

              if (insertErr) {
                const isLimitError =
                  insertErr.code === 'P0001' ||
                  insertErr.message?.toLowerCase().includes('límite') ||
                  insertErr.message?.toLowerCase().includes('limit');

                if (isLimitError) {
                  setObjects(previousObjects);
                  openPlanLimitModal('objects');
                  await refreshUsageCounts(currentUser.id);
                  return {
                    success: false,
                    limitReached: true,
                    error: 'Límite de objetos alcanzado en la base de datos.',
                  };
                }
                return { success: false, error: insertErr.message };
              }

              if (created?.id) o.id = created.id;
            }
          }
          setObjects([...newObjects]);
          if (typeof window !== 'undefined') {
            localStorage.setItem('rootshelf_objects_data', JSON.stringify(newObjects));
          }
          await refreshUsageCounts(currentUser.id);
          return { success: true };
        } catch (err) {
          console.warn('Error saving object to Supabase:', err);
          return { success: false, error: err.message };
        }
      }
      return { success: true };
    },
    [objects, isAuthenticated, currentUser, checkResourceLimit, openPlanLimitModal, refreshUsageCounts]
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
          if (currentUser?.id) {
            await refreshUsageCounts(currentUser.id);
          }
        } catch (e) {
          console.warn('Error deleting object in Supabase:', e);
        }
      }
    },
    [objects, currentUser, refreshUsageCounts]
  );

  // Save Notes (Workspace scratchpad)
  const saveNotes = useCallback((newNotes) => {
    setNotes(newNotes);
    setUserUsage((prev) => ({
      ...prev,
      notes: Array.isArray(newNotes) ? newNotes.length : 0,
    }));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rootshelf_notes_data', JSON.stringify(newNotes));
      } catch (e) {}
    }
  }, []);

  // Save Folders (Local workspace organization)
  const saveFolders = useCallback((newFolders) => {
    setFolders(newFolders);
    setUserUsage((prev) => ({
      ...prev,
      folders: Array.isArray(newFolders)
        ? Math.max(0, newFolders.length - initialFolders.length)
        : 0,
    }));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rootshelf_folders_data', JSON.stringify(newFolders));
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
          activeUserIdRef.current = data.user.id;
          setSubscription(null);
          setHasLoadedSubscription(false);
          setSubscriptionError(null);
          setIsLoadingSubscription(true);

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
            activeUserIdRef.current = data.user.id;
            setSubscription(null);
            setHasLoadedSubscription(false);
            setSubscriptionError(null);
            setIsLoadingSubscription(true);

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
    activeUserIdRef.current = null;
    subRequestSeqRef.current++;
    dataRequestSeqRef.current++;

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Error signing out of Supabase:', err);
      }
    }

    setIsAuthenticated(false);
    setCurrentUser(null);
    setSubscription(null);
    setHasLoadedSubscription(false);
    setSubscriptionError(null);
    setIsLoadingSubscription(false);
    setIsRefreshingSubscription(false);
    setUserUsage({
      stories: 0,
      characters: 0,
      places: 0,
      objects: 0,
      notes: 0,
      folders: 0,
    });
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

  // Mercado Pago: Start Premium Monthly Checkout ($3.500 ARS/mes)
  const startPremiumCheckout = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        success: false,
        error: 'El servicio de suscripciones requiere conexión con Supabase.',
      };
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return {
          success: false,
          requiresAuth: true,
          error: 'Iniciá sesión para contratar RootShelf Premium.',
        };
      }

      const res = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          error: data?.error || 'No se pudo iniciar el proceso de pago en Mercado Pago.',
        };
      }

      return {
        success: true,
        initPoint: data.init_point,
        preapprovalId: data.preapproval_id,
        status: data.status,
        environment: data.environment,
      };
    } catch (err) {
      return {
        success: false,
        error: err?.message || 'Error de red al iniciar el checkout de Mercado Pago.',
      };
    }
  }, []);

  // Mercado Pago: Verify subscription directly against MP API via server route
  const verifyMercadoPagoSubscription = useCallback(
    async ({ preapprovalId = null } = {}) => {
      if (!isSupabaseConfigured() || !supabase) {
        return {
          success: false,
          error: 'Servicio de verificación no disponible.',
        };
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          return {
            success: false,
            requiresAuth: true,
            error: 'Iniciá sesión para verificar tu suscripción.',
          };
        }

        const res = await fetch('/api/subscriptions/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(preapprovalId ? { preapprovalId } : {}),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return {
            success: false,
            error: data?.error || 'No se pudo verificar la suscripción con Mercado Pago.',
          };
        }

        if (data?.subscription) {
          setSubscription(data.subscription);
          setHasLoadedSubscription(true);
          setSubscriptionError(null);
          await refreshSubscription({
            userId: session.user?.id || currentUser?.id,
            silent: true,
          });
        }

        return {
          success: true,
          verified: Boolean(data?.verified),
          hasMercadoPagoSubscription: Boolean(data?.hasMercadoPagoSubscription),
          pendingVerification: Boolean(data?.pendingVerification),
          isActivePremium: Boolean(data?.isActivePremium),
          mpStatus: data?.mpStatus || null,
          subscription: data?.subscription || null,
        };
      } catch (err) {
        return {
          success: false,
          error: err?.message || 'Error de red al verificar la suscripción.',
        };
      }
    },
    [currentUser?.id, refreshSubscription]
  );

  // Mercado Pago: Cancel active subscription cleanly without deleting user content
  const cancelMercadoPagoSubscription = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        success: false,
        error: 'Servicio de cancelación no disponible.',
      };
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return {
          success: false,
          requiresAuth: true,
          error: 'Iniciá sesión para cancelar tu suscripción.',
        };
      }

      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          error: data?.error || 'No se pudo cancelar tu suscripción en Mercado Pago.',
        };
      }

      if (data?.subscription) {
        setSubscription(data.subscription);
        setHasLoadedSubscription(true);
        setSubscriptionError(null);
        await refreshSubscription({
          userId: session.user?.id || currentUser?.id,
          silent: true,
        });
      }

      return {
        success: true,
        mpStatus: data?.mpStatus || 'cancelled',
        subscription: data?.subscription || null,
      };
    } catch (err) {
      return {
        success: false,
        error: err?.message || 'Error de red al cancelar la suscripción.',
      };
    }
  }, [currentUser?.id, refreshSubscription]);

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
        deleteObject,
        saveObjects,
        deletePlace,
        saveNotes,
        saveFolders,
        refreshFromSupabase,
        resetPassword,
        // Freemium Subscription & Limits (Unified Single Source of Truth)
        subscription,
        planTier,
        subscriptionStatus,
        isPremium,
        planLimits,
        allPlanLimits,
        isLoadingSubscription,
        isRefreshingSubscription,
        subscriptionLoading: isLoadingSubscription,
        subscriptionError,
        limitsLoading,
        limitsError,
        refreshSubscription,
        retrySubscription,
        userUsage,
        planLimitModal,
        openPlanLimitModal,
        closePlanLimitModal,
        checkResourceLimit,
        refreshUsageCounts,
        // Mercado Pago Subscriptions API
        startPremiumCheckout,
        verifyMercadoPagoSubscription,
        cancelMercadoPagoSubscription,
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
