#!/bin/bash

BASE="/home/jejajoca/Documentos/Universidad_Local/HACKATON_AIRONTECH/AIRONTECH_BENDITOS/backend/clasificacionImagenes"

echo "📁 Creando estructura de directorios..."
mkdir -p "$BASE/routes"
mkdir -p "$BASE/services"
mkdir -p "$BASE/models"

# ─────────────────────────────────────────────
# requirements.txt
# ─────────────────────────────────────────────
cat > "$BASE/requirements.txt" << 'EOF'
fastapi
uvicorn[standard]
python-dotenv
supabase
google-generativeai
pillow
python-multipart
httpx
EOF

# ─────────────────────────────────────────────
# .env  (rellena tus credenciales aqui)
# ─────────────────────────────────────────────
cat > "$BASE/.env" << 'EOF'
SUPABASE_URL=https://XXXXXXXXXX.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...tu_service_role_key...
GEMINI_API_KEY=AIza...tu_gemini_key...
EOF

# ─────────────────────────────────────────────
# config.py
# ─────────────────────────────────────────────
cat > "$BASE/config.py" << 'EOF'
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL         = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY       = os.getenv("GEMINI_API_KEY")

TIPOS_VALIDOS = {"Orgánico", "Plástico/PET", "Escombros", "Mixto", "Peligroso", "Sin residuos"}
URGENCIAS     = {"Alta", "Media", "Baja"}
SECTORES      = {"La Condamine", "Centro Histórico", "Lizarzaburu", "Veloz", "Maldonado"}
TURNOS        = {"mañana": (6, 13), "tarde": (13, 20), "noche": (20, 6)}
EOF

# ─────────────────────────────────────────────
# models/__init__.py
# ─────────────────────────────────────────────
touch "$BASE/models/__init__.py"

# ─────────────────────────────────────────────
# models/schemas.py
# ─────────────────────────────────────────────
cat > "$BASE/models/schemas.py" << 'EOF'
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReporteCreate(BaseModel):
    image_b64:            str
    lat:                  float
    lng:                  float
    sector:               str
    es_contenedor_lleno:  bool            = False
    accuracy_gps:         Optional[float] = None
    foto_hash:            Optional[str]   = None


class ReporteResponse(BaseModel):
    id:                 int
    tipo_residuo:       str
    peso_estimado_kg:   float
    urgencia:           str
    lat:                float
    lng:                float
    sector:             str
    descripcion_ia:     Optional[str]
    confianza_ia:       Optional[float]
    nivel_obstruccion:  Optional[str]
    turno_sugerido:     Optional[str]
    estado:             str
    tipo_reporte:       str
    imagen_url:         Optional[str]
    timestamp:          datetime
    modo_fallback:      bool = False


class DescargaCreate(BaseModel):
    image_b64:      str
    reporte_id:     Optional[int]   = None
    trabajador_id:  Optional[str]   = None
    peso_total_kg:  Optional[float] = None


class DescargaResponse(BaseModel):
    id:             int
    pct_organico:   float
    pct_plastico:   float
    pct_escombros:  float
    pct_mixto:      float
    pct_peligroso:  float
    peso_total_kg:  Optional[float]
    observacion_ia: Optional[str]
    confianza_ia:   Optional[float]
    imagen_url:     Optional[str]
    timestamp:      datetime
    modo_fallback:  bool = False


class EstadisticasResponse(BaseModel):
    total_reportes:  int
    kg_totales:      float
    alta_urgencia:   int
    media_urgencia:  int
    baja_urgencia:   int
    atendidos:       int
    pendientes:      int
    en_ruta:         int
EOF

# ─────────────────────────────────────────────
# services/__init__.py
# ─────────────────────────────────────────────
touch "$BASE/services/__init__.py"

# ─────────────────────────────────────────────
# services/gemini_service.py
# ─────────────────────────────────────────────
cat > "$BASE/services/gemini_service.py" << 'EOF'
import google.generativeai as genai
import base64, json, re, hashlib, logging
from config import GEMINI_API_KEY, TIPOS_VALIDOS, URGENCIAS

logger = logging.getLogger(__name__)
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

# ── PROMPT: reporte ciudadano (foto de basura en la calle) ───────────────────
PROMPT_REPORTE = """Eres un inspector ambiental experto del Municipio de Riobamba, Ecuador.
Analiza la imagen de residuos sólidos urbanos y responde ÚNICAMENTE con un objeto JSON válido,
sin texto adicional, sin bloques de código, sin explicaciones.

JSON requerido (esquema exacto):
{
  "tipo_residuo":       "<Orgánico|Plástico/PET|Escombros|Mixto|Peligroso|Sin residuos>",
  "peso_estimado_kg":   <float, estimado visual>,
  "urgencia":           "<Alta|Media|Baja>",
  "descripcion":        "<oración técnica en español, máximo 15 palabras>",
  "confianza":          <float 0.0 a 1.0>,
  "nivel_obstruccion":  "<libre|parcial|total>"
}

Reglas de urgencia:
- Alta: peso > 20kg, O material peligroso/tóxico, O bloquea paso peatonal/vehicular completamente
- Media: peso 5-20kg, O residuos mezclados, O obstrucción parcial
- Baja: peso < 5kg, O residuo aislado, O sin obstrucción

Si no hay residuos visibles: tipo_residuo="Sin residuos", peso=0, urgencia="Baja", confianza=1.0"""

# ── PROMPT: clasificación en punto de descarga (foto de carga del camión) ────
PROMPT_DESCARGA = """Eres un técnico de clasificación de residuos sólidos en la planta de
disposición final de Riobamba, Ecuador. Analiza la imagen de la carga del camión recolector
y responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional.

JSON requerido (esquema exacto):
{
  "pct_organico":   <float 0-100>,
  "pct_plastico":   <float 0-100>,
  "pct_escombros":  <float 0-100>,
  "pct_mixto":      <float 0-100>,
  "pct_peligroso":  <float 0-100>,
  "observacion":    "<descripción técnica de la composición, máximo 20 palabras>",
  "confianza":      <float 0.0 a 1.0>
}

Los porcentajes DEBEN sumar exactamente 100.
Estima visualmente la proporción de cada tipo de residuo en la imagen.
Si la imagen no muestra residuos claramente, asigna confianza < 0.4."""

# ── Fallbacks (cuando Gemini falla o responde con formato incorrecto) ────────
FALLBACK_REPORTE = {
    "tipo_residuo":      "Mixto",
    "peso_estimado_kg":  5.0,
    "urgencia":          "Media",
    "descripcion":       "Análisis no disponible — modo demostración activo",
    "confianza":         0.0,
    "nivel_obstruccion": "libre",
}
FALLBACK_DESCARGA = {
    "pct_organico":  40.0,
    "pct_plastico":  30.0,
    "pct_escombros": 15.0,
    "pct_mixto":     10.0,
    "pct_peligroso":  5.0,
    "observacion":   "Clasificación no disponible — modo demostración activo",
    "confianza":     0.0,
}


# ── Helpers internos ─────────────────────────────────────────────────────────
def _decode_image(image_b64: str) -> bytes:
    """Acepta base64 con o sin prefijo data:image/...;base64,"""
    if "," in image_b64:
        image_b64 = image_b64.split(",")[1]
    return base64.b64decode(image_b64)


def _extract_json(text: str) -> dict:
    """Limpia la respuesta de Gemini y extrae el JSON."""
    text = re.sub(r"```(?:json)?", "", text).strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError(f"No se encontró JSON en la respuesta: {text[:200]}")
    return json.loads(match.group())


def _validar_reporte(data: dict) -> bool:
    return (
        data.get("tipo_residuo") in TIPOS_VALIDOS
        and data.get("urgencia") in URGENCIAS
        and isinstance(data.get("peso_estimado_kg"), (int, float))
        and 0 <= data.get("peso_estimado_kg", -1) <= 5000
        and isinstance(data.get("confianza"), (int, float))
        and 0 <= data.get("confianza", -1) <= 1
    )


def _validar_descarga(data: dict) -> bool:
    keys = ["pct_organico", "pct_plastico", "pct_escombros", "pct_mixto", "pct_peligroso"]
    if not all(k in data for k in keys):
        return False
    total = sum(data[k] for k in keys)
    return 95 <= total <= 105  # tolerancia ±5 por redondeo de Gemini


def _normalizar_descarga(data: dict) -> dict:
    """Fuerza que los porcentajes sumen exactamente 100."""
    keys = ["pct_organico", "pct_plastico", "pct_escombros", "pct_mixto", "pct_peligroso"]
    total = sum(data[k] for k in keys)
    if total > 0:
        for k in keys:
            data[k] = round(data[k] * 100 / total, 2)
    return data


# ── API pública ───────────────────────────────────────────────────────────────
def calcular_foto_hash(image_b64: str) -> str:
    """MD5 de la imagen para detección de duplicados."""
    raw = _decode_image(image_b64)
    return hashlib.md5(raw).hexdigest()


def analizar_imagen_reporte(image_b64: str) -> tuple[dict, bool]:
    """
    Clasifica una foto de basura en la calle.
    Retorna (resultado_dict, es_fallback).
    Nunca lanza excepción — siempre retorna algo usable.
    """
    try:
        image_bytes = _decode_image(image_b64)
        response = model.generate_content([
            PROMPT_REPORTE,
            {"mime_type": "image/jpeg", "data": image_bytes},
        ])
        data = _extract_json(response.text)
        if not _validar_reporte(data):
            logger.warning("Respuesta de Gemini inválida (reporte): %s", data)
            return FALLBACK_REPORTE.copy(), True
        return data, False
    except Exception as exc:
        logger.error("Error Gemini (reporte): %s", exc)
        return FALLBACK_REPORTE.copy(), True


def analizar_imagen_descarga(image_b64: str) -> tuple[dict, bool]:
    """
    Clasifica la composición de una carga de camión.
    Retorna (resultado_dict, es_fallback).
    Nunca lanza excepción — siempre retorna algo usable.
    """
    try:
        image_bytes = _decode_image(image_b64)
        response = model.generate_content([
            PROMPT_DESCARGA,
            {"mime_type": "image/jpeg", "data": image_bytes},
        ])
        data = _extract_json(response.text)
        if not _validar_descarga(data):
            logger.warning("Respuesta de Gemini inválida (descarga): %s", data)
            return FALLBACK_DESCARGA.copy(), True
        return _normalizar_descarga(data), False
    except Exception as exc:
        logger.error("Error Gemini (descarga): %s", exc)
        return FALLBACK_DESCARGA.copy(), True
EOF

# ─────────────────────────────────────────────
# services/storage_service.py
# ─────────────────────────────────────────────
cat > "$BASE/services/storage_service.py" << 'EOF'
import base64, uuid, logging
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

logger = logging.getLogger(__name__)
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
BUCKET = "reportes-imagenes"


def subir_imagen(image_b64: str, carpeta: str = "reportes") -> str | None:
    """
    Sube la imagen a Supabase Storage y retorna la URL pública.
    Retorna None si falla — la imagen no es crítica para guardar el reporte.
    """
    try:
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]
        image_bytes = base64.b64decode(image_b64)
        filename = f"{carpeta}/{uuid.uuid4()}.jpg"
        supabase.storage.from_(BUCKET).upload(
            filename,
            image_bytes,
            {"content-type": "image/jpeg"},
        )
        url = supabase.storage.from_(BUCKET).get_public_url(filename)
        return url
    except Exception as exc:
        logger.warning("No se pudo subir imagen a Storage: %s", exc)
        return None
EOF

# ─────────────────────────────────────────────
# services/agregador_service.py
# ─────────────────────────────────────────────
cat > "$BASE/services/agregador_service.py" << 'EOF'
import math, logging
from datetime import datetime, timezone, timedelta
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

logger = logging.getLogger(__name__)
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

URGENCIA_MAP = {"Baja": 0, "Media": 1, "Alta": 2}
URGENCIA_INV = {0: "Baja", 1: "Media", 2: "Alta"}


def calcular_hash_zona(lat: float, lng: float, precision: float = 0.0005) -> str:
    """
    Agrupa coordenadas dentro de ~50 m en el mismo hash.
    precision=0.0005 grados ≈ 55 m en el ecuador.
    """
    lat_r = math.floor(lat / precision) * precision
    lng_r = math.floor(lng / precision) * precision
    return f"{lat_r:.4f}:{lng_r:.4f}"


def calcular_turno(timestamp: datetime = None) -> str:
    if timestamp is None:
        timestamp = datetime.now(timezone.utc)
    hora = timestamp.hour
    if 6 <= hora < 13:
        return "mañana"
    if 13 <= hora < 20:
        return "tarde"
    return "noche"


def resolver_reporte(hash_zona: str, foto_hash: str | None) -> tuple[str, int | None]:
    """
    Decide si crear un reporte nuevo o reforzar uno existente.
    Retorna ('nuevo' | 'refuerzo', id_existente | None).
    Lanza ValueError si la foto ya fue reportada antes (duplicado exacto).
    """
    # 1. Detectar foto duplicada por hash MD5
    if foto_hash:
        dup = (
            supabase.table("reportes")
            .select("id")
            .eq("foto_hash", foto_hash)
            .limit(1)
            .execute()
        )
        if dup.data:
            raise ValueError("DUPLICADO: Esta imagen ya fue reportada anteriormente.")

    # 2. Buscar reporte pendiente en la misma zona (ventana de 2 horas)
    hace_dos_horas = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    existente = (
        supabase.table("reportes")
        .select("id, peso_estimado_kg, urgencia")
        .eq("hash_zona", hash_zona)
        .eq("estado", "pendiente")
        .gte("timestamp", hace_dos_horas)
        .order("timestamp", desc=True)
        .limit(1)
        .execute()
    )

    if existente.data:
        return "refuerzo", existente.data[0]["id"]
    return "nuevo", None


def aplicar_refuerzo(reporte_id: int, nuevo_analisis: dict) -> dict:
    """
    Acumula el peso del nuevo análisis al reporte existente y recalcula urgencia.
    Retorna el reporte actualizado desde Supabase.
    """
    actual = (
        supabase.table("reportes")
        .select("*")
        .eq("id", reporte_id)
        .single()
        .execute()
    ).data

    peso_acumulado = actual["peso_estimado_kg"] + nuevo_analisis["peso_estimado_kg"]

    # Escalar urgencia al nivel más alto entre el actual y el nuevo
    nivel_actual = URGENCIA_MAP.get(actual["urgencia"], 0)
    nivel_nuevo  = URGENCIA_MAP.get(nuevo_analisis["urgencia"], 0)
    nueva_urgencia = URGENCIA_INV[max(nivel_actual, nivel_nuevo)]

    # Forzar Alta si el acumulado supera 20 kg o si hay material peligroso
    if peso_acumulado > 20 or nuevo_analisis.get("tipo_residuo") == "Peligroso":
        nueva_urgencia = "Alta"

    result = (
        supabase.table("reportes")
        .update({
            "peso_estimado_kg": round(peso_acumulado, 2),
            "urgencia":         nueva_urgencia,
            "tipo_reporte":     "refuerzo",
        })
        .eq("id", reporte_id)
        .execute()
    )
    return result.data[0]
EOF

# ─────────────────────────────────────────────
# routes/__init__.py
# ─────────────────────────────────────────────
touch "$BASE/routes/__init__.py"

# ─────────────────────────────────────────────
# routes/reportes.py
# ─────────────────────────────────────────────
cat > "$BASE/routes/reportes.py" << 'EOF'
from fastapi import APIRouter, HTTPException
from supabase import create_client

from models.schemas import ReporteCreate, ReporteResponse, EstadisticasResponse
from services.gemini_service    import analizar_imagen_reporte, calcular_foto_hash
from services.storage_service   import subir_imagen
from services.agregador_service import (
    calcular_hash_zona,
    calcular_turno,
    resolver_reporte,
    aplicar_refuerzo,
)
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

router   = APIRouter(prefix="/api/reportes", tags=["reportes"])
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


@router.post("/", response_model=ReporteResponse)
async def crear_reporte(body: ReporteCreate):
    foto_hash = calcular_foto_hash(body.image_b64)
    hash_zona = calcular_hash_zona(body.lat, body.lng)
    turno     = calcular_turno()

    # Verificar duplicado / refuerzo ANTES de llamar a Gemini (ahorra quota)
    try:
        tipo_reporte, reporte_id_existente = resolver_reporte(hash_zona, foto_hash)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    # Llamar a Gemini — tiene fallback automático, nunca explota
    analisis, es_fallback = analizar_imagen_reporte(body.image_b64)

    # Subir imagen a Storage — opcional, no bloquea el flujo si falla
    imagen_url = subir_imagen(body.image_b64, carpeta="reportes")

    # ── Caso REFUERZO: acumular sobre reporte existente ─────────────────────
    if tipo_reporte == "refuerzo":
        reporte = aplicar_refuerzo(reporte_id_existente, analisis)
        reporte["modo_fallback"] = es_fallback
        return reporte

    # ── Caso NUEVO: insertar reporte fresco ──────────────────────────────────
    insert_data = {
        "tipo_residuo":        analisis["tipo_residuo"],
        "peso_estimado_kg":    analisis["peso_estimado_kg"],
        "urgencia":            analisis["urgencia"],
        "lat":                 body.lat,
        "lng":                 body.lng,
        "sector":              body.sector,
        "hash_zona":           hash_zona,
        "es_contenedor_lleno": body.es_contenedor_lleno,
        "descripcion_ia":      analisis["descripcion"],
        "confianza_ia":        analisis["confianza"],
        "nivel_obstruccion":   analisis.get("nivel_obstruccion", "libre"),
        "turno_sugerido":      turno,
        "imagen_url":          imagen_url,
        "foto_hash":           foto_hash,
        "accuracy_gps":        body.accuracy_gps,
        "tipo_reporte":        "nuevo",
        "estado":              "pendiente",
    }

    result = supabase.table("reportes").insert(insert_data).execute()
    data = result.data[0]
    data["modo_fallback"] = es_fallback
    return data


@router.get("/", response_model=list[ReporteResponse])
async def listar_reportes(
    sector:   str = None,
    urgencia: str = None,
    estado:   str = None,
    limit:    int = 50,
):
    query = (
        supabase.table("reportes")
        .select("*")
        .order("timestamp", desc=True)
        .limit(limit)
    )
    if sector:   query = query.eq("sector", sector)
    if urgencia: query = query.eq("urgencia", urgencia)
    if estado:   query = query.eq("estado", estado)
    return query.execute().data


@router.patch("/{reporte_id}/estado")
async def actualizar_estado(reporte_id: int, estado: str):
    estados_validos = {"pendiente", "en_ruta", "atendido"}
    if estado not in estados_validos:
        raise HTTPException(
            status_code=400,
            detail=f"Estado inválido. Valores permitidos: {estados_validos}",
        )
    result = (
        supabase.table("reportes")
        .update({"estado": estado})
        .eq("id", reporte_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return result.data[0]


@router.get("/estadisticas/", response_model=EstadisticasResponse)
async def obtener_estadisticas():
    rows = (
        supabase.table("reportes")
        .select("urgencia, estado, peso_estimado_kg")
        .execute()
    ).data
    return {
        "total_reportes": len(rows),
        "kg_totales":     round(sum(r["peso_estimado_kg"] for r in rows), 2),
        "alta_urgencia":  sum(1 for r in rows if r["urgencia"] == "Alta"),
        "media_urgencia": sum(1 for r in rows if r["urgencia"] == "Media"),
        "baja_urgencia":  sum(1 for r in rows if r["urgencia"] == "Baja"),
        "atendidos":      sum(1 for r in rows if r["estado"] == "atendido"),
        "pendientes":     sum(1 for r in rows if r["estado"] == "pendiente"),
        "en_ruta":        sum(1 for r in rows if r["estado"] == "en_ruta"),
    }
EOF

# ─────────────────────────────────────────────
# routes/descargas.py
# ─────────────────────────────────────────────
cat > "$BASE/routes/descargas.py" << 'EOF'
from fastapi import APIRouter
from supabase import create_client

from models.schemas import DescargaCreate, DescargaResponse
from services.gemini_service  import analizar_imagen_descarga
from services.storage_service import subir_imagen
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

router   = APIRouter(prefix="/api/descargas", tags=["descargas"])
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


@router.post("/", response_model=DescargaResponse)
async def registrar_descarga(body: DescargaCreate):
    analisis, es_fallback = analizar_imagen_descarga(body.image_b64)
    imagen_url = subir_imagen(body.image_b64, carpeta="descargas")

    insert_data = {
        "reporte_id":    body.reporte_id,
        "trabajador_id": body.trabajador_id,
        "imagen_url":    imagen_url,
        "pct_organico":  analisis["pct_organico"],
        "pct_plastico":  analisis["pct_plastico"],
        "pct_escombros": analisis["pct_escombros"],
        "pct_mixto":     analisis["pct_mixto"],
        "pct_peligroso": analisis["pct_peligroso"],
        "peso_total_kg": body.peso_total_kg,
        "observacion_ia":analisis["observacion"],
        "confianza_ia":  analisis["confianza"],
    }

    result = supabase.table("descargas").insert(insert_data).execute()
    data = result.data[0]
    data["modo_fallback"] = es_fallback
    return data


@router.get("/", response_model=list[DescargaResponse])
async def listar_descargas(limit: int = 20):
    return (
        supabase.table("descargas")
        .select("*")
        .order("timestamp", desc=True)
        .limit(limit)
        .execute()
    ).data
EOF

# ─────────────────────────────────────────────
# main.py
# ─────────────────────────────────────────────
cat > "$BASE/main.py" << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.reportes  import router as reportes_router
from routes.descargas import router as descargas_router

app = FastAPI(
    title="EcoRuta IA — Clasificación de Residuos",
    version="1.0.0",
    description="Backend del subsistema de clasificación de imágenes con Gemini Vision",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # cambiar a la URL de Vercel antes de producción
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reportes_router)
app.include_router(descargas_router)


@app.get("/")
def health():
    return {
        "status": "ok",
        "service": "EcoRuta IA — Clasificación",
        "endpoints": [
            "POST  /api/reportes/",
            "GET   /api/reportes/",
            "GET   /api/reportes/estadisticas/",
            "PATCH /api/reportes/{id}/estado",
            "POST  /api/descargas/",
            "GET   /api/descargas/",
        ],
    }
EOF

echo ""
echo "✅  Estructura creada correctamente en:"
echo "    $BASE"
echo ""
echo "Archivos generados:"
find "$BASE" -type f | sort
echo ""
echo "──────────────────────────────────────────────────"
echo "PRÓXIMOS PASOS:"
echo ""
echo "1. Abre .env y rellena las 3 credenciales:"
echo "   nano $BASE/.env"
echo ""
echo "2. Instala dependencias:"
echo "   cd $BASE"
echo "   pip install -r requirements.txt"
echo ""
echo "3. Ejecuta el servidor en modo desarrollo:"
echo "   uvicorn main:app --reload"
echo ""
echo "4. Abre el navegador en:"
echo "   http://localhost:8000        -> health check"
echo "   http://localhost:8000/docs   -> Swagger UI (prueba todos los endpoints)"
echo "──────────────────────────────────────────────────"
