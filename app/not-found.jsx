import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
      <h2 className="text-3xl font-bold text-gray-900">404 - Página no encontrada</h2>
      <p className="text-gray-600">La página que estás buscando no existe o fue movida.</p>
      <Link
        href="/"
        className="inline-block px-5 py-2.5 bg-[#134038] hover:bg-[#0e2e28] text-white text-sm font-semibold transition-colors"
      >
        Volver a la Biblioteca
      </Link>
    </div>
  );
}
