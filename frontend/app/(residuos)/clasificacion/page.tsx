"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClassificationResult {
  type: string;
  confidence: number;
  description: string;
}

export default function WasteClassificationPage() {
  const [result, setResult] = useState<ClassificationResult>({
    type: "Plástico",
    confidence: 0.92,
    description: "Este residuo es plástico PET, reciclable en contenedores amarillos."
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const IP_CAM_URL = "http://172.25.221.29:8080/video";

  useEffect(() => {
    const interval = setInterval(() => {
      if (!imgRef.current || !canvasRef.current) return;

      const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      // Dibuja la imagen actual en el canvas
      ctx.drawImage(imgRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      // Extrae los datos si quieres procesarlos
      const frame = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      // frame.data → array RGBA que puedes enviar a tu modelo
    }, 100); // ~10 FPS

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 md:p-8 flex flex-col gap-8 max-w-6xl mx-auto">
      <h1 className="h1 text-center text-foreground">Clasificación de Residuos</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Cámara IP */}
        <div className="md:w-1/2 h-64 md:h-[450px] bg-muted border-2 border-dashed border-border rounded-2xl flex items-center justify-center overflow-hidden">
          {/* Imagen MJPEG de IP Webcam */}
          <img
            ref={imgRef}
            src={IP_CAM_URL}
            alt="Cámara IP"
            className="hidden"
            crossOrigin="anonymous"
          />
          {/* Canvas donde se dibuja la imagen */}
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Sección de información */}
        <Card className="md:w-1/2 border-border shadow-sm">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <CardTitle className="h3 text-brand-1">Detalle de Clasificación</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-6 pt-6">
            <div className="space-y-1">
              <p className="xs uppercase tracking-wider text-muted-foreground font-semibold">Tipo de Residuo</p>
              <p className="h2 text-foreground">{result.type}</p>
            </div>

            <div className="space-y-1">
              <p className="xs uppercase tracking-wider text-muted-foreground font-semibold">Nivel de Confianza</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-1 transition-all duration-500" 
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
                <p className="body font-bold text-brand-1">
                  {(result.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-xl border border-border">
              <p className="xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Recomendación</p>
              <p className="body text-foreground italic">"{result.description}"</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}