export const initialStories = [
  {
    id: 's-1',
    title: 'El Susurro de las Hojas',
    author: 'Elena R. Morales',
    authorId: 'user_elena_01',
    genre: 'Fantasía / Aventura',
    description: 'En lo profundo del bosque de Eldoria, los antiguos robles comienzan a susurrar secretos olvidados que amenazan con despertar a una deidad dormida.',
    hashtags: ['#Fantasia', '#Aventura', '#Misterio'],
    classification: '+13',
    language: 'Español',
    coverUrl: '',
    characters: ['c-1', 'c-2'],
    locations: ['p-1'],
    objects: ['o-1'],
    isRead: false,
    isDraft: false,
    isOwner: false,
    chapters: [
      {
        id: 'ch-1',
        number: 1,
        title: 'Capítulo 1: El despertar en la penumbra',
        content: `La niebla se arrastraba entre las raíces gigantescas como dedos pálidos tanteando el terreno. Valen se detuvo en el sendero, conteniendo el aliento. Hacía años que nadie se atrevía a cruzar el límite del Valle Sombrío después de la puesta del sol.

A su espalda, el tintineo del amuleto de bronce que colgaba de su cinturón parecía marcar los segundos de una cuenta regresiva invisible.

—No debimos venir —susurró Lysa, ajustando la correa de su arco—. El viento huele a ceniza húmeda.

Valen no respondió de inmediato. Pasó los dedos por el corteza de un fresno centenario. La madera no estaba fría ni rugosa; vibraba con una pulsación rítmica, un latido subterráneo que hacía vibrar el suelo bajo sus botas.

—Si las leyendas son ciertas —dijo él, volviéndose hacia ella—, este árbol recuerda la caída de la ciudadela. Y guarda la única llave que nos queda.`,
      },
      {
        id: 'ch-2',
        number: 2,
        title: 'Capítulo 2: El mapa de raíces',
        content: `La cueva subterránea olía a tierra húmeda y musgo fosforescente. Las raíces descendían del techo rocoso como columnas de un templo olvidado por el tiempo.

Lysa encendió una pequeña bengala de pólvora verde. La luz esmeralda reveló grabados en las paredes: siluetas de guardianes armados con varas de fresno y portadores de coronas doradas.

—Mira esto —indicó Valen señalando un pedestal esculpido en piedra negra—. El símbolo del árbol con la hoja coronada.`,
      },
      {
        id: 'ch-3',
        number: 3,
        title: 'Capítulo 3: Sombras en la niebla',
        content: `Un crujido seco resonó en el pasadizo detrás de ellos. Valen desenvainó la daga de plata forjada por su padre. El metal reflejó el tenue resplandor esmeralda.

—No estamos solos —dijo Lysa en un susurro apenas audible.

Desde la oscuridad, dos orbes de luz ambarina los observaban fijamente.`,
      },
      {
        id: 'ch-4',
        number: 4,
        title: 'Capítulo 4: El pacto de sangre',
        content: `La figura encapuchada dio un paso al frente revelando su rostro curtido por los inviernos de la montaña.

—Buscáis lo que no os pertenece —resonó la voz anciana, profunda como el trueno en la lejanía—. Sin embargo, lleváis la marca de los primeros narradores.`,
      },
    ],
  },
  {
    id: 's-2',
    title: 'Crónicas del Archivo',
    author: 'Martín Sueldo',
    authorId: 'user_martin_01',
    genre: 'Ciencia Ficción',
    description: 'En una biblioteca galáctica donde cada libro almacena la memoria de un planeta extinto, un archivista descubre una página en blanco.',
    hashtags: ['#SciFi', '#Misterio', '#Espacio'],
    classification: 'Todo público',
    language: 'Español',
    characters: ['c-3'],
    locations: ['p-2'],
    objects: ['o-2'],
    isRead: true,
    isDraft: false,
    isOwner: true,
    chapters: [
      {
        id: 'ch-2-1',
        number: 1,
        title: 'Capítulo 1: El estante 404',
        content: 'El catálogo estelar parpadeaba en tonos ámbar. Martín acomodó los cristales ópticos...',
      },
      {
        id: 'ch-2-2',
        number: 2,
        title: 'Capítulo 2: Voces en el vacío',
        content: 'La frecuencia no pertenecía a ninguna nave comercial conocida...',
      },
    ],
  },
  {
    id: 's-3',
    title: 'Ecos de Piedra y Fuego',
    author: 'Martín Sueldo',
    authorId: 'user_martin_01',
    genre: 'Fantasía Épica',
    description: 'La forja ancestral de los Reyes de la Colina ha vuelto a encenderse después de tres siglos de frío silencio.',
    hashtags: ['#Epica', '#Reinos'],
    classification: '+16',
    language: 'Español',
    characters: ['c-1'],
    locations: ['p-3'],
    objects: ['o-1'],
    isRead: false,
    isDraft: true,
    isOwner: true,
    chapters: [
      {
        id: 'ch-3-1',
        number: 1,
        title: 'Capítulo 1: La chispa en la ceniza',
        content: 'El martillo cayó sobre el yunque con un eco que despertó a los cuervos en la torre...',
      },
    ],
  },
  {
    id: 's-4',
    title: 'La Ciudad de los Relojes',
    author: 'Clara Domínguez',
    authorId: 'user_clara_01',
    genre: 'Steampunk',
    description: 'El tiempo no pasa igual en los distritos altos que en los subterráneos donde habitan los engranajes.',
    hashtags: ['#Steampunk', '#Distopia'],
    classification: 'Todo público',
    language: 'Español',
    characters: [],
    isRead: true,
    isDraft: false,
    isOwner: false,
    chapters: [
      {
        id: 'ch-4-1',
        number: 1,
        title: 'Capítulo 1: La hora perdida',
        content: 'Las campanas sonaron a las trece en punto...',
      },
    ],
  },
  {
    id: 's-5',
    title: 'Bajo el Cielo de Cobalto',
    author: 'Ignacio Vega',
    authorId: 'user_ignacio_01',
    genre: 'Aventura Marina',
    description: 'Navegando hacia los límites de las cartas náuticas conocidas en busca de la Isla de Cristal.',
    hashtags: ['#Mar', '#Aventura'],
    classification: '+13',
    language: 'Español',
    characters: [],
    isRead: true,
    isDraft: false,
    isOwner: false,
    chapters: [
      {
        id: 'ch-5-1',
        number: 1,
        title: 'Capítulo 1: Viento en popa',
        content: 'El océano no perdonaba a los navegantes inexpertos...',
      },
    ],
  },
  {
    id: 's-6',
    title: 'Sombras sobre el Támesis',
    author: 'Beatriz L. Ramos',
    authorId: 'user_beatriz_01',
    genre: 'Misterio Histórico',
    description: 'Londres en 1888. Una serie de cartas anónimas predice crímenes antes de que ocurran.',
    hashtags: ['#Misterio', '#Historica'],
    classification: '+16',
    language: 'Español',
    characters: [],
    isRead: false,
    isDraft: false,
    isOwner: false,
    chapters: [
      {
        id: 'ch-6-1',
        number: 1,
        title: 'Capítulo 1: Niebla de otoño',
        content: 'Las farolas de gas apenas cortaban la densa niebla ribereña...',
      },
    ],
  },
];

export const initialFolders = [
  { id: 'f-1', name: 'Protagonistas', type: 'characters' },
  { id: 'f-2', name: 'Antagonistas', type: 'characters' },
  { id: 'f-3', name: 'Reino del Norte', type: 'places' },
  { id: 'f-4', name: 'Ciudades Subterráneas', type: 'places' },
  { id: 'f-5', name: 'Reliquias Mágicas', type: 'objects' },
  { id: 'f-6', name: 'Armamento', type: 'objects' },
];

export const initialCharacters = [
  {
    id: 'c-1',
    firstName: 'Valen',
    lastName: 'Vance',
    birthDay: '14',
    birthMonth: 'Mayo',
    birthYear: '1420',
    age: '24',
    gender: 'Hombre',
    roleInStory: 'Protagonista',
    description: 'Joven explorador de linaje olvidado. Posee una memoria prodigiosa para descifrar inscripciones arcanas.',
    relationships: {
      parents: 'Lord Alden Vance y Lady Mirielle',
      allies: 'Lysa Carrow',
      rivals: 'Comandante Kaelen',
    },
    folderId: 'f-1',
  },
  {
    id: 'c-2',
    firstName: 'Lysa',
    lastName: 'Carrow',
    birthDay: '03',
    birthMonth: 'Noviembre',
    birthYear: '1422',
    age: '22',
    gender: 'Mujer',
    roleInStory: 'Compañera / Exploradora',
    description: 'Arquera del gremio del bosque. Ágil, escéptica y protectora incondicional de los suyos.',
    relationships: {
      parents: 'Garret Carrow',
      allies: 'Valen Vance',
    },
    folderId: 'f-1',
  },
  {
    id: 'c-3',
    firstName: 'Kaelen',
    lastName: 'el Sombrío',
    birthDay: '28',
    birthMonth: 'Agosto',
    birthYear: '1398',
    age: '46',
    gender: 'Hombre',
    roleInStory: 'Antagonista',
    description: 'Antiguo general de la guardia real que busca despertar el poder del árbol durmiente.',
    relationships: {
      rivals: 'Valen Vance',
    },
    folderId: 'f-2',
  },
  {
    id: 'c-4',
    firstName: 'Sybilla',
    lastName: 'de la Niebla',
    birthDay: '19',
    birthMonth: 'Enero',
    birthYear: '1380',
    age: '64',
    gender: 'Mujer',
    roleInStory: 'Mentora',
    description: 'Guardián del templo subterráneo y portadora de las antiguas canciones de la raíz.',
    relationships: {},
    folderId: 'f-1',
  },
];

export const initialPlaces = [
  {
    id: 'p-1',
    name: 'El Valle Sombrío',
    description: 'Una depresión boscosa cubierta por niebla constante, donde las raíces de árboles milenarios forman puentes naturales.',
    location: 'Frontera de Eldoria',
    appearsIn: 'El Susurro de las Hojas',
    folderId: 'f-3',
  },
  {
    id: 'p-2',
    name: 'El Archivo Galáctico',
    description: 'Estructura esférica que orbita la enana blanca de Celis. Alberga más de diez billones de volúmenes de cristal.',
    location: 'Sector 7 - Órbita Celis',
    appearsIn: 'Crónicas del Archivo',
    folderId: 'f-4',
  },
  {
    id: 'p-3',
    name: 'La Forja de la Colina',
    description: 'Caverna volcánica acondicionada con hornos gigantescos que aprovechan el magma de la tierra profunda.',
    location: 'Montañas de Hierro',
    appearsIn: 'Ecos de Piedra y Fuego',
    folderId: 'f-3',
  },
  {
    id: 'p-4',
    name: 'Torre del Reloj Central',
    description: 'Monumento de bronce y cristal que regula el ritmo de vida y las frecuencias temporales de la metrópoli.',
    location: 'Distrito Alto',
    appearsIn: 'La Ciudad de los Relojes',
    folderId: 'f-4',
  },
];

export const initialObjects = [
  {
    id: 'o-1',
    name: 'Amuleto de la Hoja Coronada',
    description: 'Pieza de bronce envejecido con una esmeralda tallada en forma de hoja en su centro. Resuena cerca de las raíces arcanas.',
    location: 'En posesión de Valen',
    appearsIn: 'El Susurro de las Hojas',
    folderId: 'f-5',
  },
  {
    id: 'o-2',
    name: 'Cristal Nemónico Blanco',
    description: 'Un prisma transparente que no refleja la luz ordinaria. Contiene un registro borrado de la biblioteca.',
    location: 'Estante 404',
    appearsIn: 'Crónicas del Archivo',
    folderId: 'f-5',
  },
  {
    id: 'o-3',
    name: 'Daga de Plata Sombría',
    description: 'Arma ligera templada con agua de los ríos subterráneos. No emite sonido alguno al cortar el aire.',
    location: 'Cinturón de Valen',
    appearsIn: 'El Susurro de las Hojas',
    folderId: 'f-6',
  },
  {
    id: 'o-4',
    name: 'Llave de Engranajes Maestros',
    description: 'Herramienta de relojería capaz de abrir los conductos neumáticos del distrito bajo.',
    location: 'Taller de Clara',
    appearsIn: 'La Ciudad de los Relojes',
    folderId: 'f-6',
  },
];
