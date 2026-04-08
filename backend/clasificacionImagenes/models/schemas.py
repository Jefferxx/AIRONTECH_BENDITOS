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
