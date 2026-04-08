"use client";

import { useState } from "react";
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

  return (
    <div className="p-4 md:p-8 flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Título usando la clase semántica .h1 del global.css */}
      <h1 className="h1 text-center text-foreground">
        Clasificación de Residuos
      </h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sección de la Cámara / Visualizador */}
        <div className="md:w-1/2 h-64 md:h-[450px] bg-muted border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center transition-colors hover:bg-accent/50 group">
          <div className="flex flex-col items-center gap-2">
            {/* Usamos el color brand-1 para el icono o texto de estado */}
            <div className="w-12 h-12 rounded-full bg-brand-1/10 flex items-center justify-center">
               <div className="w-3 h-3 rounded-full bg-brand-1 animate-pulse" />
            </div>
            <span className="small text-muted-foreground group-hover:text-brand-1 transition-colors">
              Esperando señal de cámara...
            </span>
          </div>
        </div>

        {/* Sección de información (Card) */}
        <Card className="md:w-1/2 border-border shadow-sm">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <CardTitle className="h3 text-brand-1">
              Detalle de Clasificación
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex flex-col gap-6 pt-6">
            <div className="space-y-1">
              <p className="xs uppercase tracking-wider text-muted-foreground font-semibold">Tipo de Residuo</p>
              <p className="h2 text-foreground">{result.type}</p>
            </div>

            <div className="space-y-1">
              <p className="xs uppercase tracking-wider text-muted-foreground font-semibold">Nivel de Confianza</p>
              <div className="flex items-center gap-3">
                {/* Barra de progreso simple con el color de marca */}
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
              <p className="body text-foreground italic">
                "{result.description}"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}