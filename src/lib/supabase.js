import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

/**
 * Checks whether valid Supabase configuration is present.
 */
export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your-anon-key')
  );
};

/**
 * Singleton Supabase client instance (client-side safe, uses public publishable key).
 */
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Helper to check if a string is a standard UUID.
 */
export const isUUID = (str) =>
  typeof str === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

/**
 * Safe JSON parser helper.
 */
function safeParseJson(str, fallback = null) {
  if (!str || typeof str !== 'string') return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Format database profile record into RootShelf user model.
 * Table `profiles`: id, username, display_name, avatar_url, bio, status, created_at, updated_at
 */
export function formatProfile(dbProfile, authUser = null) {
  if (!dbProfile && !authUser) return null;
  const userMetadata = authUser?.user_metadata || {};

  const displayName = dbProfile?.display_name || userMetadata.full_name || '';
  const nameParts = displayName ? displayName.split(' ') : [];
  const firstName =
    userMetadata.first_name || (nameParts.length > 0 ? nameParts[0] : '');
  const lastName =
    userMetadata.last_name ||
    (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

  return {
    id: dbProfile?.id || authUser?.id || '',
    username:
      dbProfile?.username ||
      userMetadata.username ||
      authUser?.email?.split('@')[0] ||
      'Usuario',
    email: authUser?.email || dbProfile?.email || '',
    firstName,
    lastName,
    displayName: displayName || dbProfile?.username || 'Usuario',
    avatar: dbProfile?.avatar_url || userMetadata.avatar_url || '',
    bio:
      dbProfile?.bio ||
      userMetadata.bio ||
      'Lector y creador de historias en RootShelf.',
    status: dbProfile?.status || userMetadata.status || 'Disponible',
    createdAt: dbProfile?.created_at || authUser?.created_at || null,
  };
}

/**
 * Convert RootShelf user model to Supabase `profiles` row payload.
 */
export function toDbProfile(user) {
  if (!user) return null;
  const displayName =
    user.displayName ||
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.username ||
    '';

  const payload = {
    username: user.username || 'Usuario',
    display_name: displayName,
    avatar_url: user.avatar || '',
    bio: user.bio || 'Lector y creador de historias en RootShelf.',
    status: user.status || 'Disponible',
    updated_at: new Date().toISOString(),
  };

  if (isUUID(user.id)) {
    payload.id = user.id;
  }

  return payload;
}

/**
 * Format story from Supabase schema to RootShelf frontend schema.
 * Table `stories`: id, author_id, title, synopsis, genre, status, tags, cover_url, created_at, updated_at
 */
export function formatStory(story, chapters = [], authorProfile = null) {
  if (!story) return null;

  // Extract tags and encoded metadata (classification, language)
  const rawTags = Array.isArray(story.tags)
    ? story.tags
    : typeof story.tags === 'string'
    ? story.tags.split(' ').filter(Boolean)
    : [];

  const visibleHashtags = [];
  let classification = 'Todo público';
  let language = 'Español';
  let linkedCharacters = [];
  let linkedLocations = [];

  for (const tag of rawTags) {
    if (tag.startsWith('__class:')) {
      classification = decodeURIComponent(tag.slice(8));
    } else if (tag.startsWith('__lang:')) {
      language = decodeURIComponent(tag.slice(7));
    } else if (tag.startsWith('__chars:')) {
      const parsed = safeParseJson(decodeURIComponent(tag.slice(8)), []);
      if (Array.isArray(parsed)) linkedCharacters = parsed;
    } else if (tag.startsWith('__locs:')) {
      const parsed = safeParseJson(decodeURIComponent(tag.slice(7)), []);
      if (Array.isArray(parsed)) linkedLocations = parsed;
    } else {
      visibleHashtags.push(tag);
    }
  }

  const isDraft = story.status === 'draft';
  const authorName =
    authorProfile?.username ||
    story.profiles?.username ||
    story.author_username ||
    story.author ||
    'Autor RootShelf';

  const formattedChapters = Array.isArray(chapters) && chapters.length > 0
    ? chapters.map(formatChapter)
    : Array.isArray(story.chapters)
    ? story.chapters.map(formatChapter)
    : [];

  return {
    id: String(story.id),
    authorId: String(story.author_id || story.authorId || ''),
    author: authorName,
    title: story.title || 'Historia sin título',
    genre: story.genre || 'Ficción general',
    description: story.synopsis || story.description || '',
    hashtags: visibleHashtags,
    classification,
    language,
    coverUrl: story.cover_url || story.coverUrl || '',
    isRead: Boolean(story.is_read ?? story.isRead),
    isDraft,
    isOwner: false,
    characters: linkedCharacters,
    locations: linkedLocations,
    chapters: formattedChapters,
    createdAt: story.created_at || null,
    updatedAt: story.updated_at || null,
  };
}

/**
 * Convert RootShelf story model to Supabase `stories` row payload.
 */
export function toDbStory(story, authorId) {
  if (!story) return null;

  // Encode non-column fields safely in `tags` array so NO information is lost
  const tagsArray = Array.isArray(story.hashtags)
    ? [...story.hashtags]
    : typeof story.hashtags === 'string'
    ? story.hashtags.split(' ').filter(Boolean)
    : [];

  if (story.classification) {
    tagsArray.push(`__class:${encodeURIComponent(story.classification)}`);
  }
  if (story.language) {
    tagsArray.push(`__lang:${encodeURIComponent(story.language)}`);
  }
  if (Array.isArray(story.characters) && story.characters.length > 0) {
    tagsArray.push(`__chars:${encodeURIComponent(JSON.stringify(story.characters))}`);
  }
  if (Array.isArray(story.locations) && story.locations.length > 0) {
    tagsArray.push(`__locs:${encodeURIComponent(JSON.stringify(story.locations))}`);
  }

  const payload = {
    title: story.title || 'Historia sin título',
    synopsis: story.description || '',
    genre: story.genre || 'Ficción general',
    status: story.isDraft ? 'draft' : 'published',
    tags: tagsArray,
    cover_url: story.coverUrl || '',
    updated_at: new Date().toISOString(),
  };

  const finalAuthorId = authorId || story.authorId;
  if (isUUID(finalAuthorId)) {
    payload.author_id = finalAuthorId;
  }

  if (isUUID(story.id)) {
    payload.id = story.id;
  }

  return payload;
}

/**
 * Format chapter to RootShelf frontend schema.
 * Table `chapters`: id, story_id, chapter_number, title, content, created_at, updated_at
 */
export function formatChapter(ch, index = 0) {
  if (!ch) return null;
  const num = ch.chapter_number !== undefined
    ? ch.chapter_number
    : ch.number !== undefined
    ? ch.number
    : index + 1;

  return {
    id: String(ch.id),
    storyId: String(ch.story_id || ch.storyId || ''),
    number: num,
    title: ch.title || `Capítulo ${num}`,
    content: ch.content || '',
    createdAt: ch.created_at || null,
    updatedAt: ch.updated_at || null,
  };
}

/**
 * Convert RootShelf chapter model to Supabase `chapters` row payload.
 */
export function toDbChapter(ch, storyId, index = 0) {
  if (!ch) return null;
  const chapterNumber =
    ch.number !== undefined
      ? Number(ch.number)
      : ch.chapter_number !== undefined
      ? Number(ch.chapter_number)
      : index + 1;

  const payload = {
    title: ch.title || `Capítulo ${chapterNumber}`,
    content: ch.content || '',
    chapter_number: chapterNumber,
    updated_at: new Date().toISOString(),
  };

  if (isUUID(storyId)) {
    payload.story_id = storyId;
  }
  if (isUUID(ch.id)) {
    payload.id = ch.id;
  }

  return payload;
}

/**
 * Format character to RootShelf frontend schema.
 * Table `characters`: id, author_id, story_id, name, role, description, personality, appearance, backstory, image_url, created_at, updated_at
 */
export function formatCharacter(char) {
  if (!char) return null;

  // Unpack extra fields preserved in backstory JSON
  const parsedBackstory = safeParseJson(char.backstory, null);
  const extra = parsedBackstory && typeof parsedBackstory === 'object' ? parsedBackstory : {};

  const fullName = char.name || '';
  const nameParts = fullName.trim().split(' ');
  const firstName = extra.firstName || char.firstName || (nameParts.length > 0 ? nameParts[0] : '');
  const lastName =
    extra.lastName ||
    char.lastName ||
    (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

  return {
    id: String(char.id),
    authorId: String(char.author_id || char.authorId || char.user_id || ''),
    storyId: char.story_id ? String(char.story_id) : '',
    firstName,
    lastName,
    age: extra.age !== undefined ? String(extra.age) : char.age ? String(char.age) : '',
    gender: extra.gender || char.gender || 'Hombre',
    roleInStory: char.role || char.role_in_story || char.roleInStory || 'Protagonista',
    description: char.description || '',
    personality: char.personality || '',
    appearance: char.appearance || '',
    birthDay: extra.birthDay || char.birthDay || '',
    birthMonth: extra.birthMonth || char.birthMonth || '',
    birthYear: extra.birthYear || char.birthYear || '',
    relationships: extra.relationships || char.relationships || {},
    folderId: extra.folderId || char.folder_id || char.folderId || 'f-1',
    imageUrl: char.image_url || char.imageUrl || '',
    createdAt: char.created_at || null,
    updatedAt: char.updated_at || null,
  };
}

/**
 * Convert RootShelf character model to Supabase `characters` row payload.
 */
export function toDbCharacter(char, authorId) {
  if (!char) return null;

  const fullName = [char.firstName, char.lastName].filter(Boolean).join(' ').trim() || 'Personaje sin nombre';

  // Pack all extended fields into backstory JSON so no form fields are discarded
  const extra = {
    firstName: char.firstName || '',
    lastName: char.lastName || '',
    age: char.age || '',
    gender: char.gender || 'Hombre',
    birthDay: char.birthDay || '',
    birthMonth: char.birthMonth || '',
    birthYear: char.birthYear || '',
    relationships: char.relationships || {},
    folderId: char.folderId || 'f-1',
  };

  const payload = {
    name: fullName,
    role: char.roleInStory || char.role || 'Protagonista',
    description: char.description || '',
    personality: char.personality || '',
    appearance: char.appearance || '',
    backstory: JSON.stringify(extra),
    image_url: char.imageUrl || '',
    updated_at: new Date().toISOString(),
  };

  const finalAuthorId = authorId || char.authorId || char.userId;
  if (isUUID(finalAuthorId)) {
    payload.author_id = finalAuthorId;
  }
  if (isUUID(char.storyId)) {
    payload.story_id = char.storyId;
  }
  if (isUUID(char.id)) {
    payload.id = char.id;
  }

  return payload;
}

/**
 * Format place to RootShelf frontend schema.
 * Table `places`: id, author_id, story_id, name, place_type, description, image_url, created_at, updated_at
 */
export function formatPlace(place) {
  if (!place) return null;

  const parsedType = safeParseJson(place.place_type, null);
  const location =
    parsedType && typeof parsedType === 'object' && parsedType.location !== undefined
      ? parsedType.location
      : place.place_type || place.location || '';
  const folderId =
    parsedType && typeof parsedType === 'object' && parsedType.folderId
      ? parsedType.folderId
      : place.folder_id || place.folderId || 'fp-1';

  return {
    id: String(place.id),
    authorId: String(place.author_id || place.authorId || place.user_id || ''),
    storyId: place.story_id ? String(place.story_id) : '',
    name: place.name || 'Lugar sin nombre',
    location,
    description: place.description || '',
    folderId,
    imageUrl: place.image_url || place.imageUrl || '',
    createdAt: place.created_at || null,
    updatedAt: place.updated_at || null,
  };
}

/**
 * Convert RootShelf place model to Supabase `places` row payload.
 */
export function toDbPlace(place, authorId) {
  if (!place) return null;

  const extraType = {
    location: place.location || '',
    folderId: place.folderId || 'fp-1',
  };

  const payload = {
    name: place.name || 'Lugar sin nombre',
    place_type: JSON.stringify(extraType),
    description: place.description || '',
    image_url: place.imageUrl || '',
    updated_at: new Date().toISOString(),
  };

  const finalAuthorId = authorId || place.authorId || place.userId;
  if (isUUID(finalAuthorId)) {
    payload.author_id = finalAuthorId;
  }
  if (isUUID(place.storyId)) {
    payload.story_id = place.storyId;
  }
  if (isUUID(place.id)) {
    payload.id = place.id;
  }

  return payload;
}

/**
 * Format object to RootShelf frontend schema.
 * Table `objects`: id, author_id, story_id, name, category, description, properties, image_url, created_at, updated_at
 */
export function formatObject(obj) {
  if (!obj) return null;

  const parsedProps = safeParseJson(obj.properties, null);
  const location =
    parsedProps && typeof parsedProps === 'object' && parsedProps.location !== undefined
      ? parsedProps.location
      : obj.location || '';
  const folderId =
    parsedProps && typeof parsedProps === 'object' && parsedProps.folderId
      ? parsedProps.folderId
      : obj.folder_id || obj.folderId || 'fo-1';

  return {
    id: String(obj.id),
    authorId: String(obj.author_id || obj.authorId || obj.user_id || ''),
    storyId: obj.story_id ? String(obj.story_id) : '',
    name: obj.name || 'Objeto sin nombre',
    category: obj.category || 'General',
    location,
    description: obj.description || '',
    folderId,
    imageUrl: obj.image_url || obj.imageUrl || '',
    createdAt: obj.created_at || null,
    updatedAt: obj.updated_at || null,
  };
}

/**
 * Convert RootShelf object model to Supabase `objects` row payload.
 */
export function toDbObject(obj, authorId) {
  if (!obj) return null;

  const extraProps = {
    location: obj.location || '',
    folderId: obj.folderId || 'fo-1',
  };

  const payload = {
    name: obj.name || 'Objeto sin nombre',
    category: obj.category || 'General',
    description: obj.description || '',
    properties: JSON.stringify(extraProps),
    image_url: obj.imageUrl || '',
    updated_at: new Date().toISOString(),
  };

  const finalAuthorId = authorId || obj.authorId || obj.userId;
  if (isUUID(finalAuthorId)) {
    payload.author_id = finalAuthorId;
  }
  if (isUUID(obj.storyId)) {
    payload.story_id = obj.storyId;
  }
  if (isUUID(obj.id)) {
    payload.id = obj.id;
  }

  return payload;
}
