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
