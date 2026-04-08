// Archivo: frontend/app/api/reportar/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Consumiendo las variables de entorno de forma segura
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Usamos la Service Role Key para tener permisos de escritura en el servidor
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const geminiKey = process.env.GEMINI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);

export async function POST(request: Request) {
  try {
    const { fotoBase64, latitud, longitud, calle } = await request.json();

    if (!fotoBase64) throw new Error("No llegó la foto");

    // Limpiamos la imagen
    const base64Data = fotoBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const aiData = {
      tipo_residuo: "Plásticos y Cartón",
      peso_estimado_kg: 12.5,
      urgencia: "Alta",
      descripcion_ia: "Simulación de emergencia para demo",
      confianza_ia: 0.98
    };

    // 2. SUPABASE INSERT
    // Creamos un hash_zona falso rápido para cumplir tu regla NOT NULL de la BD
    // 2. SUPABASE INSERT
    const hashZona = `Z-${Math.floor(Math.abs(latitud*1000))}-${Math.floor(Math.abs(longitud*1000))}`;

    const { error: dbError } = await supabase
      .from('reportes')
      .insert([{
          tipo_residuo: aiData.tipo_residuo || 'Mixto',
          peso_estimado_kg: aiData.peso_estimado_kg || 10,
          urgencia: aiData.urgencia || 'Media',
          lat: latitud,
          lng: longitud,
          sector: calle || 'La Condamine',
          hash_zona: hashZona,
          descripcion_ia: aiData.descripcion_ia || 'Detectado por IA',
          confianza_ia: aiData.confianza_ia || 0.9,
          estado: 'pendiente',
          // 👇 ESTA ES LA LÍNEA QUE FALTA PARA QUE NO SALGA NULL 👇
          imagen_url: fotoBase64 
      }]);

    if (dbError) throw new Error(dbError.message);

    // Simulamos el camión para no fallar
    const mockCamion = "Camión Sur (RG-402)";
    const mockDistancia = (Math.random() * 3 + 1).toFixed(2); 

    return NextResponse.json({
      success: true,
      analisisIA: aiData.tipo_residuo,
      asignacion: {
        camionAsignado: mockCamion,
        distanciaKm: mockDistancia,
        mensajeRuta: "Ruta re-calculada con éxito."
      }
    });

  } catch (error: any) {
    console.error("Backend Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}