import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  RefreshCw,
  Info,
  Users,
  MapPin,
  Building2,
  Trash2
} from 'lucide-react';
import { TaskRecord, ImportBatch } from '../types';
import { parseExcelFile, generateTemplateExcel, ParseResult } from '../utils/excelParser';
import { OcdSymbol } from './OcdLogo';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTasks: TaskRecord[];
  onImportSuccess: (result: ParseResult) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  existingTasks,
  onImportSuccess,
}) => {
  if (!isOpen) return null;

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const processFile = async (file: File, mode = importMode) => {
    setIsLoading(true);
    setErrorMessage('');
    setSelectedFile(file);

    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelFile(
        buffer, 
        file.name, 
        mode === 'merge' ? existingTasks : [], 
        mode
      );
      setParseResult(result);
    } catch (err: unknown) {
      console.error('Error parsing Excel:', err);
      const msg = err instanceof Error ? err.message : 'Error al procesar el archivo Excel';
      setErrorMessage(msg);
      setParseResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleModeToggle = (mode: 'replace' | 'merge') => {
    setImportMode(mode);
    if (selectedFile) {
      processFile(selectedFile, mode);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult) return;
    onImportSuccess(parseResult);
    onClose();
  };

  // Compute detected entities summary from parsed tasks
  const detectedVendedores = parseResult 
    ? Array.from(new Set(parseResult.tasks.map(t => t.vendedor).filter(Boolean)))
    : [];
  const detectedRutas = parseResult 
    ? Array.from(new Set(parseResult.tasks.map(t => t.ruta).filter(Boolean)))
    : [];
  const detectedPDVs = parseResult 
    ? Array.from(new Set(parseResult.tasks.map(t => t.codigoPDV).filter(Boolean)))
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#071D38]/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#D5E5ED] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#071D38] via-[#0B2F5B] to-[#0D386B] text-white px-6 py-4 flex items-center justify-between border-b border-[#2B98BA]/30">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-full border border-[#2B98BA]/40 shadow-xs shrink-0">
              <OcdSymbol size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#2B98BA]/30 text-[#4AC3E7] font-mono text-[10px] px-2 py-0.5 rounded border border-[#2B98BA]/40 font-bold">
                  DATA INGESTION
                </span>
                <h2 className="text-base font-black text-white">
                  Importación de Reportes Excel OCD
                </h2>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Oeste Centro de Distribución · Carga y Actualización de Auditorías
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#181B1E]">
          
          {/* Mode Selector */}
          <div className="bg-[#F2FAFD] border border-[#D5E5ED] p-3.5 rounded-xl space-y-2">
            <label className="font-black text-xs text-[#0B2F5B] uppercase tracking-wider block">
              Modo de Importación:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleModeToggle('replace')}
                className={`p-3 rounded-lg text-left transition-all border flex items-start gap-2.5 cursor-pointer ${
                  importMode === 'replace'
                    ? 'bg-white border-[#2B98BA] shadow-xs text-[#0B2F5B]'
                    : 'bg-white/50 border-transparent text-slate-500 hover:bg-white'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                  importMode === 'replace' ? 'border-[#2B98BA] bg-[#2B98BA]' : 'border-slate-300'
                }`}>
                  {importMode === 'replace' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="font-bold text-xs text-[#0B2F5B]">Reemplazar Base Completa</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Sustituye todos los datos actuales por las filas del nuevo archivo Excel.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleModeToggle('merge')}
                className={`p-3 rounded-lg text-left transition-all border flex items-start gap-2.5 cursor-pointer ${
                  importMode === 'merge'
                    ? 'bg-white border-[#2B98BA] shadow-xs text-[#0B2F5B]'
                    : 'bg-white/50 border-transparent text-slate-500 hover:bg-white'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                  importMode === 'merge' ? 'border-[#2B98BA] bg-[#2B98BA]' : 'border-slate-300'
                }`}>
                  {importMode === 'merge' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="font-bold text-xs text-[#0B2F5B]">Fusionar / Conservar Apelaciones</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Actualiza registros y mantiene intactos los descargos y resoluciones previas.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
            }}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              isDragging ? 'border-[#2B98BA] bg-[#EBF7FA]' : 'border-[#D5E5ED] bg-[#F8FCFD] hover:bg-[#F2FAFD]'
            }`}
          >
            <Upload className="w-10 h-10 text-[#2B98BA] mx-auto mb-2 opacity-80" />
            <h4 className="text-xs font-bold text-[#0B2F5B]">
              Arrastra tu archivo Excel (.xlsx, .xls) o CSV aquí
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Detección automática de vendedores, supervisores, rutas, códigos PDV y fotos.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <label className="cursor-pointer bg-[#2B98BA] hover:bg-[#2183A0] text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-xs active:scale-95">
                Seleccionar Archivo Excel
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              <button
                type="button"
                onClick={generateTemplateExcel}
                className="bg-white border border-[#D5E5ED] hover:bg-[#EBF7FA] text-[#0B2F5B] font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#2B98BA]" />
                Descargar Plantilla Modelo OCD
              </button>
            </div>
          </div>

          {/* Loading spinner */}
          {isLoading && (
            <div className="p-4 bg-[#F2FAFD] border border-[#2B98BA]/30 rounded-xl flex items-center justify-center gap-2 text-[#0B2F5B] font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin text-[#2B98BA]" />
              <span>Analizando y extrayendo estructura del Excel...</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs">Error al procesar archivo</div>
                <div className="text-[11px] mt-0.5 font-medium">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Preview Results */}
          {parseResult && (
            <div className="bg-[#F8FCFD] border border-[#D5E5ED] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#EBF3F7] pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs text-[#0B2F5B]">
                    Lectura Exitosa: {parseResult.batch.fileName}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#2B98BA] font-bold">
                  {parseResult.tasks.length} registros listos
                </span>
              </div>

              {/* Detected summary badges */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-white p-2.5 rounded-lg border border-[#D5E5ED]">
                  <div className="flex items-center justify-center gap-1 text-slate-500 text-[10px] uppercase font-bold mb-0.5">
                    <Users className="w-3 h-3 text-[#2B98BA]" />
                    Vendedores
                  </div>
                  <div className="text-base font-black text-[#0B2F5B]">
                    {detectedVendedores.length}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-[#D5E5ED]">
                  <div className="flex items-center justify-center gap-1 text-slate-500 text-[10px] uppercase font-bold mb-0.5">
                    <MapPin className="w-3 h-3 text-[#2B98BA]" />
                    Rutas / Zonas
                  </div>
                  <div className="text-base font-black text-[#0B2F5B]">
                    {detectedRutas.length}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-[#D5E5ED]">
                  <div className="flex items-center justify-center gap-1 text-slate-500 text-[10px] uppercase font-bold mb-0.5">
                    <Building2 className="w-3 h-3 text-[#2B98BA]" />
                    Puntos de Venta
                  </div>
                  <div className="text-base font-black text-[#0B2F5B]">
                    {detectedPDVs.length}
                  </div>
                </div>
              </div>

              {parseResult.errors.length > 0 && (
                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900 text-[11px] font-medium">
                  <span className="font-bold">Nota:</span> Se omitieron {parseResult.errors.length} filas con inconsistencias en el formato.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F7FBFD] border-t border-[#EBF3F7] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            disabled={!parseResult || isLoading}
            onClick={handleConfirmImport}
            className="bg-[#2B98BA] hover:bg-[#2183A0] text-white font-black text-xs px-5 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {importMode === 'replace' 
                ? 'Reemplazar y Actualizar Todo' 
                : 'Fusionar y Aplicar al Historial'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};

