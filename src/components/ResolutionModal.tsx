import React, { useState } from 'react';
import { 
  X, 
  Gavel, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  User, 
  Calendar, 
  Award,
  MessageSquare
} from 'lucide-react';
import { TaskRecord, UserRole } from '../types';
import { OcdSymbol } from './OcdLogo';

interface ResolutionModalProps {
  task: TaskRecord | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  onSubmitResolution: (
    taskId: string,
    dictamen: 'APROBADA' | 'RECHAZADA',
    comentario: string,
    puntajeAjustado: number,
    supervisorName: string
  ) => void;
}

export const ResolutionModal: React.FC<ResolutionModalProps> = ({
  task,
  isOpen,
  onClose,
  userRole,
  onSubmitResolution,
}) => {
  if (!isOpen || !task) return null;

  const [dictamen, setDictamen] = useState<'APROBADA' | 'RECHAZADA'>(
    task.dictamenResolucion || 'APROBADA'
  );
  const [comentario, setComentario] = useState(
    task.comentarioResolucion || ''
  );
  const [puntaje, setPuntaje] = useState<number>(
    task.puntajeAjustado !== undefined ? task.puntajeAjustado : task.puntajeBase
  );
  const [supervisorName, setSupervisorName] = useState(
    userRole.name || 'Supervisor Comercial OCD'
  );
  const [error, setError] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentario.trim()) {
      setError('Debes ingresar un comentario o justificativo del dictamen.');
      return;
    }

    const finalPuntaje = dictamen === 'APROBADA' ? Number(puntaje) : 0;

    onSubmitResolution(
      task.id,
      dictamen,
      comentario.trim(),
      finalPuntaje,
      supervisorName.trim()
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#071D38]/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-[#D5E5ED] overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#071D38] via-[#0B2F5B] to-[#0D386B] text-white px-6 py-4 flex items-center justify-between border-b border-[#2B98BA]/30">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-full border border-[#2B98BA]/40 shadow-xs shrink-0">
              <OcdSymbol size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#2B98BA]/30 text-[#4AC3E7] font-mono text-[10px] px-2 py-0.5 rounded border border-[#2B98BA]/40 font-bold">
                  SUPERVISIÓN OCD
                </span>
                <h2 className="text-base font-black text-white">
                  Dictamen de Resolución de Apelación
                </h2>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Auditoría Comercial OCD · {task.nombrePDV} ({task.codigoPDV}) · {task.nombreTarea}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#181B1E]">
          
          {/* Side by side comparison of Evidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Foto Original / Motivo de Rechazo */}
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-rose-950 font-bold mb-2">
                  <span className="flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Auditoría Original (Invalidada)
                  </span>
                  <span className="text-[10px] bg-rose-200 text-rose-950 px-2 py-0.5 rounded font-mono font-bold">
                    0 pts
                  </span>
                </div>

                <div className="bg-white rounded-lg border border-rose-200 overflow-hidden h-52 flex items-center justify-center mb-2">
                  {originalPhoto ? (
                    <img
                      src={getProxiedImageUrl(originalPhoto)}
                      alt="Foto original invalidada"
                      className="w-full h-full object-contain bg-slate-900"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-slate-400 text-center p-4">
                      Sin foto original registrada
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-rose-950">
                    Motivo: {task.motivoInvalidacion || 'Desvío en ejecución'}
                  </div>
                  {task.detalleInvalidacion && (
                    <p className="text-[11px] text-rose-800 italic bg-white/80 p-1.5 rounded border border-rose-200/50">
                      "{task.detalleInvalidacion}"
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-rose-200/60 text-[11px] text-rose-950">
                Tarea: <b>{task.nombreTarea}</b> ({task.categoriaTarea})
              </div>
            </div>

            {/* 2. Evidencia de Apelación del Vendedor */}
            <div className="bg-[#EBF7FA]/70 border border-[#2B98BA]/30 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[#0B2F5B] font-bold mb-2">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4 text-[#2B98BA]" />
                    Descargo del Vendedor: {task.vendedor}
                  </span>
                  <span className="text-[10px] bg-[#2B98BA]/20 text-[#0B2F5B] px-2 py-0.5 rounded font-mono font-bold">
                    {task.fechaApelacion ? new Date(task.fechaApelacion).toLocaleDateString('es-AR') : 'Reciente'}
                  </span>
                </div>

                <div className="bg-white rounded-lg border border-[#2B98BA]/30 overflow-hidden h-52 flex items-center justify-center mb-2">
                  {appealPhoto ? (
                    <img
                      src={getProxiedImageUrl(appealPhoto)}
                      alt="Foto de apelación de vendedor"
                      className="w-full h-full object-contain bg-slate-900"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-slate-400 text-center p-4">
                      Sin foto de apelación adjunta
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-[#0B2F5B]">
                    Justificación: {task.motivoApelacion || 'Sin motivo especificado'}
                  </div>
                  {task.comentariosVendedor && (
                    <p className="text-[11px] text-[#17657D] italic bg-white/80 p-1.5 rounded border border-[#2B98BA]/20 font-medium">
                      "{task.comentariosVendedor}"
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#2B98BA]/30 text-[11px] text-[#0B2F5B] font-semibold">
                Puntaje base a restituir: <b className="text-[#2B98BA]">+{task.puntajeBase} pts</b>
              </div>
            </div>

          </div>

          {/* Resolution Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            
            {/* Dictamen Choice Buttons */}
            <div>
              <label className="block text-xs font-bold text-[#0B2F5B] mb-2">
                Dictamen Final de Supervisión OCD *
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                
                <button
                  type="button"
                  onClick={() => setDictamen('APROBADA')}
                  className={`p-3.5 rounded-xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer ${
                    dictamen === 'APROBADA'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-[#D5E5ED] bg-[#F6FAFC] text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${dictamen === 'APROBADA' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-black text-xs">APROBAR APELACIÓN</div>
                    <div className="text-[11px] mt-0.5 text-emerald-800 font-medium">
                      Valida la corrección del vendedor y restituye los puntos de ejecución comercial.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDictamen('RECHAZADA')}
                  className={`p-3.5 rounded-xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer ${
                    dictamen === 'RECHAZADA'
                      ? 'border-rose-600 bg-rose-50 text-rose-950 shadow-xs ring-2 ring-rose-500/20'
                      : 'border-[#D5E5ED] bg-[#F6FAFC] text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <XCircle className={`w-5 h-5 shrink-0 mt-0.5 ${dictamen === 'RECHAZADA' ? 'text-rose-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-black text-xs">RECHAZAR APELACIÓN</div>
                    <div className="text-[11px] mt-0.5 text-rose-800 font-medium">
                      Mantiene la tarea como invalidada con 0 puntos asignados en la liquidación.
                    </div>
                  </div>
                </button>

              </div>
            </div>

            {/* Score & Supervisor Name row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0B2F5B] mb-1">
                  Supervisor Resolutor *
                </label>
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  className="w-full p-2 bg-[#F6FAFC] border border-[#D5E5ED] rounded-lg text-xs font-semibold text-[#181B1E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2B98BA]/30 focus:border-[#2B98BA]"
                  required
                />
              </div>

              {dictamen === 'APROBADA' && (
                <div>
                  <label className="block text-xs font-bold text-[#0B2F5B] mb-1 flex items-center justify-between">
                    <span>Puntaje Restituido *</span>
                    <span className="text-[11px] text-[#2B98BA] font-bold">Base: {task.puntajeBase} pts</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={puntaje}
                    onChange={(e) => setPuntaje(Number(e.target.value))}
                    className="w-full p-2 bg-[#F6FAFC] border border-[#D5E5ED] rounded-lg text-xs font-black text-emerald-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>
              )}
            </div>

            {/* Feedback Commentary */}
            <div>
              <label className="block text-xs font-bold text-[#0B2F5B] mb-1">
                Fundamentación del Dictamen / Devolución al Vendedor *
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Ej: Verificada la corrección en imagen panorámica. Se constata cumplimiento y se aprueba descargo..."
                rows={3}
                className="w-full p-2.5 bg-[#F6FAFC] border border-[#D5E5ED] rounded-lg text-xs text-[#181B1E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2B98BA]/30 focus:border-[#2B98BA] font-medium"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
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
                className={`font-black text-xs px-5 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition-all active:scale-95 text-white cursor-pointer ${
                  dictamen === 'APROBADA'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <Gavel className="w-3.5 h-3.5" />
                <span>Registrar Dictamen ({dictamen})</span>
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
