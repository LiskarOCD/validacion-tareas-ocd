import React, { useState } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  SplitSquareHorizontal, 
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MapPin,
  Eye,
  ExternalLink,
  Loader2,
  ImageOff
} from 'lucide-react';
import { TaskRecord } from '../types';
import { OcdSymbol } from './OcdLogo';

interface ImageViewerModalProps {
  task: TaskRecord | null;
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'original' | 'apelacion' | 'compare';
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  task,
  isOpen,
  onClose,
  initialMode = 'original',
}) => {
  if (!isOpen || !task) return null;

  const hasAppeal = Boolean(task.evidenciaApelacionUrl || task.evidenciaApelacionBase64);
  const [activeTab, setActiveTab] = useState<'original' | 'apelacion' | 'compare'>(
    hasAppeal && initialMode === 'compare' ? 'compare' : (initialMode === 'apelacion' && hasAppeal ? 'apelacion' : 'original')
  );

  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const getProxiedImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    if (url.startsWith('http://') || url.startsWith('https://') || url.includes('drive.google.com') || url.includes('dropbox.com')) {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const originalPhoto = task.urlFotoOriginal;
  const appealPhoto = task.evidenciaApelacionBase64 || task.evidenciaApelacionUrl;

  const currentRawUrl = activeTab === 'original' 
    ? originalPhoto 
    : (activeTab === 'apelacion' ? task.evidenciaApelacionUrl : originalPhoto);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#071D38]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0A2647] w-full max-w-5xl rounded-2xl shadow-2xl border border-[#2B98BA]/30 overflow-hidden flex flex-col max-h-[95vh] text-white">
        
        {/* Top bar */}
        <div className="px-5 py-3.5 border-b border-[#2B98BA]/30 flex items-center justify-between bg-[#071D38]">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-full border border-[#2B98BA]/40 shadow-xs shrink-0">
              <OcdSymbol size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] bg-[#2B98BA]/20 text-[#4AC3E7] px-2 py-0.5 rounded border border-[#2B98BA]/30 font-bold">
                  {task.codigoPDV}
                </span>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{task.nombrePDV}</span>
                  <span className="text-slate-400 font-normal">· {task.nombreTarea}</span>
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Vendedor: <b className="text-white">{task.vendedor}</b> · Ruta: <b className="text-white">{task.ruta}</b> · Fecha: {task.fechaTarea}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switcher */}
            <div className="bg-[#06182E] p-0.5 rounded-lg border border-[#2B98BA]/30 flex text-xs">
              <button
                type="button"
                onClick={() => { setActiveTab('original'); handleReset(); }}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  activeTab === 'original' ? 'bg-[#2B98BA] text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Foto Original
              </button>

              {hasAppeal && (
                <>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('apelacion'); handleReset(); }}
                    className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      activeTab === 'apelacion' ? 'bg-[#2B98BA] text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Foto Apelación
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('compare'); handleReset(); }}
                    className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      activeTab === 'compare' ? 'bg-[#2B98BA] text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <SplitSquareHorizontal className="w-3.5 h-3.5" />
                    Comparativa
                  </button>
                </>
              )}
            </div>

            {/* Direct Open Link */}
            {currentRawUrl && currentRawUrl.startsWith('http') && (
              <a
                href={currentRawUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#4AC3E7] hover:text-white bg-[#0B2F5B] border border-[#2B98BA]/40 p-1.5 rounded-lg hover:bg-[#2B98BA]/30 transition-colors flex items-center gap-1 text-xs font-semibold px-2.5"
                title="Abrir enlace original en pestaña nueva"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Abrir enlace</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Middle Canvas / Viewer */}
        <div className="flex-1 min-h-[360px] max-h-[56vh] bg-[#051324] relative overflow-hidden flex items-center justify-center p-4">
          
          {/* Controls Bar */}
          <div className="absolute top-3 right-3 z-10 bg-[#0A2647]/90 backdrop-blur-xs border border-[#2B98BA]/30 rounded-lg p-1 flex items-center gap-1 shadow-lg text-slate-300 text-xs">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-white/10 rounded hover:text-white cursor-pointer"
              title="Acercar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-white/10 rounded hover:text-white cursor-pointer"
              title="Alejar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 hover:bg-white/10 rounded hover:text-white cursor-pointer"
              title="Rotar 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-2 py-1 hover:bg-white/10 rounded hover:text-white text-[10px] font-bold cursor-pointer"
            >
              100%
            </button>
          </div>

          {/* View rendering */}
          {activeTab === 'compare' ? (
            <div className="grid grid-cols-2 gap-4 w-full h-full">
              
              {/* Left: Original */}
              <div className="relative border border-rose-900/50 rounded-xl overflow-hidden bg-[#07192C] flex flex-col">
                <div className="absolute top-2 left-2 z-10 bg-rose-950/90 border border-rose-700 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                  Foto Original Auditoría
                </div>
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                  <img
                    src={getProxiedImageUrl(originalPhoto)}
                    alt="Original"
                    className="max-w-full max-h-full object-contain transition-transform duration-200"
                    style={{ transform: `scale(${zoomLevel}) rotate(${rotation}deg)` }}
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Right: Apelacion */}
              <div className="relative border border-[#2B98BA]/40 rounded-xl overflow-hidden bg-[#07192C] flex flex-col">
                <div className="absolute top-2 left-2 z-10 bg-[#0B2F5B]/90 border border-[#2B98BA] text-[#4AC3E7] text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                  Evidencia Descargo Vendedor
                </div>
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                  <img
                    src={getProxiedImageUrl(appealPhoto)}
                    alt="Apelacion"
                    className="max-w-full max-h-full object-contain transition-transform duration-200"
                    style={{ transform: `scale(${zoomLevel}) rotate(${rotation}deg)` }}
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              <img
                src={getProxiedImageUrl(activeTab === 'original' ? originalPhoto : appealPhoto)}
                alt={activeTab === 'original' ? 'Foto Original' : 'Foto Apelación'}
                className="max-w-full max-h-full object-contain transition-transform duration-200 rounded-lg shadow-xl"
                style={{ transform: `scale(${zoomLevel}) rotate(${rotation}deg)` }}
                referrerPolicy="no-referrer"
              />
            </div>
          )}

        </div>

        {/* Bottom Details Footer */}
        <div className="p-4 bg-[#071D38] border-t border-[#2B98BA]/30 text-xs grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Status & Auditor motive */}
          <div className="bg-[#051324] p-3 rounded-xl border border-[#2B98BA]/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[#4AC3E7] font-bold text-[11px] uppercase">Estado de Auditoría</span>
              {task.estadoValidacion === 'VALIDADA' ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Validada ({task.puntajeBase} pts)
                </span>
              ) : (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Invalidada
                </span>
              )}
            </div>
            {task.motivoInvalidacion && (
              <p className="text-slate-200 font-semibold">{task.motivoInvalidacion}</p>
            )}
            {task.detalleInvalidacion && (
              <p className="text-[11px] text-slate-400 italic mt-1 font-medium">"{task.detalleInvalidacion}"</p>
            )}
          </div>

          {/* Appeal info */}
          <div className="bg-[#051324] p-3 rounded-xl border border-[#2B98BA]/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[#4AC3E7] font-bold text-[11px] uppercase">Descargo Vendedor OCD</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                task.estadoApelacion === 'APROBADA'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : task.estadoApelacion === 'RECHAZADA'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : task.estadoApelacion === 'EN_REVISION'
                  ? 'bg-[#0B2F5B] text-[#4AC3E7] border border-[#2B98BA]'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {task.estadoApelacion}
              </span>
            </div>
            {task.motivoApelacion ? (
              <>
                <p className="text-slate-200 font-medium">{task.motivoApelacion}</p>
                {task.comentariosVendedor && (
                  <p className="text-[11px] text-slate-400 italic mt-1">"{task.comentariosVendedor}"</p>
                )}
              </>
            ) : (
              <p className="text-slate-500 italic">Sin apelación registrada por el vendedor.</p>
            )}
          </div>

          {/* Supervisor resolution if any */}
          <div className="bg-[#051324] p-3 rounded-xl border border-[#2B98BA]/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[#4AC3E7] font-bold text-[11px] uppercase">Dictamen de Supervisión</span>
              {task.dictamenResolucion ? (
                <span className={`font-black text-[11px] ${
                  task.dictamenResolucion === 'APROBADA' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {task.dictamenResolucion}
                </span>
              ) : (
                <span className="text-slate-500">Pendiente de dictamen</span>
              )}
            </div>
            {task.comentarioResolucion ? (
              <>
                <p className="text-slate-200 font-medium">{task.comentarioResolucion}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Resolutor: <b className="text-white">{task.supervisorResolutor}</b> · Puntaje: <b className="text-[#4AC3E7]">{task.puntajeObtenido} pts</b>
                </p>
              </>
            ) : (
              <p className="text-slate-500 italic">No se ha emitido resolución aún.</p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
