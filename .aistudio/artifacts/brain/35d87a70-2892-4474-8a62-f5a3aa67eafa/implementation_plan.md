# Plan de Migración a Next.js (App Router), JavaScript y Tailwind CSS - RootShelf

Este documento define la arquitectura técnica y los pasos de ejecución para la migración de **RootShelf** desde la estructura previa de Vite/TypeScript a **Next.js (App Router)**, **JavaScript (.js / .jsx)** y **Tailwind CSS v4**, preservando todas las pantallas, funcionalidades, datos existentes y la identidad visual de la plataforma.

---

## 1. Ajustes y Aclaraciones Fundamentales

### 1.1 Cierre de Sesión y Navegación Inicial
- **Ruta inicial:** La pantalla inicial al acceder a RootShelf es la **página principal (`/`) en modo visitante (invitado)**.
- **Cierre de sesión:** Al pulsar "Cerrar sesión" en el menú o perfil, `rootshelf_session_active` se establece en `'false'` y el usuario es redirigido inmediatamente a la **página principal (`/`) en modo invitado**, sin redirigir a `/register`.

### 1.2 Propiedad Confiable de las Historias
- La autorización para editar historias se basa en un **identificador único de usuario (`userId` / `authorId`)**:
  - Cada usuario tiene un `id` único (ej. `user_martin_01` para el autor por defecto o `user_<timestamp>` para nuevos registros).
  - Cada historia almacena `authorId`.
  - La comprobación `isStoryOwner(story)` valida rigurosamente:
    ```javascript
    Boolean(isAuthenticated && story && currentUserId && story.authorId === currentUserId)
    ```
  - Si un usuario navega en modo visitante o su `currentUserId` no coincide con el `story.authorId`, el botón **"Editar detalles de la historia"** no se muestra y el acceso a `/stories/[id]/edit` es bloqueado.

### 1.3 Autenticación: Diferenciación entre Registro e Inicio de Sesión
- Se implementan dos flujos claros e independientes en `/register`:
  - **Iniciar sesión:** Permite a usuarios existentes autenticarse con su nombre de usuario/correo y contraseña, verificando las credenciales almacenadas o las de sesión predeterminada.
  - **Registro de nuevo usuario:** Flujo en 2 pasos:
    - **Paso 1:** Nombre, Apellido, Fecha de nacimiento (Día, Mes, Año), E-Mail.
    - **Paso 2:** Nombre de usuario, Contraseña.
    Crea el nuevo registro con un `userId` único y activa la sesión.
  - Ambas opciones permiten alternar fácilmente mediante enlaces directos (*"¿No tenés cuenta? Registrate"* y *"¿Ya tenés cuenta? Iniciá sesión"*).

### 1.4 Diseño Rectilíneo y Excepción para Avatares Circulares
- La identidad rectilínea (`border-radius: 0px`) se mantiene en todos los botones, tarjetas, contenedores, inputs y modales.
- Para no romper avatares u otros elementos que requieran explícitamente ser circulares, se aplica la excepción:
  ```css
  *, *::before, *::after {
    border-radius: 0px !important;
  }
  .rounded-full, .rounded-full *, .avatar-circle, .avatar-circle * {
    border-radius: 9999px !important;
  }
  ```

### 1.5 Configuración Técnica de Tailwind CSS v4 y ESLint
- **Tailwind CSS v4 en Next.js:** Integrado mediante `@tailwindcss/postcss` en `postcss.config.mjs` y `@import "tailwindcss";` en `app/globals.css`.
- **ESLint:** Configuración con `eslint-config-next` (`next/core-web-vitals`), habilitando el script `"lint": "next lint"`.

### 1.6 Preservación Retrocompatible de Datos en `localStorage`
- Ningún dato previo será borrado ni reinicializado. Se conservan y respetan las claves existentes:
  - `rootshelf_session_active`
  - `rootshelf_user_id`
  - `rootshelf_username`
  - `rootshelf_userbio`
  - `rootshelf_userstatus`
  - `rootshelf_useravatar`
  - `rootshelf_user_profile`
  - `rootshelf_stories_data`
  - `rootshelf_characters_data`
  - `rootshelf_places_data`
  - `rootshelf_objects_data`
- Si ya existen historias u objetos guardados por el usuario, se cargan fielmente; los datos iniciales de `mockData.js` actúan únicamente como respaldo si el almacenamiento está vacío.

---

## 2. Arquitectura de Next.js App Router

```
app/
├── globals.css                # Tokens (#134038, #A3195B, #F9B233, etc.) y reglas rectilíneas
├── layout.jsx                 # Layout raíz con Google Fonts (Outfit), Header y RootShelfProvider
├── page.jsx                   # '/' Catálogo principal y destacados (modo invitado por defecto)
├── register/
│   └── page.jsx               # '/register' Flujos de Iniciar sesión y Registro en 2 pasos
├── profile/
│   └── page.jsx               # '/profile' Lecturas, historias propias y taller literario
├── reader/
│   └── [id]/
│       └── page.jsx           # '/reader/[id]' Lector de capítulos con validación de autor
├── stories/
│   ├── create/
│   │   └── page.jsx           # '/stories/create' Creación de historias (requiere auth)
│   └── [id]/
│       └── edit/
│           └── page.jsx       # '/stories/[id]/edit' Edición restringida al authorId
├── characters/
│   ├── page.jsx               # '/characters' Lista de personajes
│   ├── create/
│   │   └── page.jsx           # '/characters/create' Crear personaje
│   └── [id]/
│       └── edit/
│           └── page.jsx       # '/characters/[id]/edit' Editar personaje
├── places/
│   ├── page.jsx               # '/places' Lista de lugares
│   ├── create/
│   │   └── page.jsx           # '/places/create' Crear lugar
│   └── [id]/
│       └── edit/
│           └── page.jsx       # '/places/[id]/edit' Editar lugar
└── objects/
    ├── page.jsx               # '/objects' Lista de objetos
    ├── create/
    │   └── page.jsx           # '/objects/create' Crear objeto
    └── [id]/
        └── edit/
            └── page.jsx       # '/objects/[id]/edit' Editar objeto
```

---

## 3. Plan de Limpieza de Dependencias

- **Eliminar de `package.json`:**
  - `@google/genai` (no utilizado en el código de RootShelf).
  - `express` y `@types/express` (obsoletos con Next.js).
  - `dotenv` (gestionado nativamente por Next.js).
  - `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite` (sustituidos por Next.js y PostCSS).
  - `typescript`, `tsx`, `@types/node`, `@types/react`, `@types/react-dom` (sustituidos por JavaScript puro).
- **Instalar / Mantener:**
  - `next`, `react`, `react-dom`
  - `tailwindcss`, `@tailwindcss/postcss`, `postcss`
  - `lucide-react`, `motion`
  - `eslint`, `eslint-config-next`

---

## 4. Fases de Ejecución Inmediata

1. **Instalación y Configuración del Entorno Next.js**:
   - Instalar `next`, `@tailwindcss/postcss`, `postcss`, `eslint-config-next`.
   - Crear `next.config.mjs` y `postcss.config.mjs`.
   - Actualizar `package.json` con scripts `"dev": "next dev -p 3000 -H 0.0.0.0"`, `"build": "next build"`, `"start": "next start -p 3000"`, `"lint": "next lint"`.
2. **Migración a JavaScript Puro (.js / .jsx)**:
   - Crear el contexto de aplicación `src/context/RootShelfContext.jsx` con protección de hidratación y manejo de sesión.
   - Convertir componentes (`Header.jsx`, `Icons.jsx`, `AuthPromptModal.jsx`, `ImagePickerBox.jsx`).
   - Crear las páginas en el App Router (`app/**/*.jsx`).
   - Convertir datos y utilidades (`src/data/mockData.js`).
3. **Eliminación de Archivos Obsoletos**:
   - Borrar `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx` y archivos `.ts`/`.tsx`.
4. **Verificación y Compilación**:
   - Ejecutar `compile_applet` para confirmar la compilación limpia con `next build`.
   - Ejecutar `lint_applet` para comprobar `next lint`.
