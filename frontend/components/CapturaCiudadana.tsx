'use client';

import { useRef, useState, useEffect } from 'react';
import { obtenerDireccion } from '@/lib/geoUtils';
import { useRouter } from 'next/navigation';

export default function CapturaCiudadana() {
  const router = useRouter();
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
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
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
    
    // Comprimimos un poco para evitar payloads gigantes
    const fotoBase64 = canvasRef.current.toDataURL('image/jpeg', 0.7);
    setFoto(fotoBase64);

    // 2. Obtener GPS
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const accuracy = position.coords.accuracy || 0;
      
      // 3. Obtener Calle (Reverse Geocoding)
      const calle = await obtenerDireccion(lat, lon);

      // 4. Enviar a FastAPI (Clasificación de Imágenes)
      try {
        const respuesta = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_CLASIFICACION}/api/reportes/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            image_b64: fotoBase64,      // Sincronizado con ReporteCreate
            lat: lat,                   // Sincronizado
            lng: lon,                   // Sincronizado
            sector: calle || "Sector Riobamba", // Sincronizado
            es_contenedor_lleno: false, // Requerido por el esquema
            accuracy_gps: accuracy      // Requerido por el esquema
          })
        });

        const data = await respuesta.json();

        if (respuesta.ok) {
          setResultado(data);
          setEstado('completado');
        } else {
          console.error("Error del backend:", data.detail);
          setEstado('error');
        }
      } catch (error) {
        console.error("Error de red:", error);
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
        <div className="text-blue-600 font-semibold animate-pulse flex flex-col items-center gap-2">
          <span>Analizando imagen con IA...</span>
          <span className="text-xs">Triangulando GPS en Riobamba</span>
        </div>
      )}

      {estado === 'completado' && resultado && (
        <div className="w-full bg-white p-4 rounded-lg border-l-4 border-green-500 mt-2 text-sm shadow-sm">
          <p className="text-green-600 font-bold mb-2 flex items-center gap-2">
            ✅ ¡Reporte Confirmado!
          </p>
          <div className="space-y-1 text-gray-700">
            <p><strong>ID:</strong> #{resultado.id}</p>
            <p><strong>Ubicación:</strong> {resultado.sector}</p>
            <p><strong>IA Detectó:</strong> {resultado.tipo_residuo}</p>
            <p><strong>Urgencia:</strong> <span className={resultado.urgencia === 'Alta' ? 'text-red-600 font-bold' : ''}>{resultado.urgencia}</span></p>
          </div>
          <hr className="my-3" />
          <p className="text-blue-800 font-medium">🚛 Estado: <span className="capitalize">{resultado.estado}</span></p>
          <p className="text-[10px] text-gray-400 mt-1 italic">Datos guardados en Supabase mediante EcoRuta Engine.</p>
          
          <button 
            onClick={() => {
              setFoto(null);
              setEstado('listo');
              setResultado(null);
            }} 
            className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-bold transition"
          >
            Nueva Captura
          </button>
        </div>
      )}

      {estado === 'error' && (
        <div className="text-center">
          <p className="text-red-500 font-bold mb-2">Ocurrió un error al procesar el reporte.</p>
          <button onClick={() => setEstado('listo')} className="text-primary text-sm underline">Reintentar</button>
        </div>
      )}
    </div>
  );
}