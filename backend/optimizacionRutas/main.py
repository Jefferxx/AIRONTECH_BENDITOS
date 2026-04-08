from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Cargar configuración
load_dotenv()

# Configuración de IA (Nuevo SDK)
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Configuración de Base de Datos
supabase_url = os.environ.get("SUPABASE_URL")
# Asegúrate de que el backend usa la Service Role Key para tener permisos completos
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

app = FastAPI(title="Motor de Optimización Riobamba - Airontech Benditos")

# Configuración de CORS para que Next.js pueda consultar la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/ruta-optima")
async def generar_ruta():
    try:
        # 1. LEER: Obtenemos los reportes pendientes de la tabla oficial
        res = supabase.table("reportes") \
            .select("id, lat, lng, urgencia, hora") \
            .eq("estado", "pendiente") \
            .execute()
        
        reportes = res.data

        if not reportes:
            return {
                "resumen": "No hay puntos críticos pendientes en Riobamba.",
                "ruta": []
            }

        # 2. IA: Gemini procesa con el nuevo SDK
        prompt = f"""
        ACTÚA COMO UN INGENIEIRO LOGÍSTICO EXPERTO EN RIOBAMBA, ECUADOR.
        Tu misión es optimizar la ruta de un camión de basura basándote en estos datos:
        {json.dumps(reportes)}
        
        REGLAS DE PROCESAMIENTO:
        1. PUNTO DE INICIO: Empieza por el punto más cercano al Mercado Mayorista si existe.
        2. PRIORIDAD: Los reportes con 'urgencia' Alta deben estar en los primeros 5 puestos de la ruta.
        3. OPTIMIZACIÓN: Minimiza la distancia total entre puntos (TSP).
        4. FILTRO: Ignora reportes que tengan una 'hora' entre las 00:00 y las 05:00 (Falsos positivos).

        Estructura esperada:
        {{
            "resumen": "Breve análisis de la ruta generada",
            "total_puntos": {len(reportes)},
            "ruta": [
                {{
                    "orden": 1,
                    "lat": [latitud],
                    "lng": [longitud],
                    "id_reporte": "[id]",
                    "instruccion": "string breve"
                }}
            ]
        }}
        """
        
        # Llamada al nuevo SDK forzando JSON nativo
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                response_mime_type="application/json", # <-- Esto es magia pura, evita el parseo sucio
            ),
        )
        
        # 3. RETORNAR: Como pedimos JSON nativo, ya no necesitamos extraer los bloques markdown
        texto_ia = response.text.strip()
        return json.loads(texto_ia)

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="La IA generó un formato de respuesta inválido.")
    except Exception as e:
        print(f"Error detectado: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en el servidor: {str(e)}")

@app.get("/")
def health_check():
    return {"status": "online", "service": "Airontech Optimization Engine"}