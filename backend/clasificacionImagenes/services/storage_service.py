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
