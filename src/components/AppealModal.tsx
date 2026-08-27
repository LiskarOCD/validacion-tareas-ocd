import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Upload, 
  Link as LinkIcon, 
  AlertTriangle, 
  Image as ImageIcon, 
  CheckCircle2, 
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { TaskRecord } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { OcdSymbol } from './OcdLogo';

interface AppealModalProps {
  task: TaskRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitAppeal: (
    taskId: string, 
    motivoApelacion: string, 
    comentarios: string, 
    evidenciaUrl: string, 
    evidenciaBase64?: string
  ) => void;
}

const QUICK_REASONS = [
  'Se corrigió el desvío en el momento de la visita y se adjunta foto.',
  'En foto panorámica se constata cumplimiento total del estándar.',
  'La foto original presentaba reflejo/brillo; se adjunta foto nítida.',
  'El cliente reubicó el producto al estante correspondiente.',
  'El material POP se encuentra colocado y visible en fachada/acceso.',
  'Se verificó que el equipo de frío es 100% exclusivo de OCD.',
  'Error de geolocalización o cartel tapado momentáneamente.'
];

export const AppealModal: React.FC<AppealModalProps> = ({
  task,
  isOpen,
  onClose,
  onSubmitAppeal,
}) => {
  if (!isOpen || !task) return null;

  const [motivo, setMotivo] = useState(task.motivoApelacion || '');
  const [comentarios, setComentarios] = useState(task.comentariosVendedor || '');
  const [evidenceUrl, setEvidenceUrl] = useState(task.evidenciaApelacionUrl || '');
  const [evidenceBase64, setEvidenceBase64] = useState<string | undefined>(task.evidenciaApelacionBase64);
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('La imagen supera los 15MB. Elige una imagen más liviana.');
      return;
    }
    setError('');
    try {
      const compressed = await compressImage(file, 1200, 1200, 0.75);
      setEvidenceBase64(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setEvidenceBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) {
      setError('Debes ingresar o seleccionar el motivo del descargo / apelación.');
      return;
    }
    if (!evidenceBase64 && !evidenceUrl.trim()) {
      setError('Debes adjuntar una foto o enlace de evidencia fotográfica para respaldar la apelación.');
      return;
    }

    setIsSubmitting(true);
    try {
      onSubmitAppeal(
        task.id,
        motivo.trim(),
        comentarios.trim(),
        evidenceUrl.trim(),
        evidenceBase64
      );
      onClose();
    } catch {
      setError('Error al procesar la apelación. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProxiedImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    if (url.startsWith('http://') || url.startsWith('https://') || url.includes('drive.google.com') || url.includes('dropbox.com')) {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#071D38]/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-[#D5E5ED] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#071D38] via-[#0B2F5B] to-[#0D386B] text-white px-6 py-4 flex items-center justify-between border-b border-[#2B98BA]/30">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-full border border-[#2B98BA]/40 shadow-xs shrink-0">
              <OcdSymbol size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#2B98BA]/30 text-[#4AC3E7] font-mono text-[10px] px-2 py-0.5 rounded border border-[#2B98BA]/40 font-bold">
                  DESCARGO VENDEDOR
                </span>
                <h2 className="text-base font-black text-white">
                  Presentar Apelación de Tarea Invalidada
                </h2>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {task.nombrePDV} · {task.codigoPDV} · {task.nombreTarea}
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

        {/* Modal Content Scrollable */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#181B1E]">
          
          {/* Motivo del rechazo original */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider block">
                  Motivo de Invalidación por Auditoría:
                </span>
                <p className="text-xs font-bold text-rose-950 mt-0.5">
                  {task.motivoInvalidacion || 'Incumplimiento de estándar'}
                </p>
                {task.detalleInvalidacion && (
                  <p className="text-xs text-rose-800 mt-1 italic bg-white/70 p-2 rounded border border-rose-200/60 font-medium">
                    "{task.detalleInvalidacion}"
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-[11px] text-rose-800 font-semibold">
                  <span>Puntaje a recuperar: <b className="text-[#0B2F5B]">+{task.puntajeBase} pts</b></span>
                  <span>Vendedor: <b>{task.vendedor}</b></span>
                  <span>Ruta: <b>{task.ruta}</b></span>
                </div>
              </div>

              {/* Thumbnail of original photo */}
              {task.urlFotoOriginal && (
                <div className="shrink-0 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">Foto Auditoría</span>
                  <img
                    src={getProxiedImageUrl(task.urlFotoOriginal)}
                    alt="Original"
                    className="w-20 h-20 object-cover rounded-lg border border-rose-200 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Quick Reason Selector */}
            <div>
              <label className="block text-xs font-bold text-[#0B2F5B] mb-1.5 flex items-center justify-between">
                <span>Motivo / Justificación del Descargo *</span>
                <span className="text-[11px] font-normal text-slate-500">Selecciona una plantilla o escribe tu motivo</span>
              </label>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {QUICK_REASONS.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMotivo(r)}
                    className={`text-[11px] text-left px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                      motivo === r
                        ? 'bg-[#2B98BA] text-white border-[#2B98BA] font-bold shadow-xs'
                        : 'bg-[#F2FAFC] text-[#17657D] border-[#D5E5ED] hover:bg-[#E2F2F7] font-medium'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Detalla por qué la tarea debe ser reconsiderada y validada en Oeste Centro de Distribución..."
                rows={3}
                className="w-full p-2.5 bg-[#F6FAFC] border border-[#D5E5ED] rounded-lg text-xs text-[#181B1E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2B98BA]/30 focus:border-[#2B98BA] font-medium"
                required
              />
            </div>

            {/* Evidencia Fotográfica Nueva */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#0B2F5B]">
                  Nueva Evidencia Fotográfica de Respaldo *
                </label>
                <div className="flex items-center gap-1 bg-[#EBF3F7] p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setUploadMode('upload')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      uploadMode === 'upload' ? 'bg-white shadow-xs text-[#2B98BA]' : 'text-slate-600'
                    }`}
                  >
                    <Upload className="w-3 h-3 inline mr-1" />
                    Subir Foto de Galería / Cámara
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      uploadMode === 'url' ? 'bg-white shadow-xs text-[#2B98BA]' : 'text-slate-600'
                    }`}
                  >
                    <LinkIcon className="w-3 h-3 inline mr-1" />
                    Link Google Drive
                  </button>
                </div>
              </div>

              {uploadMode === 'upload' ? (
                <div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                    }}
                    className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                      isDragging ? 'border-[#2B98BA] bg-[#EBF7FA]' : 'border-[#D5E5ED] bg-[#F8FCFD] hover:bg-[#F2FAFD]'
                    }`}
                  >
                    {evidenceBase64 ? (
                      <div className="flex items-center justify-center gap-4">
                        <img
                          src={evidenceBase64}
                          alt="Evidencia cargada"
                          className="w-24 h-24 object-cover rounded-lg border border-[#2B98BA]/40 shadow-xs"
                        />
                        <div className="text-left">
                          <div className="flex items-center gap-1 text-emerald-700 font-black text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Foto comprimida y lista</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Se adjuntará al expediente para la revisión del supervisor.
                          </p>
                          <label className="mt-2 inline-block cursor-pointer text-[#2B98BA] hover:text-[#17657D] font-bold underline text-[11px]">
                            Cambiar imagen
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <ImageIcon className="w-8 h-8 text-[#2B98BA] mx-auto mb-2 opacity-80" />
                        <p className="text-xs font-bold text-[#0B2F5B]">
                          Arrastra tu foto de evidencia aquí o haz click para seleccionar
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Soporta formatos JPG, PNG, WEBP tomados con celular en el PDV.
                        </p>
                        <label className="mt-3 inline-block cursor-pointer bg-[#2B98BA] hover:bg-[#2183A0] text-white font-bold px-3.5 py-1.5 rounded-lg transition-all shadow-xs active:scale-95">
                          Examinar archivos
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 text-[#2B98BA] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={evidenceUrl}
                      onChange={(e) => setEvidenceUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/... o enlace público"
                      className="w-full pl-9 pr-3 py-2 bg-[#F6FAFC] border border-[#D5E5ED] rounded-lg text-xs text-[#181B1E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2B98BA]/30 focus:border-[#2B98BA] font-medium"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-[#2B98BA]" />
                    El sistema integra proxy automático para enlaces de Google Drive y Dropbox.
                  </p>
                </div>
              )}
            </div>

            {/* Comentarios adicionales */}
            <div>
              <label className="block text-xs font-bold text-[#0B2F5B] mb-1">
                Comentarios Adicionales (Opcional)
              </label>
              <input
                type="text"
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder="Ej: Aclaración para el supervisor OCD o referencia horaria..."
                className="w-full p-2 bg-[#F6FAFC] border border-[#D5E5ED] rounded-lg text-xs text-[#181B1E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2B98BA]/30 focus:border-[#2B98BA] font-medium"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Footer buttons */}
            <div className="pt-3 border-t border-[#EBF3F7] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#2B98BA] hover:bg-[#2183A0] text-white font-black text-xs px-5 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Apelación al Supervisor OCD</span>
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
