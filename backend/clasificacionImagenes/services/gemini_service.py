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
