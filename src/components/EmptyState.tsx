import React, { useState } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  Sparkles, 
  ShieldCheck, 
  Camera, 
  Gavel, 
  TrendingUp, 
  Layers,
  HelpCircle,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { OcdLogo, OcdSymbol } from './OcdLogo';
import { generateTemplateExcel, parseExcelFile, ParseResult } from '../utils/excelParser';

interface EmptyStateProps {
  onImportSuccess: (result: ParseResult) => void;
  onLoadDemoData: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onImportSuccess,
  onLoadDemoData,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showColumnsGuide, setShowColumnsGuide] = useState(false);

  const handleFile = async (file: File) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelFile(buffer, file.name, [], 'replace');
      onImportSuccess(result);
    } catch (err: unknown) {
      console.error('Error loading Excel:', err);
      const msg = err instanceof Error ? err.message : 'Error al procesar el archivo Excel';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-fade-in">
      
      {/* Hero Welcome Card */}
      <div className="bg-white rounded-3xl border border-[#D5E5ED] shadow-xl overflow-hidden mb-8">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#071D38] via-[#0B2F5B] to-[#0D386B] text-white p-8 md:p-10 relative overflow-hidden">
          {/* Subtle accent background graphics */}
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-[#2B98BA]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <OcdLogo variant="pill" size="md" className="shadow-md" />
              <span className="bg-[#2B98BA]/30 text-[#4AC3E7] font-mono text-xs px-2.5 py-1 rounded-full border border-[#2B98BA]/40 font-bold tracking-wider">
                SISTEMA DE CONTROL COMERCIAL
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight mb-3">
              Auditoría en Campo & Validación de Tareas
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Bienvenido al portal de control operativo de <b>Oeste Centro de Distribución (OCD)</b>. 
              Carga tu reporte en Excel para comenzar a validar la ejecución en puntos de venta, 
              gestionar apelaciones fotográficas y generar métricas por preventista.
            </p>
          </div>
        </div>

        {/* Interactive Excel Dropzone Area */}
        <div className="p-8 md:p-10 bg-[#F8FCFD]">
          
          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs">Error al procesar el archivo Excel</div>
                <div className="text-xs text-rose-700 mt-0.5">{errorMessage}</div>
              </div>
            </div>
          )}

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
            }}
            className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all bg-white shadow-xs ${
              isDragging 
                ? 'border-[#2B98BA] bg-[#EBF7FA] scale-[1.01]' 
                : 'border-[#2B98BA]/40 hover:border-[#2B98BA] hover:shadow-md'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EBF7FA] to-[#D5F0F7] text-[#2B98BA] border border-[#2B98BA]/30 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-[#0B2F5B] mb-1">
              {isLoading ? 'Analizando archivo Excel...' : 'Carga tu archivo Excel de Tareas OCD'}
            </h3>
            
            <p className="text-xs text-slate-500 max-w-lg mx-auto mb-6">
              Arrastra y suelta tu archivo <b>.xlsx</b>, <b>.xls</b> o <b>.csv</b> aquí. 
              El sistema extraerá automáticamente vendedores, supervisores, rutas, fotos y tareas.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <label className="cursor-pointer bg-gradient-to-r from-[#2B98BA] to-[#2183A0] hover:from-[#2183A0] hover:to-[#17657D] text-white font-black text-xs px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Seleccionar Archivo Excel</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleFileInput}
                  disabled={isLoading}
                />
              </label>

              <button
                type="button"
                onClick={generateTemplateExcel}
                className="bg-white border border-[#D5E5ED] hover:bg-[#F2FAFD] text-[#0B2F5B] font-bold text-xs px-5 py-3 rounded-xl transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#2B98BA]" />
                <span>Descargar Plantilla Oficial OCD</span>
              </button>
            </div>

            {/* Quick Demo Loader */}
            <div className="mt-8 pt-6 border-t border-[#EBF3F7] flex items-center justify-center gap-2">
              <span className="text-xs text-slate-400">¿Quieres probar la plataforma primero?</span>
              <button
                type="button"
                onClick={onLoadDemoData}
                className="text-xs font-bold text-[#2B98BA] hover:text-[#0B2F5B] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cargar datos de prueba (Demo)</span>
              </button>
            </div>

          </div>

          {/* Supported Columns Guide Toggle */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowColumnsGuide(!showColumnsGuide)}
              className="text-xs font-bold text-[#0B2F5B] hover:text-[#2B98BA] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-[#2B98BA]" />
              <span>Ver columnas y formato aceptado por el sistema OCD</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showColumnsGuide ? 'rotate-90' : ''}`} />
            </button>

            {showColumnsGuide && (
              <div className="mt-3 p-5 bg-white rounded-xl border border-[#D5E5ED] text-xs text-slate-600 animate-fade-in">
                <div className="font-bold text-[#0B2F5B] mb-2">Columnas detectadas automáticamente en el Excel:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-[#F2FAFD] border border-[#E1EFF5]">
                    <b className="text-[#0B2F5B] block">Vendedor / Preventista</b>
                    <span className="text-slate-500">Ej: Vendedor, Preventista, Ejecutivo</span>
                  </div>
                  <div className="p-2 rounded bg-[#F2FAFD] border border-[#E1EFF5]">
                    <b className="text-[#0B2F5B] block">Supervisor</b>
                    <span className="text-slate-500">Ej: Supervisor, Lider, Jefe</span>
                  </div>
                  <div className="p-2 rounded bg-[#F2FAFD] border border-[#E1EFF5]">
                    <b className="text-[#0B2F5B] block">Ruta / Territorio</b>
                    <span className="text-slate-500">Ej: Ruta, Zona, Circuito</span>
                  </div>
                  <div className="p-2 rounded bg-[#F2FAFD] border border-[#E1EFF5]">
                    <b className="text-[#0B2F5B] block">Punto de Venta (PDV)</b>
                    <span className="text-slate-500">Código y Nombre de Cliente</span>
                  </div>
                  <div className="p-2 rounded bg-[#F2FAFD] border border-[#E1EFF5]">
                    <b className="text-[#0B2F5B] block">Tarea & Categoría</b>
                    <span className="text-slate-500">Heladeras, POP, Góndola, Precios</span>
                  </div>
                  <div className="p-2 rounded bg-[#F2FAFD] border border-[#E1EFF5]">
                    <b className="text-[#0B2F5B] block">Estado de Auditoría</b>
                    <span className="text-slate-500">VALIDADA, INVALIDADA</span>
                  </div>
                  <div className="p-2 rounded bg-[#F2FAFD] border border-[#E1EFF5]">
                    <b className="text-[#0B2F5B] block">Motivo & Detalle</b>
                    <span className="text-slate-500">Causa de rechazo o invalidez</span>
                  </div>
                  <div className="p-2 rounded bg-[#F2FAFD] border border-[#E1EFF5]">
                    <b className="text-[#0B2F5B] block">URL Foto / Evidencia</b>
                    <span className="text-slate-500">Google Drive, Dropbox, Enlace web</span>
                  </div>
                  <div className="p-2 rounded bg-[#F2FAFD] border border-[#E1EFF5]">
                    <b className="text-[#0B2F5B] block">Puntaje Base</b>
                    <span className="text-slate-500">Puntos ponderados de la tarea</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Feature Highlights Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white p-6 rounded-2xl border border-[#D5E5ED] shadow-xs flex items-start gap-4">
          <div className="p-3 bg-[#EBF7FA] text-[#2B98BA] rounded-xl border border-[#2B98BA]/30 shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-[#0B2F5B] uppercase tracking-wider mb-1">
              Visor Fotográfico HD
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Inspecciona fotos de auditoría con zoom, rotación y comparativa lado a lado con el descargo del preventista.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#D5E5ED] shadow-xs flex items-start gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200 shrink-0">
            <Gavel className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-[#0B2F5B] uppercase tracking-wider mb-1">
              Dictámenes de Supervisor
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Aprueba o rechaza apelaciones con restitución automática de puntos en tiempo real para el vendedor.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#D5E5ED] shadow-xs flex items-start gap-4">
          <div className="p-3 bg-[#0B2F5B]/10 text-[#0B2F5B] rounded-xl border border-[#0B2F5B]/20 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-[#0B2F5B] uppercase tracking-wider mb-1">
              Métricas & Pareto OCD
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Analiza principales motivos de rechazo, efectividad por territorio y ranking comercial de preventistas.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
