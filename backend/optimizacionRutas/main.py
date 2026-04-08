from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Cargar configuración
load_dotenv()

# Configuración de IA
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
# Usamos una temperatura baja (0.2) para que la IA sea precisa y no invente rutas locas
model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"temperature": 0.2})

# Configuración de Base de Datos
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
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
        # Nota: Usamos 'lng' porque así está en el esquema de tu compañero
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

        # 2. IA: Gemini procesa los datos como un experto en logística
        prompt = f"""
        ACTÚA COMO UN INGENIEIRO LOGÍSTICO EXPERTO EN RIOBAMBA, ECUADOR.
        Tu misión es optimizar la ruta de un camión de basura basándote en estos datos:
        {json.dumps(reportes)}
        
        REGLAS DE PROCESAMIENTO:
        1. PUNTO DE INICIO: Empieza por el punto más cercano al Mercado Mayorista si existe.
        2. PRIORIDAD: Los reportes con 'urgencia' Alta deben estar en los primeros 5 puestos de la ruta.
        3. OPTIMIZACIÓN: Minimiza la distancia total entre puntos (TSP).
        4. FILTRO: Ignora reportes que tengan una 'hora' entre las 00:00 y las 05:00 (Falsos positivos).

        RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO (SIN MARKDOWN, SIN TEXTO EXTRA):
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
        
        response = model.generate_content(prompt)
        
        # 3. LIMPIEZA AGRESIVA: Extraer solo el JSON de la respuesta de la IA
        texto_ia = response.text.strip()
        # Eliminar bloques de código markdown si la IA los incluye
        if "```json" in texto_ia:
            texto_ia = texto_ia.split("```json")[1].split("```")[0].strip()
        elif "```" in texto_ia:
            texto_ia = texto_ia.split("```")[1].split("```")[0].strip()
        
        # 4. RETORNAR: Enviamos el JSON limpio al frontend
        return json.loads(texto_ia)

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="La IA generó un formato de respuesta inválido.")
    except Exception as e:
        print(f"Error detectado: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en el servidor: {str(e)}")

@app.get("/")
def health_check():
    return {"status": "online", "service": "Airontech Optimization Engine"}