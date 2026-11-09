# Plan y Ejecución de Migración a Supabase (Etapa 2) - RootShelf

Este documento registra la finalización de la **Etapa 2**, en la cual **Supabase se establece como la fuente principal y persistente de datos** para RootShelf, manteniendo `localStorage` como copia de seguridad sin pérdida de información.

---

## 1. Conexión Real y Verificación del Esquema
A partir de las credenciales configuradas en `.env.local` y `.env.example`:
- **URL:** `https://eatfktsozlgbezpxxpus.supabase.co`
- **Publishable Key:** `sb_publishable_B_ID07if8iUPEfKvOj0WFA_6cBnnylD`

Se verificaron las 8 tablas existentes y sus columnas exactas en la base de datos de PostgreSQL/Supabase:
1. `profiles`: `id`, `username`, `display_name`, `avatar_url`, `bio`, `status`, `created_at`, `updated_at`.
2. `stories`: `id`, `author_id`, `title`, `synopsis`, `genre`, `status`, `tags` (array `text[]`), `cover_url`, `created_at`, `updated_at`.
3. `chapters`: `id`, `story_id`, `chapter_number`, `title`, `content`, `created_at`, `updated_at`.
4. `characters`: `id`, `author_id`, `story_id`, `name`, `role`, `description`, `personality`, `appearance`, `backstory`, `image_url`, `created_at`, `updated_at`.
5. `places`: `id`, `author_id`, `story_id`, `name`, `place_type`, `description`, `image_url`, `created_at`, `updated_at`.
6. `objects`: `id`, `author_id`, `story_id`, `name`, `category`, `description`, `properties`, `image_url`, `created_at`, `updated_at`.
7. `favorites`: `id`, `user_id`, `story_id`, `created_at`.
8. `reading_progress`: `id`, `user_id`, `story_id`, `chapter_id`, `last_read_at`, `created_at`, `updated_at`.

---

## 2. Estrategia de Preservación Total de Datos (Zero-Data-Loss)
Para aquellos campos de formulario sin columna directa en Supabase, se implementó una codificación y deserialización transparente:
- **Historias:**
  - `description` mapea a `synopsis`.
  - `isDraft` mapea a `status` (`'draft'` o `'published'`).
  - `classification`, `language`, `characters` y `locations` vinculadas se almacenan dentro del array `tags` de PostgreSQL (ej. `__class:Todo público`, `__lang:Español`, `__chars:...`). Al leer la historia, se recuperan intactos en el modelo de RootShelf.
- **Capítulos:**
  - `number` mapea a `chapter_number`.
  - `content` y `title` mapean de forma directa.
- **Personajes:**
  - `firstName` y `lastName` mapean a `name`.
  - Los campos extendidos (`age`, `gender`, `birthDay`, `birthMonth`, `birthYear`, `relationships`/`parents`, `folderId`) se empaquetan en `backstory` en formato JSON y se reconstituyen al leer la entidad.
- **Lugares:**
  - `location` y `folderId` se preservan en `place_type`.
- **Objetos:**
  - `category` mapea a `category`.
  - `location` y `folderId` se preservan en `properties`.

---

## 3. Módulo de Migración Inteligente (`/src/lib/migration.js`)
- **Deduplicación:** Antes de insertar cualquier historia, personaje, lugar u objeto, consulta los registros existentes del autor en Supabase para evitar duplicados.
- **Asociación de Usuario:** Vincula todos los registros creados con el UUID de Supabase Auth del usuario activo (`author_id` / `user_id`).
- **Marca de Migración:** Al completarse, guarda `rootshelf_migrated_${userId}` en `localStorage` con el resumen de registros transferidos para no repetir la importación en cada sesión.
- **Respaldo:** No se elimina ninguna clave previa de `localStorage`; los datos locales se conservan como copia de seguridad.

---

## 4. Reemplazo de Operaciones en el Contexto (`RootShelfContext.jsx`)
- **Lecturas:** `refreshFromSupabase` consulta directamente Supabase como fuente primaria. Si el usuario navega como invitado, carga el catálogo público.
- **Escrituras:** `saveStories`, `deleteStory`, `saveCharacters`, `deleteCharacter`, `savePlaces`, `deletePlace`, `saveObjects`, `deleteObject`, `toggleFavorite` y `updateReadingProgress` operan de forma asíncrona sobre Supabase.
- **Componentes Actualizados:** `StoryForm.jsx`, `ChapterEditor.jsx`, `CharacterForm.jsx`, `PlaceForm.jsx`, `ObjectForm.jsx` y `Profile` ahora esperan (`await`) las operaciones asíncronas de guardado y actualizan el estado sin bloqueos.
- **Control de Sincronización:** En la pantalla `/profile`, el usuario dispone de un botón *"Sincronizar datos"* con retroalimentación visual inmediata.
