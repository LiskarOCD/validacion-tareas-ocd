import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileCheck2,
  Image as ImageIcon,
  MapPin,
  Send,
  User,
  XCircle,
} from 'lucide-react';

import { TaskRecord, UserRole } from '../types';

interface TaskTableProps {
  tasks: TaskRecord[];
  userRole: UserRole;
  onOpenAppeal: (task: TaskRecord) => void;
  onOpenResolution: (task: TaskRecord) => void;
  onOpenImageViewer: (
    task: TaskRecord,
    initialType?: 'original' | 'apelacion' | 'compare'
  ) => void;
}

const PAGE_SIZE = 50;

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  userRole,
  onOpenAppeal,
  onOpenImageViewer,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [tasks.length]);

  const totalPages = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const visibleTasks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return tasks.slice(start, start + PAGE_SIZE);
  }, [tasks, currentPage]);

  const firstVisible = tasks.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastVisible = Math.min(currentPage * PAGE_SIZE, tasks.length);

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#D5E5ED] p-12 text-center shadow-xs">
        <div className="w-12 h-12 bg-[#F2FAFD] text-[#2B98BA] rounded-full flex items-center justify-center mx-auto mb-3 border border-[#D5E5ED]">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#0B2F5B]">No se encontraron tareas registradas</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          No hay tareas que coincidan con los filtros seleccionados.
        </p>
      </div>
    );
  }

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    return url;
  };

  const goToPage = (page: number) => {
    const safePage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(safePage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageButtons = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let page = start; page <= end; page++) pages.push(page);
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="bg-white rounded-xl border border-[#D5E5ED] shadow-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-[#EBF3F7] bg-[#F7FBFD] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-black text-xs text-[#0B2F5B] uppercase tracking-wider">
            Tareas Comerciales OCD
          </span>
          <span className="bg-[#EBF7FA] text-[#17657D] border border-[#2B98BA]/30 text-xs px-2 py-0.5 rounded-full font-bold">
            {tasks.length.toLocaleString('es-AR')} registros
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Vista activa: <span className="font-bold text-[#0B2F5B]">{userRole.name}</span>
        </div>
      </div>

      <div className="px-4 py-2 bg-white border-b border-[#EBF3F7] flex items-center justify-between text-[11px] text-slate-500">
        <span>
          Mostrando <strong className="text-[#0B2F5B]">{firstVisible.toLocaleString('es-AR')}</strong> a{' '}
          <strong className="text-[#0B2F5B]">{lastVisible.toLocaleString('es-AR')}</strong> de{' '}
          <strong className="text-[#0B2F5B]">{tasks.length.toLocaleString('es-AR')}</strong>
        </span>
        <span>
          Página <strong className="text-[#0B2F5B]">{currentPage}</strong> de{' '}
          <strong className="text-[#0B2F5B]">{totalPages}</strong>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-[#F2FAFD] text-[#0B2F5B] uppercase font-black text-[11px] tracking-wider border-b border-[#D5E5ED]">
            <tr>
              <th className="py-3 px-3.5">Evidencia</th>
              <th className="py-3 px-3">Fecha / ID</th>
              <th className="py-3 px-3">Punto de Venta</th>
              <th className="py-3 px-3">Vendedor / Ruta</th>
              <th className="py-3 px-3">Tarea</th>
              <th className="py-3 px-3">Completada</th>
              <th className="py-3 px-3">Validación</th>
              <th className="py-3 px-3">Justificación</th>
              <th className="py-3 px-3.5 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#EBF3F7]">
            {visibleTasks.map((task) => {
              const isInvalid = task.estadoValidacion === 'INVALIDADA';
              const originalPhoto = task.urlFotoOriginal;

              return (
                <tr key={task.id} className="hover:bg-[#F2FAFD] transition-colors group">
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    {originalPhoto ? (
                      <button
                        type="button"
                        className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#D5E5ED] bg-slate-100 shadow-xs cursor-pointer"
                        onClick={() => onOpenImageViewer(task, 'original')}
                        title="Ver evidencia fotográfica"
                      >
                        <img
                          src={getImageUrl(originalPhoto)}
                          alt="Evidencia de la tarea"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            const img = e.currentTarget;
                            img.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-[#0B2F5B]/35 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Eye className="w-4 h-4" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-[#F2FAFC] border border-dashed border-[#D5E5ED] flex items-center justify-center text-slate-400" title="Sin imagen cargada">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-bold text-[#181B1E]">{task.fechaTarea}</div>
                    <div className="text-[10px] font-mono text-[#2B98BA] font-semibold">{task.id}</div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-bold text-[#181B1E] line-clamp-1">{task.nombrePDV}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      <span className="bg-[#EBF7FA] font-mono text-[10px] px-1 py-0.5 rounded text-[#17657D] font-bold border border-[#2B98BA]/20">
                        {task.codigoPDV}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-bold text-[#0B2F5B] flex items-center gap-1">
                      <User className="w-3 h-3 text-[#2B98BA]" />
                      <span>{task.vendedor}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#2B98BA]" />
                      <span className="truncate max-w-[140px]" title={task.ruta}>{task.ruta}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 max-w-xs">
                    <div className="font-bold text-[#181B1E] leading-tight">{task.nombreTarea}</div>
                    {task.categoriaTarea && (
                      <span className="inline-block mt-1 bg-[#F2FAFD] text-[#17657D] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#D5E5ED]">
                        {task.categoriaTarea}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    {task.completada ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
                        No completada
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    {task.estadoValidacion === 'VALIDADA' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Validada
                      </span>
                    ) : task.estadoValidacion === 'INVALIDADA' ? (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                          <XCircle className="w-3.5 h-3.5" /> Invalidada
                        </span>
                        {task.motivoInvalidacion && (
                          <div className="text-[11px] text-rose-700 mt-1 max-w-[180px] truncate" title={task.motivoInvalidacion}>
                            {task.motivoInvalidacion}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        Pendiente
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    {task.justificada ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <FileCheck2 className="w-3.5 h-3.5" /> Justificada
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Sin justificar</span>
                    )}
                  </td>

                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {originalPhoto && (
                        <button
                          type="button"
                          onClick={() => onOpenImageViewer(task, 'original')}
                          className="p-1.5 rounded-lg text-[#2B98BA] hover:text-[#0B2F5B] hover:bg-[#EBF7FA] transition-colors border border-transparent hover:border-[#2B98BA]/30 cursor-pointer"
                          title="Ver evidencia"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      {isInvalid && (task.estadoApelacion === 'SIN_APELAR' || task.estadoApelacion === 'RECHAZADA') && (
                        <button
                          type="button"
                          onClick={() => onOpenAppeal(task)}
                          className="bg-[#2B98BA] hover:bg-[#2183A0] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                          title="Presentar descargo"
                        >
                          <Send className="w-3 h-3" />
                          <span>Apelar</span>
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

      <div className="px-4 py-3 border-t border-[#D5E5ED] bg-[#F7FBFD] flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => goToPage(currentPage - 1)}
          className="px-3 py-1.5 rounded-lg border border-[#D5E5ED] bg-white text-[#0B2F5B] text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF7FA] transition-colors"
        >
          ← Anterior
        </button>

        <div className="flex items-center gap-1">
          {currentPage > 3 && (
            <>
              <button type="button" onClick={() => goToPage(1)} className="w-8 h-8 rounded-lg text-xs font-bold text-[#0B2F5B] hover:bg-[#EBF7FA]">1</button>
              <span className="px-1 text-slate-400">...</span>
            </>
          )}

          {pageButtons.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => goToPage(page)}
              className={page === currentPage
                ? 'w-8 h-8 rounded-lg text-xs font-bold bg-[#0B2F5B] text-white'
                : 'w-8 h-8 rounded-lg text-xs font-bold text-[#0B2F5B] hover:bg-[#EBF7FA]'}
            >
              {page}
            </button>
          ))}

          {currentPage < totalPages - 2 && (
            <>
              <span className="px-1 text-slate-400">...</span>
              <button type="button" onClick={() => goToPage(totalPages)} className="w-8 h-8 rounded-lg text-xs font-bold text-[#0B2F5B] hover:bg-[#EBF7FA]">{totalPages}</button>
            </>
          )}
        </div>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => goToPage(currentPage + 1)}
          className="px-3 py-1.5 rounded-lg border border-[#D5E5ED] bg-white text-[#0B2F5B] text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF7FA] transition-colors"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
};
