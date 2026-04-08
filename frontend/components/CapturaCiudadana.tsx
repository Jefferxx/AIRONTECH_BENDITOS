// frontend/components/CapturaCiudadana.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import { obtenerDireccion } from '@/lib/geoUtils';
import { useRouter } from 'next/navigation';

export default function CapturaCiudadana() {
  const router = useRouter(); // <-- Agrega esta línea aquí
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [estado, setEstado] = useState<'iniciando' | 'listo' | 'procesando' | 'completado' | 'error'>('iniciando');
  const [resultado, setResultado] = useState<any>(null);

  // Iniciar la cámara al montar el componente
  useEffect(() => {
    async function activarCamara() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setEstado('listo');
      } catch (err) {
        console.error("Error accediendo a la cámara", err);
        setEstado('error');
      }
    }
    activarCamara();
    return () => {
      // Apagar cámara al salir
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  const tomarFotoYReportar = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setEstado('procesando');

    // 1. Capturar Foto en Base64
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);
    const fotoBase64 = canvasRef.current.toDataURL('image/jpeg');
    setFoto(fotoBase64);

    // 2. Obtener GPS
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      
      // 3. Obtener Calle (Reverse Geocoding)
      const calle = await obtenerDireccion(lat, lon);
      const fechaHora = new Date().toISOString();

      // 4. Enviar a nuestro Backend (Next.js API)
      try {
        const respuesta = await fetch('/api/reportar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fotoBase64, latitud: lat, longitud: lon, calle, fechaHora })
        });
        const data = await respuesta.json();
        setResultado(data);
        setEstado('completado');
      } catch (error) {
        setEstado('error');
      }
    }, (error) => {
      console.error("Error de GPS", error);
      alert("Por favor, activa el GPS para realizar el reporte.");
      setEstado('listo');
    }, { enableHighAccuracy: true });
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl shadow-lg w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-green-700">EcoRuta - Reporte Ciudadano</h2>
      
      {/* Contenedor del video/foto */}
      <div className="relative w-full aspect-[3/4] bg-black rounded-lg overflow-hidden mb-4 shadow-inner">
        {!foto && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />}
        {foto && <img src={foto} alt="Captura de basura" className="w-full h-full object-cover" />}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {estado === 'listo' && (
        <button onClick={tomarFotoYReportar} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition shadow-md">
          📸 Reportar Foco de Contaminación
        </button>
      )}

      {estado === 'procesando' && (
        <div className="text-blue-600 font-semibold animate-pulse">
          Analizando imagen con IA y triangulando GPS...
        </div>
      )}

      {estado === 'completado' && resultado && (
        <div className="w-full bg-white p-4 rounded-lg border border-green-200 mt-2 text-sm">
          <p className="text-green-600 font-bold mb-2">✅ ¡Reporte Enviado!</p>
          <p><strong>Ubicación:</strong> {resultado.datosRecibidos.calle}</p>
          <hr className="my-2" />
          <p className="text-blue-800 font-bold">🚛 Acción del Municipio:</p>
          <p>{resultado.asignacion.mensajeRuta}</p>
          <p className="text-xs text-gray-500 mt-1">Distancia al camión: {resultado.asignacion.distanciaKm} km</p>
          <button 
            onClick={() => router.push('/clasificacion')} 
            className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-bold transition"
          >
            Volver al Escáner
          </button>
        </div>
      )}

      {estado === 'error' && (
        <p className="text-red-500 font-bold">Ocurrió un error al acceder a la cámara o red.</p>
      )}
    </div>
  );
}