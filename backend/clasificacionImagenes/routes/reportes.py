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
