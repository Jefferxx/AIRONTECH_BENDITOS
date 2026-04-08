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
