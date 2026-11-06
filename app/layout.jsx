import './globals.css';
import { RootShelfProvider } from '../src/context/RootShelfContext';
import { Header } from '../src/components/Header';
import { Footer } from '../src/components/Footer';
import { AuthPromptModal } from '../src/components/AuthPromptModal';

export const metadata = {
  title: 'RootShelf - Lectura y Creación de Historias',
  description: 'Plataforma de lectura, biblioteca personal y taller de creación de historias con fichas de personajes, lugares y objetos.',
  openGraph: {
    title: 'RootShelf - Lectura y Creación de Historias',
    description: 'Plataforma de lectura, biblioteca personal y taller de creación de historias con fichas de personajes, lugares y objetos.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#EFEFEF] text-[#1A1A1A] antialiased flex flex-col font-sans overflow-x-hidden">
        <RootShelfProvider>
          <Header />
          <main className="flex-1 w-full max-w-full overflow-x-hidden">
            {children}
          </main>
          <Footer />
          <AuthPromptModal />
        </RootShelfProvider>
      </body>
    </html>
  );
}
