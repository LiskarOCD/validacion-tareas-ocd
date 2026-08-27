import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Image as ImageIcon, 
  Send, 
  Gavel, 
  Eye, 
  MapPin, 
  User, 
  Tag, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { TaskRecord, UserRole } from '../types';

interface TaskTableProps {
  tasks: TaskRecord[];
  userRole: UserRole;
  onOpenAppeal: (task: TaskRecord) => void;
  onOpenResolution: (task: TaskRecord) => void;
  onOpenImageViewer: (task: TaskRecord, initialType?: 'original' | 'apelacion' | 'compare') => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  userRole,
  onOpenAppeal,
  onOpenResolution,
  onOpenImageViewer,
}) => {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#D5E5ED] p-12 text-center shadow-xs">
        <div className="w-12 h-12 bg-[#F2FAFD] text-[#2B98BA] rounded-full flex items-center justify-center mx-auto mb-3 border border-[#D5E5ED]">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#0B2F5B]">No se encontraron tareas registradas</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          No hay tareas comerciales que coincidan con los filtros seleccionados o el criterio de búsqueda en este circuito.
        </p>
      </div>
    );
  }

  // Safe image url generator through proxy if needed
  const getProxiedImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    if (url.startsWith('http://') || url.startsWith('https://') || url.includes('drive.google.com') || url.includes('dropbox.com')) {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  return (
    <div className="bg-white rounded-xl border border-[#D5E5ED] shadow-xs overflow-hidden">
      
      {/* Table header bar */}
      <div className="px-4 py-3 border-b border-[#EBF3F7] bg-[#F7FBFD] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-black text-xs text-[#0B2F5B] uppercase tracking-wider">
            Listado de Auditoría & Tareas OCD
          </span>
          <span className="bg-[#EBF7FA] text-[#17657D] border border-[#2B98BA]/30 text-xs px-2 py-0.5 rounded-full font-bold">
            {tasks.length} registros
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Vista activa: <span className="font-bold text-[#0B2F5B]">{userRole.name}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-[#F2FAFD] text-[#0B2F5B] uppercase font-black text-[11px] tracking-wider border-b border-[#D5E5ED]">
            <tr>
              <th className="py-3 px-3.5">Evidencia</th>
              <th className="py-3 px-3">Fecha / ID</th>
              <th className="py-3 px-3">Punto de Venta (PDV)</th>
              <th className="py-3 px-3">Vendedor / Ruta</th>
              <th className="py-3 px-3">Tarea Comercial</th>
              <th className="py-3 px-3">Auditoría Campo</th>
              <th className="py-3 px-3">Apelación OCD</th>
              <th className="py-3 px-3 text-center">Puntaje</th>
              <th className="py-3 px-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBF3F7]">
            {tasks.map((task) => {
              const isInvalid = task.estadoValidacion === 'INVALIDADA';
              const hasAppealEvidence = Boolean(task.evidenciaApelacionUrl || task.evidenciaApelacionBase64);
              const originalPhoto = task.urlFotoOriginal;

              return (
                <tr 
                  key={task.id} 
                  className="hover:bg-[#F2FAFD] transition-colors group"
                >
                  
                  {/* Evidencia Thumbnail */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {originalPhoto ? (
                        <div 
                          className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#D5E5ED] cursor-pointer bg-slate-100 group/thumb shadow-xs"
                          onClick={() => onOpenImageViewer(task, 'original')}
                          title="Click para ampliar foto original de auditoría"
                        >
                          <img
                            src={getProxiedImageUrl(originalPhoto)}
                            alt="Evidencia original"
                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-[#0B2F5B]/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#F2FAFC] border border-dashed border-[#D5E5ED] flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}

                      {/* Side thumbnail if appeal evidence exists */}
                      {hasAppealEvidence && (
                        <div 
                          className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-[#2B98BA] cursor-pointer bg-[#EBF7FA] group/thumb shadow-xs"
                          onClick={() => onOpenImageViewer(task, 'apelacion')}
                          title="Click para ver foto de descargo del vendedor"
                        >
                          <img
                            src={getProxiedImageUrl(task.evidenciaApelacionBase64 || task.evidenciaApelacionUrl)}
                            alt="Evidencia apelación"
                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute bottom-0 inset-x-0 bg-[#0B2F5B]/90 text-[8px] text-[#4AC3E7] font-bold text-center py-0.2">
                            Apelación
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Fecha / ID */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-bold text-[#181B1E]">{task.fechaTarea}</div>
                    <div className="text-[10px] font-mono text-[#2B98BA] font-semibold">{task.id}</div>
                  </td>

                  {/* Punto de Venta */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-[#181B1E] line-clamp-1">{task.nombrePDV}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <span className="bg-[#EBF7FA] font-mono text-[10px] px-1 py-0.2 rounded text-[#17657D] font-bold border border-[#2B98BA]/20">
                        {task.codigoPDV}
                      </span>
                      {task.direccionPDV && (
                        <span className="truncate max-w-[140px]" title={task.direccionPDV}>
                          {task.direccionPDV}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Vendedor / Ruta */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-[#0B2F5B] flex items-center gap-1">
                      <User className="w-3 h-3 text-[#2B98BA]" />
                      <span>{task.vendedor}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#2B98BA]" />
                      <span className="truncate max-w-[140px]" title={task.ruta}>
                        {task.ruta}
                      </span>
                    </div>
                  </td>

                  {/* Tarea / Categoría */}
                  <td className="py-3 px-3 max-w-xs">
                    <div className="font-bold text-[#181B1E] leading-tight">
                      {task.nombreTarea}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="bg-[#F2FAFD] text-[#17657D] text-[10px] font-bold px-1.5 py-0.2 rounded border border-[#D5E5ED]">
                        {task.categoriaTarea}
                      </span>
                    </div>
                  </td>

                  {/* Estado Validación Inicial */}
                  <td className="py-3 px-3">
                    {task.estadoValidacion === 'VALIDADA' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Validada
                      </span>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Invalidada
                        </span>
                        {task.motivoInvalidacion && (
                          <div 
                            className="text-[11px] text-rose-700 mt-1 line-clamp-1 font-semibold"
                            title={`${task.motivoInvalidacion}: ${task.detalleInvalidacion || ''}`}
                          >
                            {task.motivoInvalidacion}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Estado Apelación */}
                  <td className="py-3 px-3">
                    {!isInvalid ? (
                      <span className="text-slate-400 text-xs italic">Aprobada directa</span>
                    ) : task.estadoApelacion === 'SIN_APELAR' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Sin Apelar
                      </span>
                    ) : task.estadoApelacion === 'EN_REVISION' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-black bg-[#EBF7FA] text-[#17657D] border border-[#2B98BA] animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-[#2B98BA]" />
                        En Revisión
                      </span>
                    ) : task.estadoApelacion === 'APROBADA' ? (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Apelación Aprobada
                        </span>
                        {task.supervisorResolutor && (
                          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            por {task.supervisorResolutor}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Apelación Rechazada
                        </span>
                        {task.supervisorResolutor && (
                          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            por {task.supervisorResolutor}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Puntaje */}
                  <td className="py-3 px-3 text-center">
                    <div className="font-black text-xs text-[#0B2F5B]">
                      {task.puntajeObtenido} / {task.puntajeBase}
                    </div>
                    {task.estadoApelacion === 'APROBADA' && (
                      <span className="text-[10px] text-emerald-700 font-bold block">
                        + restituido
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      {/* Button to view all photos & details */}
                      <button
                        type="button"
                        onClick={() => onOpenImageViewer(task, hasAppealEvidence ? 'compare' : 'original')}
                        className="p-1.5 rounded-lg text-[#2B98BA] hover:text-[#0B2F5B] hover:bg-[#EBF7FA] transition-colors border border-transparent hover:border-[#2B98BA]/30 cursor-pointer"
                        title="Ver fotos y comparación de evidencia"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Vendedor Action: Apelar / Re-apelar */}
                      {isInvalid && (task.estadoApelacion === 'SIN_APELAR' || task.estadoApelacion === 'RECHAZADA') && (
                        <button
                          type="button"
                          onClick={() => onOpenAppeal(task)}
                          className="bg-[#2B98BA] hover:bg-[#2183A0] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                          title="Presentar descargo / apelación con nueva foto"
                        >
                          <Send className="w-3 h-3" />
                          <span>Apelar</span>
                        </button>
                      )}

                      {/* Supervisor Action: Dictaminar Resolución */}
                      {userRole.role === 'SUPERVISOR' && isInvalid && task.estadoApelacion === 'EN_REVISION' && (
                        <button
                          type="button"
                          onClick={() => onOpenResolution(task)}
                          className="bg-[#0B2F5B] hover:bg-[#071D38] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-all active:scale-95 border border-[#2B98BA]/40 cursor-pointer"
                          title="Dictaminar resolución sobre la apelación"
                        >
                          <Gavel className="w-3 h-3 text-[#4AC3E7]" />
                          <span>Dictaminar</span>
                        </button>
                      )}

                      {/* If already resolved supervisor can re-evaluate */}
                      {userRole.role === 'SUPERVISOR' && (task.estadoApelacion === 'APROBADA' || task.estadoApelacion === 'RECHAZADA') && (
                        <button
                          type="button"
                          onClick={() => onOpenResolution(task)}
                          className="text-[#2B98BA] hover:text-[#0B2F5B] text-[11px] font-bold px-2 py-1 rounded hover:bg-[#EBF7FA] cursor-pointer"
                          title="Revisar o modificar dictamen"
                        >
                          Modificar
                        </button>
                      )}

                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
