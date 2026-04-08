// frontend/app/reportar/page.tsx
import CapturaCiudadana from '@/components/CapturaCiudadana';
import Link from 'next/link';

export default function PaginaReporte() {
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800">Sistema de Gestión de Residuos</h1>
        <p className="text-gray-600">Ayúdanos a mantener limpia nuestra ciudad.</p>
      </div>
      
      {/* Aquí insertamos el componente interactivo */}
      <CapturaCiudadana />
    </main>
  );
}