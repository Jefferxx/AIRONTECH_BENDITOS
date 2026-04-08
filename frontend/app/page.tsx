'use client';
import React, { useState, useRef, useEffect } from 'react';
import { 
  Recycle, 
  Bell, 
  User, 
  Map as MapIcon, 
  Truck, 
  BarChart3, 
  Settings, 
  LogOut, 
  HelpCircle, 
  PlusCircle, 
  History, 
  Camera, 
  Navigation, 
  Sparkles, 
  Brain, 
  Trash2, 
  Weight, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Search, 
  Filter, 
  Download, 
  TrendingUp, 
  ShieldCheck, 
  Upload, 
  FileCheck, 
  ArrowRightLeft,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '../utils/supabase/client';


// --- Types ---
type View = 'landing' | 'citizen' | 'worker' | 'admin' | 'supervisor';

// --- Components ---

const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  onClick 
}: { 
  children: React.ReactNode, 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error' | 'tertiary',
  className?: string,
  onClick?: () => void
}) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-container shadow-md',
    secondary: 'bg-secondary text-white hover:bg-secondary-container',
    outline: 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-low',
    ghost: 'text-on-surface-variant hover:bg-surface-container-low',
    error: 'bg-error text-white hover:bg-error/90',
    tertiary: 'bg-tertiary text-white hover:bg-tertiary/90'
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};

// --- Views ---

const LandingView = ({ onLogin }: { onLogin: (view: View) => void }) => {
  // Estados para el formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // Autenticación real con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg('Credenciales incorrectas. Intenta de nuevo.');
      setLoading(false);
    } else {
      // ¡Éxito! Entramos a la vista de ciudadano por defecto
      onLogin('citizen');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Column (Se mantiene igual) */}
      <section className="relative w-full md:w-3/5 min-h-[512px] md:min-h-screen flex items-center justify-center p-8 md:p-16 overflow-hidden">
        <div className="absolute inset-0 bg-primary/90 z-0" />
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB55fhGRifBkz4322ThKNUP47I_RTPQRGJutHN1WD9Gf-5eVJBJ056IqKb1O67pvOwwBQysOb49IebqUs-ndAXkHq0FYfYb1pqvauMn80oZaq27hIzk0y6W7IVVM9wazg8DIxRAg-TDRMhxdDvxyJfVkdyjtBq4Vu6PFYSS0HyCDhyBnJCG2drLdZBzb_QsXaW3Gw2O6wYaNxlSTwXcGKUZkaYF2u4PQIakJTKQ2PkTuJ79DGeQ4fAAK9P9vCjA8eVC5rdUYdBP8kJS" 
          alt="Riobamba" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 z-0"
          referrerPolicy="no-referrer"
        />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
              <Recycle className="text-white w-8 h-8" />
            </div>
            <span className="font-headline font-extrabold text-3xl text-white tracking-tight">EcoRuta IA</span>
          </div>
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tighter">
            Gestión inteligente de residuos para Riobamba
          </h1>
          <p className="text-white/80 text-lg md:text-xl font-medium max-w-xl mb-12 leading-relaxed">
            Optimizando la logística urbana mediante inteligencia artificial para una ciudad más limpia, eficiente y sostenible.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: <PlusCircle />, title: "Active Citizens", desc: "Participación ciudadana activa en tiempo real." },
              { icon: <Navigation />, title: "Optimized Routes", desc: "Ahorro del 30% en combustible y emisiones." },
              { icon: <Brain />, title: "Real-time AI", desc: "Monitoreo predictivo constante de la flota." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/10"
              >
                <div className="text-primary-fixed mb-4">{item.icon}</div>
                <h3 className="font-headline text-white font-bold text-sm mb-1 uppercase tracking-wider">{item.title}</h3>
                <p className="text-white/60 text-xs">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Right Column (Formulario de Login Actualizado) */}
      <section className="w-full md:w-2/5 flex flex-col justify-center bg-surface-container-low px-8 py-16 md:px-16">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-10">
            <h2 className="font-headline text-3xl font-extrabold text-on-surface mb-2">Bienvenido</h2>
            <p className="text-on-surface-variant font-medium">Ingresa a la plataforma de gestión municipal.</p>
          </div>
          
          <form className="space-y-6 mb-12" onSubmit={handleLogin}>
            <div>
              <label className="block font-label text-sm font-bold text-on-surface mb-2">Correo Electrónico</label>
              <input 
                className="w-full bg-surface-container-lowest border-none rounded-lg p-4 text-on-surface placeholder:text-outline shadow-sm focus:ring-2 focus:ring-primary" 
                placeholder="ejemplo@riobamba.gob.ec" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-label text-sm font-bold text-on-surface mb-2">Contraseña</label>
              <input 
                className="w-full bg-surface-container-lowest border-none rounded-lg p-4 text-on-surface placeholder:text-outline shadow-sm focus:ring-2 focus:ring-primary" 
                placeholder="••••••••" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {/* Mensaje de error dinámico */}
            {errorMsg && <p className="text-error text-sm font-bold animate-pulse">{errorMsg}</p>}
            
            <Button className="w-full py-4 text-lg" onClick={() => {}}>
              {loading ? 'Verificando...' : 'Ingresar'}
            </Button>
          </form>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-outline-variant opacity-20"></span></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold text-outline">
              <span className="bg-surface-container-low px-4">Acceso Rápido Demo (Hackathon)</span>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { view: 'citizen', title: 'Ver como Ciudadano', desc: 'Reportes y horarios de recolección', icon: <User className="text-secondary" />, bg: 'bg-secondary-container/20' },
              { view: 'worker', title: 'Ver como Trabajador', desc: 'Rutas asignadas y navegación IA', icon: <Truck className="text-tertiary" />, bg: 'bg-tertiary-container/20' },
              { view: 'admin', title: 'Ver como Administrador', desc: 'Control total y analítica de datos', icon: <ShieldCheck className="text-primary" />, bg: 'bg-primary-container/20' }
            ].map((item) => (
              <button 
                key={item.view}
                type="button"
                onClick={() => onLogin(item.view as View)}
                className="w-full flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary-fixed-dim/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                    {item.icon}
                  </div>
                  <div className="text-left">
                    <p className="font-headline font-bold text-on-surface text-sm">{item.title}</p>
                    <p className="text-xs text-on-surface-variant">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="text-outline group-hover:text-primary transition-transform group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const CitizenView = () => {
  // --- REFERENCIAS DE LA CÁMARA ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // --- ESTADOS ---
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [sector, setSector] = useState('La Condamine');
  const [descripcion, setDescripcion] = useState('');
  const [estaLleno, setEstaLleno] = useState(false);
  const [cargandoIA, setCargandoIA] = useState(false);
  const [resultadoBackend, setResultadoBackend] = useState<any>(null);

  // --- ENCENDER LA CÁMARA AL ENTRAR A ESTA VISTA ---
  useEffect(() => {
    async function activarCamara() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (err) {
        console.error("Error cámara:", err);
      }
    }
    activarCamara();
    return () => { // Apagar cámara al salir
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  // --- LA MAGIA: TOMAR FOTO + GPS + BACKEND ---
  const enviarReporteBackend = async () => {
    if (!videoRef.current || !canvasRef.current) return alert("Cámara no lista");
    
    setCargandoIA(true);

    // 1. Capturamos la foto de la cámara en vivo
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);
    // Comprimimos la foto al 30% de calidad para que no reviente el servidor
    const base64Capturado = canvasRef.current.toDataURL('image/jpeg', 0.3);
    setFotoBase64(base64Capturado); // Mostramos la foto congelada

    // 2. Sacamos GPS y mandamos al Backend
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const respuesta = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_CLASIFICACION}/api/reportes/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fotoBase64: base64Capturado,
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
            calle: sector
          })
        });

        const data = await respuesta.json();

        if (data.success) {
           setResultadoBackend(data); // Mostramos la tarjeta de éxito
           setDescripcion('');
           setEstaLleno(false);
        } else {
           alert("❌ Error del servidor: " + data.error);
        }
      } catch (error) {
        alert("❌ Error de red al contactar al servidor.");
      } finally {
        setCargandoIA(false);
      }
    }, (error) => {
      alert("⚠️ Activa el GPS para reportar.");
      setCargandoIA(false);
    }, { enableHighAccuracy: true });
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-24 space-y-6">
      <header className="mt-4">
        <h1 className="text-2xl font-headline font-extrabold tracking-tight text-primary">Reportar Incidencia</h1>
        <p className="text-sm text-on-surface-variant">Captura en vivo y triangulación GPS.</p>
      </header>

      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm space-y-5">
        
        {/* LA CÁMARA REAL INYECTADA EN EL DISEÑO */}
        <div className="relative group">
          <div className="border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center bg-black transition-colors aspect-video overflow-hidden relative">
            {!fotoBase64 ? (
               <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            ) : (
               <img src={fotoBase64} alt="Captura" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          {fotoBase64 && (
            <button onClick={() => setFotoBase64(null)} className="mt-2 text-xs text-primary font-bold w-full text-center">
              🔄 Tomar otra foto
            </button>
          )}
        </div>

        {/* FORMULARIO */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold font-label uppercase tracking-wider text-outline">Sector de Riobamba</label>
            <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full bg-surface-container-low border-none rounded-lg text-sm p-3">
              <option>La Condamine</option>
              <option>Centro Histórico</option>
              <option>Lizarzaburu</option>
              <option>Terminal Terrestre</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold font-label uppercase tracking-wider text-outline">Descripción (Opcional)</label>
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full bg-surface-container-low border-none rounded-lg text-sm p-3 h-20" placeholder="Detalla el problema..."></textarea>
          </div>
        </div>

        {/* BOTONES */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline"><Navigation className="w-4 h-4" /> GPS Activo</Button>
          <Button variant="primary" onClick={enviarReporteBackend}>
            <Sparkles className="w-4 h-4" /> 
            {cargandoIA ? 'Procesando...' : 'Tomar Foto y Analizar'}
          </Button>
        </div>
      </div>

      {/* RESULTADO DINÁMICO DEL BACKEND */}
      {resultadoBackend && (
        <div className="bg-white rounded-xl p-5 shadow-lg border-l-4 border-primary animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Reporte Confirmado</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-label text-outline uppercase">IA Detectó:</span>
              <span className="text-lg font-headline font-bold text-gray-800">{resultadoBackend.analisisIA}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-surface-container-low p-3 rounded-lg">
                <p className="text-[10px] font-label text-outline uppercase">Camión Asignado</p>
                <p className="text-sm font-bold font-label text-primary">{resultadoBackend.asignacion.camionAsignado}</p>
              </div>
              <div className="bg-surface-container-low p-3 rounded-lg">
                <p className="text-[10px] font-label text-outline uppercase">Distancia GPS</p>
                <p className="text-sm font-bold font-label">{resultadoBackend.asignacion.distanciaKm} km</p>
              </div>
            </div>
            
            <p className="text-xs text-on-surface-variant italic mt-2">
              Datos guardados en Supabase. {resultadoBackend.asignacion.mensajeRuta}
            </p>
          </div>
        </div>
      )}
      
    </div>
  );
};

const WorkerView = () => {
  const [tareas, setTareas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // --- CONEXIÓN DIRECTA A SUPABASE (Hackathon Mode) ---
  useEffect(() => {
    const cargarTareas = async () => {
      try {
        const supabaseUrl = 'https://qwngrubkuakuuvhilvmi.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3bmdydWJrdWFrdXV2aGlsdm1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY1ODUyMCwiZXhwIjoyMDkxMjM0NTIwfQ.RzEqPzl_W71IqKuIFa7Y1R7_1WmV_gPWGfomExqOZU4';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Traemos todos los reportes ordenados por los más recientes
        const { data, error } = await supabase
          .from('reportes')
          .select('*')
          .order('timestamp', { ascending: false });

        if (error) throw error;
        setTareas(data || []);
      } catch (error) {
        console.error("Error cargando tareas:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarTareas();
  }, []);

  return (
    <div className="max-w-md mx-auto pb-24 space-y-6 pt-4">
      <section className="px-6 py-4 bg-surface-container-low rounded-xl mx-4 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-on-surface-variant font-label text-xs uppercase tracking-widest mb-1">Operativo en curso</p>
            <h1 className="text-2xl font-extrabold text-on-surface leading-tight tracking-tight font-headline">Ruta Sur — RG-402</h1>
          </div>
          <div className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-3 py-1 rounded-sm text-xs font-bold font-label flex items-center gap-1">
            <Truck className="w-4 h-4" /> Activo
          </div>
        </div>
      </section>

      <section className="px-4 space-y-4">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-on-surface-variant font-label text-xs uppercase tracking-widest font-bold">
            Tareas Pendientes ({tareas.length})
          </h2>
          <button className="text-xs text-primary font-bold">Actualizar GPS</button>
        </div>
        
        {cargando ? (
          <p className="text-center text-sm text-gray-500 py-10">Sincronizando ruta...</p>
        ) : tareas.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-10">No hay reportes asignados.</p>
        ) : (
          tareas.map((tarea, index) => (
            <div key={tarea.id || index} className={`bg-surface-container-lowest rounded-xl shadow-sm border-l-4 overflow-hidden mb-4 ${tarea.urgencia === 'Alta' ? 'border-error' : 'border-primary'}`}>
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-label text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter block mb-1">
                      Reporte #{tarea.id || 'Nuevo'}
                    </span>
                    <h3 className="font-headline font-extrabold text-lg leading-none">{tarea.sector}</h3>
                  </div>
                  <span className={`${tarea.urgencia === 'Alta' ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container'} px-2 py-0.5 rounded-sm text-[10px] font-bold font-label uppercase`}>
                    Urgencia: {tarea.urgencia || 'Media'}
                  </span>
                </div>

                {/* FOTO QUE TOMÓ EL CIUDADANO */}
                {tarea.imagen_url && (
                  <div className="w-full h-32 mb-4 rounded-lg overflow-hidden border border-gray-200">
                    <img src={tarea.imagen_url} alt="Reporte" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Trash2 className="text-primary w-5 h-5" />
                    <div>
                      <p className="text-[10px] text-on-surface-variant font-medium">Tipo (IA)</p>
                      <p className="text-sm font-bold truncate">{tarea.tipo_residuo || 'No clasificado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Weight className="text-primary w-5 h-5" />
                    <div>
                      <p className="text-[10px] text-on-surface-variant font-medium">Est. KG</p>
                      <p className="text-sm font-bold font-label">{tarea.peso_estimado_kg || 0} kg</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 mb-4 bg-surface-container-low p-2 rounded-lg">
                  <MapIcon className="text-on-surface-variant w-4 h-4 mt-0.5" />
                  <p className="text-xs text-on-surface-variant leading-snug">
                    Coords: {tarea.lat ? tarea.lat.toFixed(4) : 'N/A'}, {tarea.lng ? tarea.lng.toFixed(4) : 'N/A'}
                  </p>
                </div>
                
                <Button className="w-full py-3">
                  <CheckCircle2 className="w-4 h-4" /> Marcar como recolectado
                </Button>
                {/* Coordenadas actuales (puedes dejarlo o borrarlo, pero abajo van los botones) */}
                <div className="flex items-start gap-2 mb-4 bg-surface-container-low p-2 rounded-lg">
                  <MapIcon className="text-on-surface-variant w-4 h-4 mt-0.5" />
                  <p className="text-xs text-on-surface-variant leading-snug">
                    Coords: {tarea.lat ? tarea.lat.toFixed(4) : 'N/A'}, {tarea.lng ? tarea.lng.toFixed(4) : 'N/A'}
                  </p>
                </div>
                
                {/* 👇 NUEVOS BOTONES DE ACCIÓN (NAVEGAR Y RECOLECTAR) 👇 */}
                <div className="flex flex-col gap-2 mt-4">
                  <Button 
                    variant="outline"
                    className="w-full py-3 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 flex justify-center items-center gap-2"
                    onClick={() => {
                      // Esto abre Google Maps en una nueva pestaña con la ruta en auto
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${tarea.lat},${tarea.lng}&travelmode=driving`, '_blank');
                    }}
                  >
                    <Navigation className="w-4 h-4" /> Iniciar Ruta en Google Maps
                  </Button>

                  <Button className="w-full py-3 bg-black text-white flex justify-center items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Marcar como recolectado
                  </Button>
                </div>
                {/* 👆 FIN NUEVOS BOTONES 👆 */}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

const AdminView = () => {
  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface-container-low py-6 px-4 gap-4 border-r border-outline-variant/20">
        <div className="flex items-center gap-3 px-2 mb-6">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyaig8iqLfrDbaED4iPbUYCFLw8vje9nF9IsHHvyUb67ugtsfXwacjSDmiZrU1jmHeanAWUMoh9TKgiX_1If-q1IBaMRXJgfBzP-gsU3RQPkhq3_S-Lf6mdyHo7gHUwKEDu6rumSJtI_2a16R6AQ1OhmRjl6T0ji3pqxNgygEVmkxfoLpVhUuSslpK65NFIDCcCwaMFMPHo0Hw1PGdeWR1-O2GGf818hQFhbsdhI8VwM-Oo23oLZYeXp4hcSvOV9TTd3Ou2HaM-rg3" 
            alt="Crest" 
            className="w-10 h-10 object-contain"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-lg font-bold text-on-surface font-headline tracking-tight">GAD Riobamba</h1>
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Gestión de Desechos</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 flex-grow">
          {[
            { icon: <MapIcon />, label: 'Monitoreo', active: true },
            { icon: <Truck />, label: 'Flota' },
            { icon: <User />, label: 'Ciudadanos' },
            { icon: <BarChart3 />, label: 'Reportes' },
            { icon: <Settings />, label: 'Ajustes' }
          ].map((item, i) => (
            <a 
              key={i}
              href="#" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${item.active ? 'bg-white text-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              <div className="w-5 h-5">{item.icon}</div>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-outline-variant/20 space-y-2">
          <Button className="w-full py-2.5"><Sparkles className="w-4 h-4" /> Nueva Ruta IA</Button>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-high"><HelpCircle className="w-5 h-5" /> Ayuda</a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-error hover:bg-error-container/20"><LogOut className="w-5 h-5" /> Salir</a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-extrabold text-primary font-headline tracking-tight">EcoRuta IA</h2>
            <div className="h-6 w-px bg-outline-variant/30" />
            <div className="bg-surface-container-low px-3 py-1.5 rounded-lg flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold font-label">ADMINISTRADOR CENTRAL</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors"><Bell className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-xs font-bold">Citizen Admin</p>
                <p className="text-[10px] opacity-60">Riobamba, EC</p>
              </div>
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuANhy_EcxB2g81P5VCqiBAqdMDTr40UJThiq9hk2AF18JqFcHljmruXtBl3bxjhk9QNRnJnHdPRx_kiP6nbxFnlKLhvDmkIF-kdb5YnhfbCIEwT9ThrD5IGu0kxXKRiQEdyY4mJXP39BwHf00HK1le5JZpkm4UCc1EYXeF5WwdUlNLq6qBwH8I7j3XJbeuAnnXkAwAAExeWk4pvgnTMf5Jmd4yUTc5Mwk2YUkDyo7S4ZcgnLFGlM18XGCNw11qV08ME14xr8bYF97cL" 
                alt="Admin" 
                className="w-9 h-9 rounded-full bg-primary-container"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Reportes', val: '5', trend: '+12%', color: 'border-primary', sub: 'Últimas 24 horas' },
            { label: 'KG Totales', val: '75.8', trend: '', color: 'border-tertiary', sub: 'Capacidad actual acumulada' },
            { label: 'Alta Urgencia', val: '3', trend: '!', color: 'border-error', sub: 'Requieren despacho inmediato' },
            { label: 'Pendientes', val: '3', trend: '', color: 'border-outline', sub: 'En cola de procesamiento' }
          ].map((card, i) => (
            <div key={i} className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${card.color} flex flex-col gap-1`}>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">{card.label}</p>
              <div className="flex items-baseline gap-2">
                <h3 className={`text-4xl font-extrabold font-headline ${card.trend === '!' ? 'text-error' : 'text-on-surface'}`}>{card.val}</h3>
                {card.trend && <span className="text-secondary text-xs font-bold flex items-center"><TrendingUp className="w-3 h-3" /> {card.trend}</span>}
              </div>
              <p className="text-[10px] text-outline mt-2">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-surface-container-low rounded-xl overflow-hidden relative min-h-[500px]">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpn_c7gdwc9lHmIPLoGWJEKngAN9P3AiDysN2Qx_hr6XiqTb0Bb0J6G_dMGGeZBSwmm9oDgQwoU3b4K1eLvtz5kEVAR9VYAdPuchdEQ2o09SuaPQ-LQz7Lq-_xWR4kuESOusihj-ipWcVRqVvYGxtCUS4qQhytTjKl1sI9M2T43edRtcZ6g-bXvxEcSQ-_7q43eVsiQkZ-8Ns2POpd0BlysGigUDYiBR-R13QJotMJjIhBXWHleKUHDPkIWfLtODqcXPuOaS9NJeXD" 
              alt="Map" 
              className="w-full h-full object-cover grayscale-[0.3]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className="bg-white/80 backdrop-blur-md p-2 rounded-lg shadow-xl flex flex-col gap-2">
                <button className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md"><PlusCircle className="w-4 h-4" /></button>
                <div className="h-px bg-outline-variant/30" />
                <button className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-lg border border-white/20">
              <p className="text-[10px] font-bold font-label uppercase text-on-surface-variant mb-1">Leyenda de Estado</p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-error"></div> <span className="text-[10px] font-medium">Urgente</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-tertiary"></div> <span className="text-[10px] font-medium">Medio</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary"></div> <span className="text-[10px] font-medium">Normal</span></div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-base font-bold font-headline flex items-center gap-2"><Navigation className="w-4 h-4 text-primary" /> Rutas Priorizadas</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-md">AUTO-IA</span>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
              {[
                { zone: 'SUR - TERMINAL', status: 'ALTA', unit: 'Unidad #042', op: 'J. Paredes', weight: '15.5 kg', color: 'border-error' },
                { zone: 'CENTRO - CALLE 10', status: 'ALTA', unit: 'Unidad #015', op: 'M. Altamirano', weight: '22.3 kg', color: 'border-error' },
                { zone: 'NORTE - SABOYA', status: 'MEDIA', unit: 'Unidad #088', op: 'L. Castro', weight: '12.0 kg', color: 'border-tertiary/50' }
              ].map((route, i) => (
                <div key={i} className={`bg-white p-4 rounded-lg shadow-sm border-l-2 ${route.color} hover:shadow-md transition-shadow`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-on-surface-variant font-label">ZONA: {route.zone}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm ${route.status === 'ALTA' ? 'bg-error-container text-on-error-container' : 'bg-tertiary-fixed text-on-tertiary-fixed-variant'}`}>{route.status}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-bold font-headline">{route.unit}</p>
                      <p className="text-[10px] text-outline">Operador: {route.op}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-label">{route.weight}</p>
                      <button className="text-xs text-primary font-bold hover:underline">Ver detalles</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-auto w-full py-3 text-xs uppercase tracking-widest">Gestionar todas las rutas</Button>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-lg font-bold font-headline">Historial de Reportes en Tiempo Real</h4>
              <p className="text-xs text-on-surface-variant">Monitoreo ciudadano y sensores de recolección</p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 border border-outline-variant/30 rounded-lg hover:bg-white"><Filter className="w-4 h-4" /></button>
              <button className="p-2 border border-outline-variant/30 rounded-lg hover:bg-white"><Download className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest font-bold text-outline">
                  <th className="px-4 pb-2">Sector</th>
                  <th className="px-4 pb-2">Tipo de Residuo</th>
                  <th className="px-4 pb-2 text-right">Peso (KG)</th>
                  <th className="px-4 pb-2">Urgencia</th>
                  <th className="px-4 pb-2">Estado</th>
                  <th className="px-4 pb-2 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { sector: 'Terminal Terrestre', sub: 'Av. 10 de Agosto', type: 'Orgánicos', weight: '15.5', urg: 'CRÍTICA', status: 'Sin asignar', time: '10:45 AM', color: 'border-error' },
                  { sector: 'Parque 21 de Abril', sub: 'Loma a Quito', type: 'Plásticos', weight: '22.3', urg: 'CRÍTICA', status: 'En Ruta', time: '10:32 AM', color: 'border-error' },
                  { sector: 'Mercado San Alfonso', sub: 'Calle Chile', type: 'Mixtos', weight: '18.0', urg: 'MEDIA', status: 'Sin asignar', time: '10:15 AM', color: 'border-tertiary' }
                ].map((row, i) => (
                  <tr key={i} className="bg-white hover:bg-surface-container-high transition-colors group cursor-pointer">
                    <td className={`px-4 py-4 rounded-l-lg border-l-2 ${row.color}`}>
                      <span className="text-sm font-bold">{row.sector}</span>
                      <p className="text-[10px] opacity-60">{row.sub}</p>
                    </td>
                    <td className="px-4 py-4"><span className="text-xs font-medium px-2 py-1 bg-surface rounded-md">{row.type}</span></td>
                    <td className="px-4 py-4 text-right font-label font-bold text-sm">{row.weight}</td>
                    <td className="px-4 py-4"><span className={`text-[10px] font-black px-2 py-0.5 rounded-sm ${row.urg === 'CRÍTICA' ? 'bg-error-container text-on-error-container' : 'bg-tertiary-fixed text-on-tertiary-fixed-variant'}`}>{row.urg}</span></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${row.status === 'Sin asignar' ? 'bg-error' : 'bg-secondary'}`}></div>
                        <span className="text-xs font-bold">{row.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 rounded-r-lg text-right font-label text-[10px] opacity-60">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

const SupervisorView = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10 space-y-8">
      <header className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Clasificación en Descarga</h1>
            <p className="text-on-surface-variant">Auditoría de composición de residuos mediante Inteligencia Artificial en tiempo real.</p>
          </div>
          <div className="bg-surface-container-low p-1 rounded-xl flex gap-1">
            <button className="px-4 py-2 rounded-lg bg-white shadow-sm text-sm font-bold text-primary">Planta Central</button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-variant/50 transition-colors">Celda Norte</button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <section className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-primary">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Camera className="text-primary w-6 h-6" />
                <h2 className="text-xl font-bold">Captura de Contenido</h2>
              </div>
              <span className="font-label text-sm bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-sm font-bold">ACTIVO: CAM_042</span>
            </div>
            <div className="aspect-video bg-surface-container-high rounded-xl overflow-hidden relative group border-2 border-dashed border-outline-variant">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTGFFTZdWj7m4pOjD1R2EfCpwwa5Zagx1716iT1gdGIpuG3FvaP8Y7jcAIaEmoKNCcfS4bOLY1xKoeTx9QMWA8M4fxg5l5AH_hbIVpgZVOG1U8HpiW3bzoc7HXjRFHxKehcFCM70KMMFUt0Fup7O58XBnL54NVgw5KKY0215HwJSdrLafBxY8niNCD8jf2YXlmN12ivNUphQmXPJoQhlGxeCxFzHeVwnkW4dyeeDFUrzlrtB_3_mCjOkIe4thanji4VNmJrhpWWMl3" 
                alt="Discharge" 
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button variant="primary"><Sparkles className="w-5 h-5" /> Analizar con IA</Button>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Información del Manifiesto</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium opacity-60 mb-1 block">Peso Total Bruto (kg)</label>
                <div className="flex items-center gap-2">
                  <input className="w-full border-none bg-surface-container-low rounded-lg p-3 font-bold text-lg" type="number" defaultValue="4250" />
                  <span className="font-bold opacity-40">KG</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium opacity-60 mb-1 block">ID Camión / Placa</label>
                <input className="w-full border-none bg-surface-container-low rounded-lg p-3 font-bold uppercase" type="text" defaultValue="RI-0244-TR" />
              </div>
            </div>
            <div className="bg-tertiary-fixed/30 p-4 rounded-xl border border-tertiary-fixed">
              <p className="text-sm text-on-tertiary-fixed-variant italic">"Se detecta alta concentración de material orgánico húmedo. Presencia de residuos plásticos tipo PET por encima del umbral promedio."</p>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><BarChart3 className="text-primary w-6 h-6" /> Composición Detectada</h2>
            <div className="space-y-6 mb-8">
              {[
                { label: 'Residuos Orgánicos', val: 45.2, color: 'bg-primary' },
                { label: 'Plásticos (PET/PEAD)', val: 28.7, color: 'bg-tertiary' },
                { label: 'Papel y Cartón', val: 15.1, color: 'bg-secondary' },
                { label: 'Otros / No Clasificados', val: 11.0, color: 'bg-outline' }
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold">{item.label}</span>
                    <span className="font-bold text-primary">{item.val}%</span>
                  </div>
                  <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                    <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-surface-container-low p-6 rounded-xl flex items-center justify-around">
              <div className="text-center">
                <p className="text-xs uppercase font-bold opacity-50 mb-1">Volumen</p>
                <p className="text-2xl font-black">12.4 <span className="text-xs">m³</span></p>
              </div>
              <div className="w-px h-10 bg-outline-variant/30"></div>
              <div className="text-center">
                <p className="text-xs uppercase font-bold opacity-50 mb-1">Confianza IA</p>
                <p className="text-2xl font-black text-primary">98.2%</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm border border-primary/10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-primary-fixed text-on-primary-fixed-variant rounded-full"><FileCheck className="w-8 h-8" /></div>
              <div>
                <h3 className="text-lg font-bold">Listo para Registro</h3>
                <p className="text-sm opacity-70">Todos los campos obligatorios han sido validados.</p>
              </div>
            </div>
            <Button className="w-full py-5 text-xl"><CheckCircle2 className="w-6 h-6" /> Registrar descarga</Button>
          </section>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<View>('landing');

  const renderView = () => {
    switch (view) {
      case 'landing': return <LandingView onLogin={setView} />;
      case 'citizen': return <CitizenView />;
      case 'worker': return <WorkerView />;
      case 'admin': return <AdminView />;
      case 'supervisor': return <SupervisorView />;
      default: return <LandingView onLogin={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Global Header (except landing) */}
      {view !== 'landing' && (
        <header className="flex justify-between items-center w-full px-6 py-3 sticky top-0 z-50 backdrop-blur-md bg-white/80 shadow-sm font-headline">
          <div className="text-xl font-extrabold text-primary flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
            <Recycle className="w-6 h-6" />
            <span>EcoRuta IA</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-6">
              <button onClick={() => setView('admin')} className={`text-sm font-medium ${view === 'admin' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>Admin</button>
              <button onClick={() => setView('worker')} className={`text-sm font-medium ${view === 'worker' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>Worker</button>
              <button onClick={() => setView('citizen')} className={`text-sm font-medium ${view === 'citizen' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>Citizen</button>
              <button onClick={() => setView('supervisor')} className={`text-sm font-medium ${view === 'supervisor' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>Supervisor</button>
            </div>
            <Bell className="w-5 h-5 text-on-surface-variant cursor-pointer" />
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white font-bold cursor-pointer">
              <User className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-primary to-primary-container h-1 w-full absolute bottom-0 left-0"></div>
        </header>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>

      {/* Mobile Bottom Nav (Citizen/Worker/Supervisor) */}
      {['citizen', 'worker', 'supervisor'].includes(view) && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-outline-variant/10 px-6 py-2 flex justify-between items-center z-50">
          <button className={`flex flex-col items-center gap-1 p-2 ${view === 'citizen' ? 'text-primary' : 'text-outline'}`} onClick={() => setView('citizen')}>
            <PlusCircle className="w-6 h-6" />
            <span className="text-[10px] font-bold">Reportar</span>
          </button>
          <button className={`flex flex-col items-center gap-1 p-2 ${view === 'worker' ? 'text-primary' : 'text-outline'}`} onClick={() => setView('worker')}>
            <MapIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Mapa</span>
          </button>
          <button className={`flex flex-col items-center gap-1 p-2 ${view === 'supervisor' ? 'text-primary' : 'text-outline'}`} onClick={() => setView('supervisor')}>
            <History className="w-6 h-6" />
            <span className="text-[10px] font-medium">Historial</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 text-outline">
            <User className="w-6 h-6" />
            <span className="text-[10px] font-medium">Perfil</span>
          </button>
        </nav>
      )}
    </div>
  );
}