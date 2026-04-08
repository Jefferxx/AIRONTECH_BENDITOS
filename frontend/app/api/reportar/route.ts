// frontend/app/api/reportar/route.ts
import { NextResponse } from 'next/server';
import { calcularDistancia } from '@/lib/geoUtils';

// Simulamos camiones con coordenadas reales en Riobamba
const CAMIONES_MOCK = [
  { id: 'C-01', nombre: 'Camión Norte (Terminal)', lat: -1.6500, lon: -78.6500 },
  { id: 'C-02', nombre: 'Camión Centro (Parque Sucre)', lat: -1.6669, lon: -78.6536 },
  { id: 'C-03', nombre: 'Camión Sur (Por la ESPOCH)', lat: -1.6556, lon: -78.6781 },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fotoBase64, latitud, longitud, calle, fechaHora } = body;

    // Lógica para encontrar el camión más cercano
    let camionMasCercano = CAMIONES_MOCK[0];
    let distanciaMinima = calcularDistancia(latitud, longitud, CAMIONES_MOCK[0].lat, CAMIONES_MOCK[0].lon);

    for (let i = 1; i < CAMIONES_MOCK.length; i++) {
      const camion = CAMIONES_MOCK[i];
      const distancia = calcularDistancia(latitud, longitud, camion.lat, camion.lon);
      if (distancia < distanciaMinima) {
        distanciaMinima = distancia;
        camionMasCercano = camion;
      }
    }

    // Simulamos un retraso de red para que la demo se vea realista
    await new Promise(resolve => setTimeout(resolve, 1500));

    return NextResponse.json({
      success: true,
      mensaje: "Reporte recibido con éxito",
      datosRecibidos: { latitud, longitud, calle, fechaHora },
      asignacion: {
        camionAsignado: camionMasCercano.nombre,
        distanciaKm: distanciaMinima.toFixed(2),
        mensajeRuta: `Ruta recalculada para el ${camionMasCercano.nombre}. Llegada estimada en breve.`
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error procesando el reporte" }, { status: 500 });
  }
}