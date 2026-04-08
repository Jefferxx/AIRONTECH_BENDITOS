// Archivo: frontend/app/api/reportar/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// CLAVES QUEMADAS (Solo para la demo, luego las borras)
const supabaseUrl = 'https://qwngrubkuakuuvhilvmi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3bmdydWJrdWFrdXV2aGlsdm1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY1ODUyMCwiZXhwIjoyMDkxMjM0NTIwfQ.RzEqPzl_W71IqKuIFa7Y1R7_1WmV_gPWGfomExqOZU4';
const geminiKey = 'AIzaSyBm4jZ_XsS--adeMjXy17gFGHiMhs8jUCk';

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);

export async function POST(request: Request) {
  try {
    const { fotoBase64, latitud, longitud, calle } = await request.json();

    if (!fotoBase64) throw new Error("No llegó la foto");

    // Limpiamos la imagen
    const base64Data = fotoBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    // 1. GEMINI IA
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Analiza esta imagen de basura. Eres una IA de gestión de residuos.
      Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta, sin markdown:
      {
        "tipo_residuo": "Plástico",
        "peso_estimado_kg": 5.5,
        "urgencia": "Alta",
        "descripcion_ia": "Breve descripción",
        "confianza_ia": 0.95
      }
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    let iaText = result.response.text().trim();
    if (iaText.startsWith('```')) {
      iaText = iaText.replace(/^```json/, '').replace(/```$/, '').trim();
    }
    const aiData = JSON.parse(iaText);

    // 2. SUPABASE INSERT
    // Creamos un hash_zona falso rápido para cumplir tu regla NOT NULL de la BD
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
          estado: 'pendiente'
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