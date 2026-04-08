import random
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Conexión a Supabase
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def generar_e_inyectar_dataset(total_reportes=100):
    reportes_para_subir = []
    
    # Focos en Riobamba
    focos = [
        {"lat": -1.6570, "lng": -78.6530}, 
        {"lat": -1.6705, "lng": -78.6475}, 
        {"lat": -1.6810, "lng": -78.6410}
    ]

    print(f"Generando {total_reportes} reportes...")

    for i in range(total_reportes):
        es_anomalia = random.random() > 0.85 
        
        if not es_anomalia:
            foco = random.choice(focos)
            lat = foco["lat"] + random.uniform(-0.002, 0.002)
            lng = foco["lng"] + random.uniform(-0.002, 0.002) # Cambiado a lng
            hora = f"{random.randint(6, 22):02d}:00"
            urgencia = random.choice(["Alta", "Media"])
        else:
            lat = round(random.uniform(-1.6800, -1.6500), 5)
            lng = round(random.uniform(-78.6700, -78.6300), 5) # Cambiado a lng
            hora = f"{random.randint(1, 4):02d}:30"
            urgencia = "Baja"

        reportes_para_subir.append({
            "lat": round(lat, 5),
            "lng": round(lng, 5), # Nombre exacto de la tabla de tu compañero
            "hora": hora,
            "urgencia": urgencia,
            "estado": "pendiente",
            "tipo_reporte": "Entrenamiento_IA"
        })

    # Subida masiva a Supabase
    try:
        supabase.table("reportes").insert(reportes_para_subir).execute()
        print(f"✅ ¡Dataset inyectado con éxito en Supabase!")
    except Exception as e:
        print(f"❌ Error al subir: {e}")

generar_e_inyectar_dataset(100)