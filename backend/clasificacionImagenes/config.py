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
