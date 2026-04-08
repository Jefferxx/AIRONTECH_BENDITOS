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
